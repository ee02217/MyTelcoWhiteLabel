package com.mytelco.customerbff.analytics;

import com.mytelco.customerbff.config.OperatorAdapterProperties;
import com.mytelco.customerbff.events.DomainEventPublisher;
import com.mytelco.customerbff.events.EventTopic;
import com.mytelco.customerbff.operator.OperatorContextResolver;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ProductAnalyticsServiceTest {

    private ProductAnalyticsService analyticsService;

    private InMemoryEventPublisher publisher;

    @BeforeEach
    void setUp() {
        publisher = new InMemoryEventPublisher();
        OperatorAdapterProperties properties = new OperatorAdapterProperties();
        OperatorContextResolver contextResolver = new OperatorContextResolver(properties);
        analyticsService = new ProductAnalyticsService(
            publisher,
            contextResolver,
            new SimpleMeterRegistry()
        );
    }

    @Test
    void taxonomyIsExposed() {
        assertThat(analyticsService.taxonomy()).isNotEmpty();
        assertThat(analyticsService.taxonomy().get(0).eventType()).contains(".");
    }

    @Test
    void tracksEventsAndExposesDashboard() {
        analyticsService.trackLoginSuccess("cust-1", null, "web", "corr-1");
        analyticsService.trackBillPayCheckoutStarted("cust-1", null, "web", "corr-1", "bill-1", "idem-1", "EUR", "99.99");
        analyticsService.trackBillPayCheckoutCompleted("cust-1", null, "web", "corr-1", "bill-1", "SUCCESS", "tx-1");

        ProductAnalyticsDashboardResponse dashboard = analyticsService.dashboard(null, null, 10);

        assertThat(dashboard.totalEvents()).isEqualTo(3);
        assertThat(dashboard.funnelMetrics()).isNotEmpty();
        assertThat(dashboard.recentEvents()).hasSize(3);
        assertThat(publisher.getPublished()).hasSize(3);
    }

    static class InMemoryEventPublisher implements DomainEventPublisher {

        private final List<ProductAnalyticsEvent> published = new java.util.concurrent.CopyOnWriteArrayList<>();

        @Override
        public void publish(EventTopic topic, String eventType, String customerId, String correlationId, Map<String, Object> payload) {
            published.add(new ProductAnalyticsEvent(
                eventType,
                "funnel",
                "step",
                (String) payload.getOrDefault("outcome", ""),
                customerId,
                (String) payload.getOrDefault("operatorId", ""),
                (String) payload.getOrDefault("channel", "web"),
                correlationId,
                java.time.Instant.now(),
                payload
            ));
        }

        public List<ProductAnalyticsEvent> getPublished() {
            return published;
        }
    }
}
