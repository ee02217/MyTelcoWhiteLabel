package com.mytelco.customerbff.operator;

import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.util.NoSuchElementException;
import java.util.concurrent.TimeoutException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;

@Component
public class OperatorAdapterErrorMapper {

    public OperatorAdapterException map(String adapterId, String operation, Throwable throwable) {
        if (throwable instanceof OperatorAdapterException operatorAdapterException) {
            return operatorAdapterException;
        }

        String context = "adapter=" + adapterId + ", operation=" + operation + ": ";

        if (throwable instanceof HttpStatusCodeException httpStatusException) {
            int statusCode = httpStatusException.getStatusCode().value();
            if (statusCode == 401) {
                return OperatorAdapterException.nonRetryable(
                    OperatorAdapterErrorCode.UNAUTHORIZED,
                    adapterId,
                    context + throwable.getMessage(),
                    throwable
                );
            }
            if (statusCode == 403) {
                return OperatorAdapterException.nonRetryable(
                    OperatorAdapterErrorCode.FORBIDDEN,
                    adapterId,
                    context + throwable.getMessage(),
                    throwable
                );
            }
            if (statusCode == 404) {
                return OperatorAdapterException.nonRetryable(
                    OperatorAdapterErrorCode.NOT_FOUND,
                    adapterId,
                    context + throwable.getMessage(),
                    throwable
                );
            }
            if (statusCode >= 500) {
                return OperatorAdapterException.retryable(
                    OperatorAdapterErrorCode.UPSTREAM_UNAVAILABLE,
                    adapterId,
                    context + throwable.getMessage(),
                    throwable
                );
            }
            return OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.VALIDATION,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        if (throwable instanceof IllegalArgumentException) {
            return OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.VALIDATION,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        if (throwable instanceof AccessDeniedException || throwable instanceof SecurityException) {
            return OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.FORBIDDEN,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        if (throwable instanceof NoSuchElementException) {
            return OperatorAdapterException.nonRetryable(
                OperatorAdapterErrorCode.NOT_FOUND,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        if (throwable instanceof SocketTimeoutException || throwable instanceof TimeoutException) {
            return OperatorAdapterException.retryable(
                OperatorAdapterErrorCode.UPSTREAM_TIMEOUT,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        if (throwable instanceof ConnectException
            || throwable instanceof UnknownHostException
            || throwable instanceof NoRouteToHostException) {
            return OperatorAdapterException.retryable(
                OperatorAdapterErrorCode.UPSTREAM_UNAVAILABLE,
                adapterId,
                context + throwable.getMessage(),
                throwable
            );
        }

        return OperatorAdapterException.nonRetryable(
            OperatorAdapterErrorCode.INTERNAL,
            adapterId,
            context + (throwable.getMessage() == null ? throwable.getClass().getSimpleName() : throwable.getMessage()),
            throwable
        );
    }
}
