package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.CustomerDashboardResponse;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.tmf.TmfAccount;
import com.mytelco.customerbff.model.tmf.TmfBill;
import com.mytelco.customerbff.model.tmf.TmfProductOffering;
import com.mytelco.customerbff.model.tmf.TmfProductOrder;
import com.mytelco.customerbff.model.tmf.TmfProductOrderCreateRequest;
import com.mytelco.customerbff.service.CatalogService;
import com.mytelco.customerbff.service.CustomerAggregationService;
import com.mytelco.customerbff.service.CustomerOrderService;
import com.mytelco.customerbff.service.tmf.TmfFacadeMappingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/tmf")
@Tag(name = "TMF Facade", description = "MVP TMF-compatible facade endpoints for catalog, order, account and billing")
public class TmfFacadeController {

    private final CatalogService catalogService;
    private final CustomerOrderService customerOrderService;
    private final CustomerAggregationService customerAggregationService;
    private final TmfFacadeMappingService mappingService;

    public TmfFacadeController(
        CatalogService catalogService,
        CustomerOrderService customerOrderService,
        CustomerAggregationService customerAggregationService,
        TmfFacadeMappingService mappingService
    ) {
        this.catalogService = catalogService;
        this.customerOrderService = customerOrderService;
        this.customerAggregationService = customerAggregationService;
        this.mappingService = mappingService;
    }

    @GetMapping("/productOffering/{id}")
    public ResponseEntity<TmfProductOffering> getProductOffering(
        @PathVariable String id,
        @RequestParam String lineId,
        @RequestParam String operatorId
    ) {
        return catalogService.getCatalog(lineId, operatorId, null).offers().stream()
            .filter(o -> o.offerId().equals(id))
            .findFirst()
            .map(mappingService::toProductOffering)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/productOrder")
    public ResponseEntity<TmfProductOrder> createProductOrder(
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @RequestBody TmfProductOrderCreateRequest request
    ) {
        CustomerOrderResponse order = customerOrderService.create(
            new CustomerOrderCreateRequest(
                request.lineId(),
                request.itemType() == null ? "add" : request.itemType(),
                request.productOfferingId(),
                request.externalId(),
                request.simulateFailure()
            ),
            idempotencyKey
        );
        return ResponseEntity.ok(mappingService.toProductOrder(order, request.externalId()));
    }

    @GetMapping("/productOrder/{id}")
    public ResponseEntity<TmfProductOrder> getProductOrder(
        @PathVariable String id,
        @RequestParam(required = false) String externalId
    ) {
        CustomerOrderResponse order = customerOrderService.getById(id);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mappingService.toProductOrder(order, externalId));
    }

    @GetMapping("/account/{id}")
    public ResponseEntity<TmfAccount> getAccount(@PathVariable String id) {
        CustomerDashboardResponse dashboard = customerAggregationService.getDashboard(id);
        return ResponseEntity.ok(mappingService.toAccount(dashboard.accountSummary()));
    }

    @GetMapping("/bill/{id}")
    public ResponseEntity<TmfBill> getBill(@PathVariable String id, @RequestParam String customerId) {
        CustomerDashboardResponse dashboard = customerAggregationService.getDashboard(customerId);
        return ResponseEntity.ok(mappingService.toBill(id, dashboard.billingSummary()));
    }
}
