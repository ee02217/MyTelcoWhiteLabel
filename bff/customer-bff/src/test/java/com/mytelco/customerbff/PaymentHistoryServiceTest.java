package com.mytelco.customerbff;

import com.mytelco.customerbff.model.PaymentHistoryResponse;
import com.mytelco.customerbff.model.PaymentRetryResponse;
import com.mytelco.customerbff.service.PaymentHistoryService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentHistoryServiceTest {

    private final PaymentHistoryService service = new PaymentHistoryService();

    @Test
    void getHistory_shouldDefaultAndCapToTwelveMonths() {
        PaymentHistoryResponse defaultWindow = service.getHistory(null);
        PaymentHistoryResponse cappedWindow = service.getHistory(24);

        assertThat(defaultWindow.months()).isEqualTo(12);
        assertThat(cappedWindow.months()).isEqualTo(12);
        assertThat(defaultWindow.payments()).extracting("paymentId").doesNotContain("pay_legacy");
        assertThat(cappedWindow.payments()).extracting("paymentId").doesNotContain("pay_legacy");
    }

    @Test
    void retryPayment_shouldBeIdempotent() {
        PaymentRetryResponse first = service.retryPayment("pay_002", "idem-retry-1");
        PaymentRetryResponse replay = service.retryPayment("pay_002", "idem-retry-1");

        assertThat(first.status()).isEqualTo("SUCCESS");
        assertThat(replay).isEqualTo(first);
    }

    @Test
    void retryPayment_shouldRejectMissingPayment() {
        PaymentRetryResponse missing = service.retryPayment("pay_missing", "idem-missing");
        assertThat(missing.status()).isEqualTo("NOT_FOUND");
    }
}
