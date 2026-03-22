package com.mytelco.customerbff.operator;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class OperatorAdapterRegistry {

    private final List<OperatorAdapter> adapters;

    public OperatorAdapterRegistry(List<OperatorAdapter> adapters) {
        this.adapters = adapters;
    }

    public OperatorAdapter resolve(String operatorId) {
        return adapters.stream()
            .filter(adapter -> adapter.supportsOperator(operatorId))
            .findFirst()
            .orElseThrow(() -> OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.NOT_FOUND,
                "registry",
                "No operator adapter registered for operatorId=" + operatorId +
                    "; available=" + availableAdapterIds(),
                null
            ));
    }

    private String availableAdapterIds() {
        return adapters.stream()
            .map(OperatorAdapter::adapterId)
            .sorted()
            .collect(Collectors.joining(","));
    }
}
