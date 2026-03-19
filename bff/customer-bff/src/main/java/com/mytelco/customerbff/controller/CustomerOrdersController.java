package com.mytelco.customerbff.controller;

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

    public CustomerOrdersController(
        CustomerOrderService customerOrderService,
        CustomerIdentityResolver customerIdentityResolver
    ) {
        this.customerOrderService = customerOrderService;
        this.customerIdentityResolver = customerIdentityResolver;
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
        @Valid @RequestBody CustomerOrderCreateRequest request
    ) {
        try {
            String customerId = customerIdentityResolver.resolveCustomerId(authentication);
            return ResponseEntity.ok(customerOrderService.create(request, idempotencyKey, customerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get order by id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Order found")})
    public ResponseEntity<CustomerOrderResponse> getOrder(Authentication authentication, @PathVariable String orderId) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        CustomerOrderResponse order = customerOrderService.getById(customerId, orderId);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping
    @Operation(summary = "List orders by line id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Orders returned")})
    public ResponseEntity<List<CustomerOrderResponse>> listOrders(Authentication authentication, @RequestParam String lineId) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(customerOrderService.listByLineId(customerId, lineId));
    }
}
