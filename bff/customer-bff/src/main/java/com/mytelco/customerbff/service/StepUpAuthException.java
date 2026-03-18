package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.StepUpErrorCode;
import org.springframework.http.HttpStatus;

public class StepUpAuthException extends RuntimeException {

    private final StepUpErrorCode errorCode;
    private final HttpStatus httpStatus;

    public StepUpAuthException(StepUpErrorCode errorCode, HttpStatus httpStatus, String message) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public StepUpErrorCode getErrorCode() {
        return errorCode;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public static StepUpAuthException challengeNotFound(String challengeId) {
        return new StepUpAuthException(
            StepUpErrorCode.CHALLENGE_NOT_FOUND,
            HttpStatus.NOT_FOUND,
            "Challenge not found: " + challengeId
        );
    }

    public static StepUpAuthException challengeExpired(String challengeId) {
        return new StepUpAuthException(
            StepUpErrorCode.CHALLENGE_EXPIRED,
            HttpStatus.BAD_REQUEST,
            "Challenge expired: " + challengeId
        );
    }

    public static StepUpAuthException challengeLocked(String challengeId) {
        return new StepUpAuthException(
            StepUpErrorCode.CHALLENGE_LOCKED,
            HttpStatus.TOO_MANY_REQUESTS,
            "Challenge temporarily locked due to maximum failed attempts: " + challengeId
        );
    }

    public static StepUpAuthException invalidCode(String challengeId, int remainingAttempts) {
        return new StepUpAuthException(
            StepUpErrorCode.INVALID_CHALLENGE_CODE,
            HttpStatus.BAD_REQUEST,
            "Invalid challenge code for " + challengeId + ". Remaining attempts: " + Math.max(remainingAttempts, 0)
        );
    }

    public static StepUpAuthException challengeAlreadyUsed(String challengeId) {
        return new StepUpAuthException(
            StepUpErrorCode.CHALLENGE_ALREADY_USED,
            HttpStatus.CONFLICT,
            "Challenge already verified: " + challengeId
        );
    }
}
