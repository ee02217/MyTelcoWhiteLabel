package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.AlertInboxItem;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class AlertInboxService {

    private final Map<String, CopyOnWriteArrayList<AlertInboxItem>> inboxByCustomer = new ConcurrentHashMap<>();

    public void add(String customerId, AlertInboxItem item) {
        inboxByCustomer.computeIfAbsent(customerId, ignored -> new CopyOnWriteArrayList<>()).add(item);
    }

    public List<AlertInboxItem> list(String customerId) {
        return inboxByCustomer.getOrDefault(customerId, new CopyOnWriteArrayList<>())
            .stream()
            .sorted(Comparator.comparing(AlertInboxItem::createdAt).reversed())
            .toList();
    }
}
