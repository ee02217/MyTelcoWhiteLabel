package com.mytelco.customerbff.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PaymentMethodRegistrationRequest(
    @NotBlank String cardHolder,
    @NotBlank @Size(min = 4, max = 4) @Pattern(regexp = "\\d{4}") String cardLast4,
    @NotBlank String cardBrand,
    @NotBlank @Pattern(regexp = "\\d{2}/\\d{2}") String expiry
) {}
