package com.mytelco.customerbff;

import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.OrderState;
import com.mytelco.customerbff.service.AlertInboxService;
import com.mytelco.customerbff.service.CustomerOrderService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CustomerOrderServiceTest {

    private final AlertInboxService alertInboxService = new AlertInboxService();
    private final CustomerOrderService service = new CustomerOrderService(alertInboxService);

    @Test
    void transitionValidation_shouldRejectInvalidTransitions() {
        CustomerOrderResponse order = service.create(
            new CustomerOrderCreateRequest("line-1", "PLAN", "PLAN-XL", "idem-transition", false),
            null
        );

        assertThat(order.state()).isEqualTo(OrderState.COMPLETED);
        assertThatThrownBy(() -> service.transition(order, OrderState.PROCESSING, false, "invalid"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Invalid order state transition");
    }

    @Test
    void create_shouldBeIdempotentForSameKey() {
        CustomerOrderCreateRequest request = new CustomerOrderCreateRequest(
            "line-2",
            "ADDON",
            "ADDON-ROAM",
            null,
            false
        );

        CustomerOrderResponse first = service.create(request, "idem-order-1");
        CustomerOrderResponse replay = service.create(request, "idem-order-1");

        assertThat(replay.orderId()).isEqualTo(first.orderId());
        assertThat(replay.state()).isEqualTo(OrderState.COMPLETED);
    }

    @Test
    void create_failure_shouldSetRollbackAndEmitNotification() {
        CustomerOrderResponse failed = service.create(
            new CustomerOrderCreateRequest("line-3", "PLAN", "FAIL", "idem-fail-order", true),
            null
        );

        assertThat(failed.state()).isEqualTo(OrderState.FAILED);
        assertThat(failed.rollbackApplied()).isTrue();
        assertThat(alertInboxService.list("12345"))
            .anySatisfy(item -> {
                assertThat(item.service()).isEqualTo("ORDER");
                assertThat(item.lineId()).isEqualTo("line-3");
                assertThat(item.message()).contains("Rollback has been applied");
            });
    }
}
