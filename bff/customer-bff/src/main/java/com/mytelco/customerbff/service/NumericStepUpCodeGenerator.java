package com.mytelco.customerbff.service;

import java.security.SecureRandom;

import org.springframework.stereotype.Component;

@Component
public class NumericStepUpCodeGenerator implements StepUpCodeGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    public String generateCode(int length) {
        int size = Math.max(length, 4);
        StringBuilder builder = new StringBuilder(size);
        for (int i = 0; i < size; i++) {
            builder.append(SECURE_RANDOM.nextInt(10));
        }
        return builder.toString();
    }
}
