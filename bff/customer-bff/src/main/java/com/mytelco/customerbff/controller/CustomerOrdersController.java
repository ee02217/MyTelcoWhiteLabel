package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.CustomerOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/orders")
@Tag(name = "Customer Orders", description = "Order orchestration with idempotency and rollback notifications")
public class CustomerOrdersController {

    private final CustomerOrderService customerOrderService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public CustomerOrdersController(
        CustomerOrderService customerOrderService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.customerOrderService = customerOrderService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @PostMapping
    @Operation(summary = "Create an order")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Order created or idempotent replay returned"),
        @ApiResponse(responseCode = "400", description = "Missing idempotency key")
    })
    public ResponseEntity<CustomerOrderResponse> createOrder(
        Authentication authentication,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @Valid @RequestBody CustomerOrderCreateRequest request
    ) {
        try {
            String customerId = customerIdentityResolver.resolveCustomerId(authentication);
            familyRoleService.requirePermission(
                customerId,
                actingLineId,
                request.lineId(),
                FamilyPermission.MANAGE_PLAN
            );
            return ResponseEntity.ok(customerOrderService.create(request, idempotencyKey, customerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order by id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Order found")})
    public ResponseEntity<CustomerOrderResponse> getOrder(
        Authentication authentication,
        @PathVariable String orderId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        CustomerOrderResponse order = customerOrderService.getById(customerId, orderId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        familyRoleService.requirePermission(
            customerId,
            actingLineId,
            order.lineId(),
            FamilyPermission.VIEW_USAGE
        );

        return ResponseEntity.ok(order);
    }

    @GetMapping
    @Operation(summary = "List orders by line id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Orders returned")})
    public ResponseEntity<List<CustomerOrderResponse>> listOrders(
        Authentication authentication,
        @RequestParam String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(
            customerId,
            actingLineId,
            lineId,
            FamilyPermission.VIEW_USAGE
        );
        return ResponseEntity.ok(customerOrderService.listByLineId(customerId, lineId));
    }
}
