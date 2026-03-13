package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.SimStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SimLifecycleProvider {

    private final Map<String, SimStatus> statuses = new ConcurrentHashMap<>();

    public SimStatus getStatus(String lineId) {
        return statuses.getOrDefault(lineId, SimStatus.ACTIVE);
    }

    public SimStatus setStatus(String lineId, SimStatus status) {
        statuses.put(lineId, status);
        return status;
    }
}
