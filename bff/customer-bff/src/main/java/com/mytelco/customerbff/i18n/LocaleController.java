package com.mytelco.customerbff.i18n;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/i18n")
public class LocaleController {

    private final LocalizationService localizationService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public LocaleController(LocalizationService localizationService, CustomerIdentityResolver customerIdentityResolver) {
        this.localizationService = localizationService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping("/locales")
    public ResponseEntity<List<LocaleInfo>> getSupportedLocales() {
        return ResponseEntity.ok(localizationService.getSupportedLocales());
    }

    @GetMapping("/locales/{code}")
    public ResponseEntity<LocaleInfo> getLocaleInfo(@PathVariable String code) {
        return ResponseEntity.ok(localizationService.getLocaleInfo(code));
    }

    @GetMapping("/translations")
    public ResponseEntity<Map<String, String>> getTranslations(
        Authentication authentication,
        @RequestHeader(value = "Accept-Language", defaultValue = "en-GB") String acceptLanguage
    ) {
        return ResponseEntity.ok(localizationService.getTranslations(acceptLanguage));
    }

    @GetMapping("/translate/{key}")
    public ResponseEntity<String> translate(
        Authentication authentication,
        @PathVariable String key,
        @RequestHeader(value = "Accept-Language", defaultValue = "en-GB") String acceptLanguage
    ) {
        return ResponseEntity.ok(localizationService.translate(acceptLanguage, key));
    }

    @GetMapping("/format/currency")
    public ResponseEntity<String> formatCurrency(
        Authentication authentication,
        @RequestParam BigDecimal amount,
        @RequestParam(defaultValue = "EUR") String currency,
        @RequestHeader(value = "Accept-Language", defaultValue = "en-GB") String acceptLanguage
    ) {
        return ResponseEntity.ok(localizationService.formatCurrency(amount, currency, acceptLanguage));
    }

    @GetMapping("/format/date")
    public ResponseEntity<String> formatDate(
        Authentication authentication,
        @RequestParam LocalDate date,
        @RequestHeader(value = "Accept-Language", defaultValue = "en-GB") String acceptLanguage
    ) {
        return ResponseEntity.ok(localizationService.formatDate(date, acceptLanguage));
    }
}
