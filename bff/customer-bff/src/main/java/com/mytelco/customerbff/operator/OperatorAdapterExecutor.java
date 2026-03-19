package com.mytelco.customerbff.operator;

import java.time.Duration;
import java.util.function.Function;

import org.springframework.stereotype.Component;

import com.mytelco.customerbff.config.OperatorAdapterProperties;

@Component
public class OperatorAdapterExecutor {

    private final OperatorContextResolver contextResolver;
    private final OperatorAdapterRegistry registry;
    private final OperatorAdapterErrorMapper errorMapper;
    private final OperatorAdapterProperties properties;

    public OperatorAdapterExecutor(
        OperatorContextResolver contextResolver,
        OperatorAdapterRegistry registry,
        OperatorAdapterErrorMapper errorMapper,
        OperatorAdapterProperties properties
    ) {
        this.contextResolver = contextResolver;
        this.registry = registry;
        this.errorMapper = errorMapper;
        this.properties = properties;
    }

    public <T> T execute(String customerId, String operation, Function<OperatorAdapter, T> call) {
        String operatorId = contextResolver.resolveOperatorId(customerId);
        OperatorAdapter adapter = registry.resolve(operatorId);

        int maxAttempts = Math.max(1, properties.getRetry().getMaxAttempts());
        Duration backoff = normalizedBackoff(properties.getRetry().getInitialBackoff());
        Duration maxBackoff = normalizedBackoff(properties.getRetry().getMaxBackoff());
        double multiplier = Math.max(1.0, properties.getRetry().getMultiplier());

        OperatorAdapterException lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return call.apply(adapter);
            } catch (Throwable throwable) {
                OperatorAdapterException mapped = errorMapper.map(adapter.adapterId(), operation, throwable);
                lastException = mapped;

                boolean canRetry = mapped.isRetryable() && attempt < maxAttempts;
                if (!canRetry) {
                    throw mapped;
                }

                sleepQuietly(backoff);
                long nextBackoffMs = Math.round(backoff.toMillis() * multiplier);
                backoff = Duration.ofMillis(Math.min(maxBackoff.toMillis(), Math.max(1L, nextBackoffMs)));
            }
        }

        if (lastException != null) {
            throw lastException;
        }

        throw OperatorAdapterException.nonRetryable(
            OperatorAdapterErrorCode.INTERNAL,
            adapter.adapterId(),
            "adapter=" + adapter.adapterId() + ", operation=" + operation + ": exhausted without result",
            null
        );
    }

    private Duration normalizedBackoff(Duration duration) {
        if (duration == null || duration.isNegative() || duration.isZero()) {
            return Duration.ofMillis(1);
        }
        return duration;
    }

    private void sleepQuietly(Duration backoff) {
        try {
            Thread.sleep(backoff.toMillis());
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.INTERNAL,
                "executor",
                "Adapter retry interrupted",
                interruptedException
            );
        }
    }
}
