package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.model.CustomerOrderCreateRequest;
import com.mytelco.customerbff.model.CustomerOrderResponse;
import com.mytelco.customerbff.model.OrderState;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class CustomerOrderService {

    private static final String CUSTOMER_ID = "12345";

    private final AlertInboxService alertInboxService;
    private final Map<String, CustomerOrderResponse> ordersById = new ConcurrentHashMap<>();
    private final Map<String, String> idempotencyToOrderId = new ConcurrentHashMap<>();
    private final Map<String, CopyOnWriteArrayList<String>> orderIdsByLineId = new ConcurrentHashMap<>();

    public CustomerOrderService(AlertInboxService alertInboxService) {
        this.alertInboxService = alertInboxService;
    }

    public CustomerOrderResponse create(CustomerOrderCreateRequest request, String idempotencyKeyFromHeader) {
        String idempotencyKey = resolveIdempotencyKey(request, idempotencyKeyFromHeader);
        String existingOrderId = idempotencyToOrderId.get(idempotencyKey);
        if (existingOrderId != null) {
            return ordersById.get(existingOrderId);
        }

        Instant createdAt = Instant.now();
        String orderId = "ord_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        CustomerOrderResponse order = new CustomerOrderResponse(
            orderId,
            request.lineId(),
            request.itemType(),
            request.itemCode(),
            idempotencyKey,
            OrderState.PENDING,
            false,
            "Order accepted",
            createdAt,
            createdAt
        );

        CustomerOrderResponse processing = transition(order, OrderState.PROCESSING, false, "Order is being processed");
        CustomerOrderResponse finalOrder;
        if (Boolean.TRUE.equals(request.simulateFailure()) || "FAIL".equalsIgnoreCase(request.itemCode())) {
            finalOrder = transition(processing, OrderState.FAILED, true, "Order failed. Rollback has been applied.");
            emitNotification(finalOrder, "ORDER_FAILED", finalOrder.notificationMessage());
        } else {
            finalOrder = transition(processing, OrderState.COMPLETED, false, "Order completed successfully");
            emitNotification(finalOrder, "ORDER_COMPLETED", finalOrder.notificationMessage());
        }

        CustomerOrderResponse prior = putIfAbsentIdempotent(idempotencyKey, finalOrder);
        return prior != null ? prior : finalOrder;
    }

    public CustomerOrderResponse getById(String orderId) {
        return ordersById.get(orderId);
    }

    public List<CustomerOrderResponse> listByLineId(String lineId) {
        List<String> ids = orderIdsByLineId.getOrDefault(lineId, new CopyOnWriteArrayList<>());
        List<CustomerOrderResponse> orders = new ArrayList<>();
        for (String id : ids) {
            CustomerOrderResponse order = ordersById.get(id);
            if (order != null) {
                orders.add(order);
            }
        }
        return orders;
    }

    public CustomerOrderResponse transition(CustomerOrderResponse current, OrderState nextState, boolean rollbackApplied, String message) {
        validateTransition(current.state(), nextState);
        return new CustomerOrderResponse(
            current.orderId(),
            current.lineId(),
            current.itemType(),
            current.itemCode(),
            current.idempotencyKey(),
            nextState,
            rollbackApplied,
            message,
            current.createdAt(),
            Instant.now()
        );
    }

    void validateTransition(OrderState from, OrderState to) {
        Map<OrderState, Set<OrderState>> validTransitions = Map.of(
            OrderState.PENDING, EnumSet.of(OrderState.PROCESSING),
            OrderState.PROCESSING, EnumSet.of(OrderState.COMPLETED, OrderState.FAILED),
            OrderState.COMPLETED, EnumSet.noneOf(OrderState.class),
            OrderState.FAILED, EnumSet.noneOf(OrderState.class)
        );

        if (!validTransitions.getOrDefault(from, Set.of()).contains(to)) {
            throw new IllegalStateException("Invalid order state transition from " + from + " to " + to);
        }
    }

    private String resolveIdempotencyKey(CustomerOrderCreateRequest request, String idempotencyKeyFromHeader) {
        String resolved = idempotencyKeyFromHeader;
        if (resolved == null || resolved.isBlank()) {
            resolved = request.idempotencyKey();
        }
        if (resolved == null || resolved.isBlank()) {
            throw new IllegalArgumentException("Idempotency key is required via Idempotency-Key header or request.idempotencyKey");
        }
        return resolved;
    }

    private void emitNotification(CustomerOrderResponse order, String actor, String message) {
        alertInboxService.add(
            CUSTOMER_ID,
            new AlertInboxItem(
                "order-alert-" + order.orderId(),
                CUSTOMER_ID,
                order.lineId(),
                "ORDER",
                0,
                0,
                "IN_APP",
                actor,
                message,
                Instant.now()
            )
        );
    }

    private CustomerOrderResponse putIfAbsentIdempotent(String idempotencyKey, CustomerOrderResponse order) {
        String previousOrderId = idempotencyToOrderId.putIfAbsent(idempotencyKey, order.orderId());
        if (previousOrderId != null) {
            return ordersById.get(previousOrderId);
        }

        ordersById.put(order.orderId(), order);
        orderIdsByLineId.computeIfAbsent(order.lineId(), ignored -> new CopyOnWriteArrayList<>()).add(order.orderId());
        return null;
    }
}
