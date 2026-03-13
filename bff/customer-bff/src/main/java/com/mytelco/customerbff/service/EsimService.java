package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.EsimActivationResponse;
import com.mytelco.customerbff.model.EsimActivationStatus;
import com.mytelco.customerbff.provider.EsimProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class EsimService {

    private final EsimProvider provider;

    public EsimService(EsimProvider provider) {
        this.provider = provider;
    }

    public EsimActivationResponse activate(String lineId) {
        EsimProvider.EsimActivationState state = provider.activate(lineId);
        return toResponse(state);
    }

    public EsimActivationResponse getStatus(String lineId) {
        EsimProvider.EsimActivationState current = provider.get(lineId);
        if (current == null) {
            throw new IllegalArgumentException("No activation found for line");
        }

        EsimActivationStatus nextStatus = switch (current.status()) {
            case QR_GENERATED -> EsimActivationStatus.ACTIVATION_IN_PROGRESS;
            case ACTIVATION_IN_PROGRESS, ACTIVATED -> EsimActivationStatus.ACTIVATED;
        };

        EsimProvider.EsimActivationState updated = new EsimProvider.EsimActivationState(
            current.activationId(),
            current.lineId(),
            current.qrPayload(),
            current.qrReference(),
            nextStatus,
            current.pollCount() + 1,
            Instant.now()
        );
        provider.save(updated);
        return toResponse(updated);
    }

    private EsimActivationResponse toResponse(EsimProvider.EsimActivationState state) {
        return new EsimActivationResponse(
            state.lineId(),
            state.activationId(),
            state.qrPayload(),
            state.qrReference(),
            state.status(),
            state.updatedAt()
        );
    }
}
