package com.mytelco.customerbff.service.persistence;

import com.fasterxml.jackson.core.type.TypeReference;

import java.util.function.Supplier;

public interface DurableStateStore {

    <T> T read(String stateKey, TypeReference<T> typeReference, Supplier<T> defaultSupplier);

    void write(String stateKey, Object payload);
}
