package com.mytelco.customerbff.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.mytelco.customerbff.model.AlertInboxItem;
import com.mytelco.customerbff.service.persistence.DurableStateStore;
import com.mytelco.customerbff.service.persistence.NoopDurableStateStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AlertInboxService {

    private static final String STATE_KEY = "alert-inbox-state";
    private static final int SCHEMA_VERSION = 1;

    private final Map<String, CopyOnWriteArrayList<AlertInboxItem>> inboxByCustomer = new ConcurrentHashMap<>();
    private DurableStateStore durableStateStore = NoopDurableStateStore.INSTANCE;

    @Autowired(required = false)
    public void setDurableStateStore(DurableStateStore durableStateStore) {
        this.durableStateStore = durableStateStore;
        loadState();
    }

    public void add(String customerId, AlertInboxItem item) {
        inboxByCustomer.computeIfAbsent(customerId, ignored -> new CopyOnWriteArrayList<>()).add(item);
        persistState();
    }

    public List<AlertInboxItem> list(String customerId) {
        return inboxByCustomer.getOrDefault(customerId, new CopyOnWriteArrayList<>())
            .stream()
            .sorted(Comparator.comparing(AlertInboxItem::createdAt).reversed())
            .toList();
    }

    private void loadState() {
        AlertInboxState state = durableStateStore.read(
            STATE_KEY,
            new TypeReference<>() {
            },
            AlertInboxState::empty
        );

        inboxByCustomer.clear();
        state.inboxByCustomer().forEach((customerId, items) ->
            inboxByCustomer.put(customerId, new CopyOnWriteArrayList<>(items))
        );
    }

    private void persistState() {
        Map<String, List<AlertInboxItem>> snapshot = new ConcurrentHashMap<>();
        inboxByCustomer.forEach((customerId, items) -> snapshot.put(customerId, List.copyOf(items)));
        durableStateStore.write(STATE_KEY, new AlertInboxState(SCHEMA_VERSION, snapshot));
    }

    private record AlertInboxState(int schemaVersion, Map<String, List<AlertInboxItem>> inboxByCustomer) {
        private static AlertInboxState empty() {
            return new AlertInboxState(SCHEMA_VERSION, Map.of());
        }
    }
}
