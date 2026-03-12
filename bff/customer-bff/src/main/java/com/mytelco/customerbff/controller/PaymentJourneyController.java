package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import com.mytelco.customerbff.service.PaymentJourneyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

    public PaymentJourneyController(PaymentJourneyService paymentJourneyService) {
        this.paymentJourneyService = paymentJourneyService;
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
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @Valid @RequestBody CheckoutRequest request
    ) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.badRequest()
                .body(new CheckoutResponse("", "FAILED", "Idempotency-Key header is required", ""));
        }
        return ResponseEntity.ok(paymentJourneyService.checkout(request, idempotencyKey));
    }
}
