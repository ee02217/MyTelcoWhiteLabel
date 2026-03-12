package com.mytelco.customerbff;

import com.mytelco.customerbff.model.CheckoutRequest;
import com.mytelco.customerbff.model.CheckoutResponse;
import com.mytelco.customerbff.model.PaymentMethodRegistrationRequest;
import com.mytelco.customerbff.model.PaymentMethodRegistrationResponse;
import com.mytelco.customerbff.service.PaymentJourneyService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentJourneyServiceTest {

    private final PaymentJourneyService service = new PaymentJourneyService();

    @Test
    void checkout_shouldBeIdempotentForRepeatedKey() {
        PaymentMethodRegistrationResponse method = service.registerPaymentMethod(
            new PaymentMethodRegistrationRequest("Jane Doe", "4242", "VISA", "12/30")
        );

        CheckoutRequest request = new CheckoutRequest(method.token(), new BigDecimal("22.50"), "EUR", "INV-35");
        CheckoutResponse first = service.checkout(request, "idem-repeat");
        CheckoutResponse second = service.checkout(request, "idem-repeat");

        assertThat(second).isEqualTo(first);
        assertThat(second.status()).isEqualTo("SUCCESS");
    }

    @Test
    void checkout_shouldReturnFailureForUnsupportedScenario() {
        PaymentMethodRegistrationResponse method = service.registerPaymentMethod(
            new PaymentMethodRegistrationRequest("Jane Doe", "4242", "VISA", "12/30")
        );

        CheckoutRequest request = new CheckoutRequest(method.token(), new BigDecimal("999.99"), "EUR", "FAIL");
        CheckoutResponse response = service.checkout(request, "idem-fail");

        assertThat(response.status()).isEqualTo("FAILED");
        assertThat(response.message()).contains("declined");
    }
}
