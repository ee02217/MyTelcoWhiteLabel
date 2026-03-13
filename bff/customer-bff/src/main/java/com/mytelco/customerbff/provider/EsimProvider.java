package com.mytelco.customerbff.provider;

import com.mytelco.customerbff.model.EsimActivationStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EsimProvider {

    private final Map<String, EsimActivationState> states = new ConcurrentHashMap<>();

    public EsimActivationState activate(String lineId) {
        EsimActivationState state = new EsimActivationState(
            "esim_" + UUID.randomUUID(),
            lineId,
            "LPA:1$mytelco.example$" + lineId,
            "QR-" + lineId,
            EsimActivationStatus.QR_GENERATED,
            0,
            Instant.now()
        );
        states.put(lineId, state);
        return state;
    }

    public EsimActivationState get(String lineId) {
        return states.get(lineId);
    }

    public EsimActivationState save(EsimActivationState state) {
        states.put(state.lineId(), state);
        return state;
    }

    public record EsimActivationState(
        String activationId,
        String lineId,
        String qrPayload,
        String qrReference,
        EsimActivationStatus status,
        int pollCount,
        Instant updatedAt
    ) {}
}
