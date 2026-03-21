package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.analytics.ProductAnalyticsService;
import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.PaymentJourneyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/payments")
@Tag(name = "Payment Journey", description = "Payment method registration and tokenized checkout")
public class PaymentJourneyController {

    private final PaymentJourneyService paymentJourneyService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final OperatorContextResolver operatorContextResolver;
    private final ProductAnalyticsService productAnalyticsService;

    public PaymentJourneyController(
        PaymentJourneyService paymentJourneyService,
        CustomerIdentityResolver customerIdentityResolver,
        OperatorContextResolver operatorContextResolver,
        ProductAnalyticsService productAnalyticsService
    ) {
        this.paymentJourneyService = paymentJourneyService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.operatorContextResolver = operatorContextResolver;
        this.productAnalyticsService = productAnalyticsService;
    }

    @PostMapping("/methods")
    @Operation(summary = "Register payment method")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Payment method registered")})
    public ResponseEntity<PaymentMethodRegistrationResponse> registerPaymentMethod(
        @Valid @RequestBody PaymentMethodRegistrationRequest request
    ) {
        return ResponseEntity.ok(paymentJourneyService.registerPaymentMethod(request));
    }

    @PostMapping("/checkout")
    @Operation(summary = "Perform tokenized checkout")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Checkout processed or replayed via idempotency"),
        @ApiResponse(responseCode = "400", description = "Missing idempotency key")
    })
    public ResponseEntity<CheckoutResponse> checkout(
        Authentication authentication,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @RequestHeader(value = "X-Operator-ID", required = false) String operatorId,
        @RequestHeader(value = "X-Channel", required = false) String channel,
        @RequestHeader(value = "X-Correlation-ID", required = false) String correlationId,
        @Valid @RequestBody CheckoutRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.badRequest()
                .body(new CheckoutResponse("", "FAILED", "Idempotency-Key header is required", ""));
        }

        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String resolvedOperatorId = resolveOperatorId(customerId, operatorId);
        String resolvedChannel = resolveChannel(channel);

        productAnalyticsService.trackBillPayCheckoutStarted(
            customerId,
            resolvedOperatorId,
            resolvedChannel,
            correlationId,
            request.billReference(),
            idempotencyKey,
            request.currency(),
            request.amount().toPlainString()
        );

        CheckoutResponse response = paymentJourneyService.checkout(request, idempotencyKey);

        productAnalyticsService.trackBillPayCheckoutCompleted(
            customerId,
            resolvedOperatorId,
            resolvedChannel,
            correlationId,
            request.billReference(),
            response.status(),
            response.transactionId()
        );

        return ResponseEntity.ok(response);
    }

    private String resolveOperatorId(String customerId, String operatorId) {
        if (operatorId != null && !operatorId.isBlank()) {
            return operatorId.trim();
        }
        return operatorContextResolver.resolveOperatorId(customerId);
    }

    private String resolveChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return "web";
        }
        return channel.trim().toLowerCase();
    }
}
