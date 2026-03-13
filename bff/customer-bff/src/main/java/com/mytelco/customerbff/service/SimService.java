package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.SimStatus;
import com.mytelco.customerbff.provider.SimLifecycleProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SimService {

    private final SimLifecycleProvider provider;

    public SimService(SimLifecycleProvider provider) {
        this.provider = provider;
    }

    public SimActionResponse block(String lineId) {
        return transition(lineId, SimStatus.BLOCKED, "SIM blocked");
    }

    public SimActionResponse unblock(String lineId) {
        return transition(lineId, SimStatus.ACTIVE, "SIM unblocked");
    }

    private SimActionResponse transition(String lineId, SimStatus target, String message) {
        SimStatus previous = provider.getStatus(lineId);
        SimStatus current = provider.setStatus(lineId, target);
        return new SimActionResponse(lineId, previous, current, Instant.now(), message);
    }
}
