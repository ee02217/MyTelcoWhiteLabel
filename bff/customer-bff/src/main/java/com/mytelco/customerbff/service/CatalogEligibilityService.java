package com.mytelco.customerbff.service;

import org.springframework.stereotype.Service;

@Service
public class CatalogEligibilityService {

    public EligibilityResult evaluate(String lineId, String operatorId, String offerId) {
        if (lineId == null || lineId.isBlank() || operatorId == null || operatorId.isBlank()) {
            return new EligibilityResult(false, "line/operator context is required");
        }

        boolean evenLine = extractNumericSuffix(lineId) % 2 == 0;
        if (offerId.startsWith("plan-premium") && !"vodafone-pt".equalsIgnoreCase(operatorId)) {
            return new EligibilityResult(false, "premium plan only available for vodafone-pt");
        }
        if (offerId.startsWith("addon-5g") && !evenLine) {
            return new EligibilityResult(false, "5G add-on requires even-numbered line IDs");
        }
        if (offerId.startsWith("addon-roaming") && "mvno-lite".equalsIgnoreCase(operatorId)) {
            return new EligibilityResult(false, "roaming add-on unavailable for mvno-lite operator");
        }

        return new EligibilityResult(true, "eligible");
    }

    private int extractNumericSuffix(String lineId) {
        String digits = lineId.replaceAll("\\D", "");
        if (digits.isBlank()) {
            return 0;
        }
        return Integer.parseInt(digits.substring(Math.max(0, digits.length() - 2)));
    }

    public record EligibilityResult(boolean eligible, String reason) {}
}
