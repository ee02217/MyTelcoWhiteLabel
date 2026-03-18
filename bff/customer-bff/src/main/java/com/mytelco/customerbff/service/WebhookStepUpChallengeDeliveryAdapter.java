package com.mytelco.customerbff.service;

import com.mytelco.customerbff.config.StepUpSecurityProperties;
import com.mytelco.customerbff.model.StepUpAction;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@ConditionalOnProperty(prefix = "mytelco.step-up.delivery", name = "provider", havingValue = "webhook")
public class WebhookStepUpChallengeDeliveryAdapter implements StepUpChallengeDeliveryAdapter {

    private final StepUpSecurityProperties properties;
    private final RestClient restClient;

    public WebhookStepUpChallengeDeliveryAdapter(
        StepUpSecurityProperties properties,
        RestClient.Builder restClientBuilder
    ) {
        this.properties = properties;
        this.restClient = restClientBuilder.build();
    }

    @Override
    public StepUpChallengeDeliveryResult deliverChallenge(String challengeId, String lineId, StepUpAction action, String code) {
        String webhookUrl = properties.getDelivery().getWebhookUrl();
        if (!StringUtils.hasText(webhookUrl)) {
            throw new IllegalStateException("Step-up delivery provider=webhook requires mytelco.step-up.delivery.webhook-url");
        }

        restClient.post()
            .uri(webhookUrl)
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "challengeId", challengeId,
                "lineId", lineId,
                "action", action.name(),
                "channel", properties.getDelivery().getChannel(),
                "code", code
            ))
            .retrieve()
            .toBodilessEntity();

        return new StepUpChallengeDeliveryResult(
            properties.getDelivery().getChannel(),
            properties.getDelivery().getMaskedDestination(),
            "webhook-" + challengeId
        );
    }
}
