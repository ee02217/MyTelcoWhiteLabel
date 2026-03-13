package com.mytelco.customerbff;

import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationCategoryPreferenceUpdate;
import com.mytelco.customerbff.model.NotificationChannel;
import com.mytelco.customerbff.model.NotificationDeliveryStatus;
import com.mytelco.customerbff.model.NotificationInboxItem;
import com.mytelco.customerbff.model.NotificationPreferencesUpdateRequest;
import com.mytelco.customerbff.model.NotificationTestSendRequest;
import com.mytelco.customerbff.service.NotificationCenterService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationCenterServiceTest {

    private final NotificationCenterService service = new NotificationCenterService();

    @Test
    void testSend_shouldStoreMultiChannelDeliveryStatusesInInbox() {
        NotificationInboxItem item = service.sendTestNotification("12345", new NotificationTestSendRequest(
            "Plan updated",
            "Your plan upgrade is active.",
            NotificationCategory.ORDERS,
            List.of(NotificationChannel.PUSH, NotificationChannel.EMAIL),
            List.of(NotificationChannel.EMAIL)
        ));

        assertThat(item.deliveries()).extracting("channel")
            .contains(NotificationChannel.PUSH, NotificationChannel.EMAIL);
        assertThat(item.deliveries()).extracting("status")
            .contains(NotificationDeliveryStatus.QUEUED, NotificationDeliveryStatus.SENT)
            .contains(NotificationDeliveryStatus.DELIVERED, NotificationDeliveryStatus.FAILED);

        List<NotificationInboxItem> inbox = service.getInbox("12345");
        assertThat(inbox).isNotEmpty();
        assertThat(inbox.getFirst().notificationId()).isEqualTo(item.notificationId());
    }

    @Test
    void preferencesUpdate_shouldPersistAndAffectTargetChannels() {
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
    }

    @Test
    void shouldRecordDeliveryLifecycleTransitionsPerChannel() {
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
                NotificationDeliveryStatus.DELIVERED
            );
    }
}
