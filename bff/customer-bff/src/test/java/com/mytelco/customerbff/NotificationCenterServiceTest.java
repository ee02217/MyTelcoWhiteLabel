package com.mytelco.customerbff;

import com.mytelco.customerbff.config.NotificationDeliveryProperties;
import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationCategoryPreferenceUpdate;
import com.mytelco.customerbff.model.NotificationChannel;
import com.mytelco.customerbff.model.NotificationDeliveryStatus;
import com.mytelco.customerbff.model.NotificationInboxItem;
import com.mytelco.customerbff.model.NotificationPreferencesUpdateRequest;
import com.mytelco.customerbff.model.NotificationTestSendRequest;
import com.mytelco.customerbff.service.NotificationCenterService;
import com.mytelco.customerbff.service.NotificationDeliveryAdapter;
import com.mytelco.customerbff.service.NotificationDeliveryResult;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationCenterServiceTest {

    @Test
    void testSend_shouldRetryOnProviderFailureAndEventuallyDeliver() {
        AtomicInteger attempts = new AtomicInteger();
        NotificationDeliveryAdapter adapter = request -> {
            if (request.channel() == NotificationChannel.EMAIL && attempts.incrementAndGet() == 1) {
                return NotificationDeliveryResult.failed("stub", "TRANSIENT_ERROR", "temporary provider failure");
            }
            return NotificationDeliveryResult.delivered("stub", "provider-ref-" + request.attempt());
        };

        NotificationCenterService service = newService(adapter, 3);

        NotificationInboxItem item = service.sendTestNotification("12345", new NotificationTestSendRequest(
            "Plan updated",
            "Your plan upgrade is active.",
            NotificationCategory.ORDERS,
            List.of(NotificationChannel.EMAIL),
            List.of()
        ));

        assertThat(item.deliveries())
            .filteredOn(delivery -> delivery.channel() == NotificationChannel.EMAIL)
            .extracting("status")
            .containsExactly(
                NotificationDeliveryStatus.QUEUED,
                NotificationDeliveryStatus.SENT,
                NotificationDeliveryStatus.FAILED,
                NotificationDeliveryStatus.SENT,
                NotificationDeliveryStatus.DELIVERED
            );

        assertThat(item.deliveries())
            .filteredOn(delivery -> delivery.channel() == NotificationChannel.EMAIL)
            .extracting("attempt")
            .containsExactly(0, 1, 1, 2, 2);
    }

    @Test
    void preferencesUpdate_shouldPersistAndSuppressDisabledChannels() {
        EnumMap<NotificationChannel, Integer> channelCallCounts = new EnumMap<>(NotificationChannel.class);
        NotificationDeliveryAdapter adapter = request -> {
            channelCallCounts.merge(request.channel(), 1, Integer::sum);
            return NotificationDeliveryResult.delivered("stub", "ref-" + request.channel() + "-" + request.attempt());
        };

        NotificationCenterService service = newService(adapter, 2);

        service.updatePreferences("12345", new NotificationPreferencesUpdateRequest(List.of(
            new NotificationCategoryPreferenceUpdate(
                NotificationCategory.BILLING,
                Map.of(NotificationChannel.SMS, false, NotificationChannel.EMAIL, true)
            )
        )), "customer");

        NotificationInboxItem item = service.sendTestNotification("12345", new NotificationTestSendRequest(
            "Invoice due",
            "Your invoice is due tomorrow.",
            NotificationCategory.BILLING,
            List.of(NotificationChannel.SMS, NotificationChannel.EMAIL),
            List.of()
        ));

        assertThat(item.deliveries()).extracting("channel")
            .contains(NotificationChannel.EMAIL)
            .doesNotContain(NotificationChannel.SMS);

        assertThat(channelCallCounts.getOrDefault(NotificationChannel.SMS, 0)).isZero();
        assertThat(channelCallCounts.getOrDefault(NotificationChannel.EMAIL, 0)).isEqualTo(1);
    }

    @Test
    void shouldRecordTerminalFailureAfterMaxRetries() {
        NotificationDeliveryAdapter adapter = request ->
            NotificationDeliveryResult.failed("stub", "PERMANENT_ERROR", "provider rejected payload");

        NotificationCenterService service = newService(adapter, 2);

        NotificationInboxItem item = service.sendTestNotification("12345", new NotificationTestSendRequest(
            "Security event",
            "New sign in detected.",
            NotificationCategory.SECURITY,
            List.of(NotificationChannel.IN_APP),
            List.of()
        ));

        assertThat(item.deliveries())
            .filteredOn(delivery -> delivery.channel() == NotificationChannel.IN_APP)
            .extracting("status")
            .containsExactly(
                NotificationDeliveryStatus.QUEUED,
                NotificationDeliveryStatus.SENT,
                NotificationDeliveryStatus.FAILED,
                NotificationDeliveryStatus.SENT,
                NotificationDeliveryStatus.FAILED
            );

        var inAppDeliveries = item.deliveries().stream()
            .filter(delivery -> delivery.channel() == NotificationChannel.IN_APP)
            .toList();
        assertThat(inAppDeliveries.get(inAppDeliveries.size() - 1).errorCode()).isEqualTo("PERMANENT_ERROR");
    }

    private NotificationCenterService newService(NotificationDeliveryAdapter adapter, int maxAttempts) {
        NotificationDeliveryProperties properties = new NotificationDeliveryProperties();
        properties.getDelivery().setProvider("stub");
        properties.getDelivery().setMaxAttempts(maxAttempts);
        properties.getDelivery().setRetryBackoff(Duration.ZERO);
        return new NotificationCenterService(adapter, properties);
    }
}
