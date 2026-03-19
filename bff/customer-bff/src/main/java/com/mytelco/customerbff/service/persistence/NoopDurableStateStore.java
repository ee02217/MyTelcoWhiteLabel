package com.mytelco.customerbff.service.persistence;

import com.fasterxml.jackson.core.type.TypeReference;

import java.util.function.Supplier;

public final class NoopDurableStateStore implements DurableStateStore {

    public static final NoopDurableStateStore INSTANCE = new NoopDurableStateStore();

    private NoopDurableStateStore() {
    }

    @Override
    public <T> T read(String stateKey, TypeReference<T> typeReference, Supplier<T> defaultSupplier) {
        return defaultSupplier.get();
    }

    @Override
    public void write(String stateKey, Object payload) {
        // intentionally no-op
    }
}
