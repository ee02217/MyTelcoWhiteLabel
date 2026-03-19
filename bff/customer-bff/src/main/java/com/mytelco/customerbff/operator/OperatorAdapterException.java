package com.mytelco.customerbff.operator;

public class OperatorAdapterException extends RuntimeException {

    private final OperatorAdapterErrorCode errorCode;
    private final String adapterId;
    private final boolean retryable;

    public OperatorAdapterException(
        OperatorAdapterErrorCode errorCode,
        String adapterId,
        String message,
        boolean retryable,
        Throwable cause
    ) {
        super(message, cause);
        this.errorCode = errorCode;
        this.adapterId = adapterId;
        this.retryable = retryable;
    }

    public OperatorAdapterErrorCode getErrorCode() {
        return errorCode;
    }

    public String getAdapterId() {
        return adapterId;
    }

    public boolean isRetryable() {
        return retryable;
    }

    public static OperatorAdapterException nonRetryable(
        OperatorAdapterErrorCode errorCode,
        String adapterId,
        String message,
        Throwable cause
    ) {
        return new OperatorAdapterException(errorCode, adapterId, message, false, cause);
    }

    public static OperatorAdapterException retryable(
        OperatorAdapterErrorCode errorCode,
        String adapterId,
        String message,
        Throwable cause
    ) {
        return new OperatorAdapterException(errorCode, adapterId, message, true, cause);
    }
}
