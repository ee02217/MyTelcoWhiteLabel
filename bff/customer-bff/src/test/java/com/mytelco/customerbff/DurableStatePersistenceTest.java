package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mytelco.customerbff.config.NotificationDeliveryProperties;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationTestSendRequest;
import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.service.AlertInboxService;
import com.mytelco.customerbff.service.CustomerOrderService;
import com.mytelco.customerbff.service.NotificationCenterService;
import com.mytelco.customerbff.service.NotificationDeliveryAdapter;
import com.mytelco.customerbff.service.NotificationDeliveryResult;
import com.mytelco.customerbff.service.SupportCaseService;
import com.mytelco.customerbff.service.SupportCaseSlaService;
import com.mytelco.customerbff.service.persistence.JsonFileDurableStateStore;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DurableStatePersistenceTest {

    private static final String CUSTOMER_ID = "cust-1";

    @TempDir
    Path tempDir;

    @Test
    void orderStateAndIdempotencyShouldSurviveServiceRestart() {
        JsonFileDurableStateStore stateStore = newStateStore(tempDir);

        AlertInboxService firstAlertInboxService = new AlertInboxService();
        firstAlertInboxService.setDurableStateStore(stateStore);
        CustomerOrderService firstOrderService = new CustomerOrderService(firstAlertInboxService);
        firstOrderService.setDurableStateStore(stateStore);

        CustomerOrderCreateRequest request = new CustomerOrderCreateRequest("line-1", "ADDON", "ADDON-5G", null, false);
        var firstOrder = firstOrderService.create(request, "idem-restart-1", CUSTOMER_ID);

        AlertInboxService secondAlertInboxService = new AlertInboxService();
        secondAlertInboxService.setDurableStateStore(stateStore);
        CustomerOrderService secondOrderService = new CustomerOrderService(secondAlertInboxService);
        secondOrderService.setDurableStateStore(stateStore);

        var replay = secondOrderService.create(request, "idem-restart-1", CUSTOMER_ID);

        assertThat(replay.orderId()).isEqualTo(firstOrder.orderId());
        assertThat(secondOrderService.getById(CUSTOMER_ID, firstOrder.orderId())).isNotNull();
    }

    @Test
    void notificationInboxAndPreferencesShouldSurviveServiceRestart() {
        JsonFileDurableStateStore stateStore = newStateStore(tempDir);

        NotificationCenterService firstService = newNotificationCenterService(stateStore);
        firstService.sendTestNotification(
            "12345",
            new NotificationTestSendRequest(
                "Invoice due",
                "Invoice due tomorrow",
                NotificationCategory.BILLING,
                List.of(),
                List.of()
            )
        );

        NotificationCenterService secondService = newNotificationCenterService(stateStore);

        assertThat(secondService.getInbox("12345")).hasSize(1);
        assertThat(secondService.getPreferences("12345").categories()).isNotEmpty();
    }


    private JsonFileDurableStateStore newStateStore(Path baseDir) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new JsonFileDurableStateStore(mapper, baseDir.toString());
    }

    private NotificationCenterService newNotificationCenterService(JsonFileDurableStateStore stateStore) {
        NotificationDeliveryAdapter adapter = request ->
            NotificationDeliveryResult.delivered("stub", "ref-" + request.notificationId() + "-" + request.attempt());

        NotificationDeliveryProperties properties = new NotificationDeliveryProperties();
        properties.getDelivery().setProvider("stub");
        properties.getDelivery().setMaxAttempts(2);

        NotificationCenterService service = new NotificationCenterService(adapter, properties);
        service.setDurableStateStore(stateStore);
        return service;
    }
}
