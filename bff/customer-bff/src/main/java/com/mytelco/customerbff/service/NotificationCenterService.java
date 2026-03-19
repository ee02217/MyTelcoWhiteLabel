package com.mytelco.customerbff.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.mytelco.customerbff.config.NotificationDeliveryProperties;
import com.mytelco.customerbff.model.NotificationCategory;
import com.mytelco.customerbff.model.NotificationCategoryPreference;
import com.mytelco.customerbff.model.NotificationCategoryPreferenceUpdate;
import com.mytelco.customerbff.model.NotificationChannel;
import com.mytelco.customerbff.model.NotificationChannelDelivery;
import com.mytelco.customerbff.model.NotificationChannelPreference;
import com.mytelco.customerbff.model.NotificationDeliveryStatus;
import com.mytelco.customerbff.model.NotificationInboxItem;
import com.mytelco.customerbff.model.NotificationPreferencesResponse;
import com.mytelco.customerbff.model.NotificationPreferencesUpdateRequest;
import com.mytelco.customerbff.model.NotificationTestSendRequest;
import com.mytelco.customerbff.service.persistence.DurableStateStore;
import com.mytelco.customerbff.service.persistence.NoopDurableStateStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationCenterService {

    private static final String STATE_KEY = "notification-center-state";
    private static final int SCHEMA_VERSION = 1;

    private final Map<String, EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>>> preferencesByCustomer =
        new ConcurrentHashMap<>();
    private final Map<String, CopyOnWriteArrayList<NotificationInboxItem>> inboxByCustomer = new ConcurrentHashMap<>();
    private DurableStateStore durableStateStore = NoopDurableStateStore.INSTANCE;

    @Autowired(required = false)
    public void setDurableStateStore(DurableStateStore durableStateStore) {
        this.durableStateStore = durableStateStore;
        loadState();
    }

    private final NotificationDeliveryAdapter deliveryAdapter;
    private final NotificationDeliveryProperties deliveryProperties;

    public NotificationCenterService(
        NotificationDeliveryAdapter deliveryAdapter,
        NotificationDeliveryProperties deliveryProperties
    ) {
        this.deliveryAdapter = deliveryAdapter;
        this.deliveryProperties = deliveryProperties;
    }

    public List<NotificationInboxItem> getInbox(String customerId) {
        return inboxByCustomer.getOrDefault(customerId, new CopyOnWriteArrayList<>()).stream()
            .sorted(Comparator.comparing(NotificationInboxItem::createdAt).reversed())
            .toList();
    }

    public NotificationPreferencesResponse getPreferences(String customerId) {
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> prefs = getOrCreatePreferences(customerId, true);
        return mapPreferences(customerId, prefs, "system");
    }

    public NotificationPreferencesResponse updatePreferences(
        String customerId,
        NotificationPreferencesUpdateRequest request,
        String actor
    ) {
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> prefs = getOrCreatePreferences(customerId, true);

        for (NotificationCategoryPreferenceUpdate update : request.categories()) {
            EnumMap<NotificationChannel, Boolean> categoryPrefs = prefs.computeIfAbsent(
                update.category(),
                ignored -> defaultChannelMap()
            );
            update.channels().forEach((channel, enabled) -> categoryPrefs.put(channel, Boolean.TRUE.equals(enabled)));
        }

        persistState();
        return mapPreferences(customerId, prefs, actor);
    }

    public NotificationInboxItem sendTestNotification(String customerId, NotificationTestSendRequest request) {
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> prefs = getOrCreatePreferences(customerId, true);
        EnumMap<NotificationChannel, Boolean> categoryPrefs = prefs.getOrDefault(request.category(), defaultChannelMap());

        EnumSet<NotificationChannel> candidateChannels = request.requestedChannels() == null || request.requestedChannels().isEmpty()
            ? EnumSet.allOf(NotificationChannel.class)
            : EnumSet.copyOf(request.requestedChannels());

        EnumSet<NotificationChannel> targetChannels = EnumSet.noneOf(NotificationChannel.class);
        for (NotificationChannel channel : candidateChannels) {
            if (Boolean.TRUE.equals(categoryPrefs.getOrDefault(channel, false))) {
                targetChannels.add(channel);
            }
        }

        EnumSet<NotificationChannel> forcedFailedChannels =
            request.forceFailedChannels() == null || request.forceFailedChannels().isEmpty()
                ? EnumSet.noneOf(NotificationChannel.class)
                : EnumSet.copyOf(request.forceFailedChannels());

        String notificationId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        List<NotificationChannelDelivery> deliveries = new ArrayList<>();
        long timelineOffsetMs = 0;

        for (NotificationChannel channel : targetChannels) {
            timelineOffsetMs = appendDeliveryLifecycle(
                deliveries,
                notificationId,
                customerId,
                request,
                channel,
                forcedFailedChannels.contains(channel),
                now,
                timelineOffsetMs
            );
        }

        NotificationInboxItem item = new NotificationInboxItem(
            notificationId,
            customerId,
            request.title(),
            request.message(),
            request.category(),
            deliveries,
            now,
            null
        );

        inboxByCustomer.computeIfAbsent(customerId, ignored -> new CopyOnWriteArrayList<>()).add(item);
        persistState();
        return item;
    }

    private long appendDeliveryLifecycle(
        List<NotificationChannelDelivery> deliveries,
        String notificationId,
        String customerId,
        NotificationTestSendRequest request,
        NotificationChannel channel,
        boolean forceFailure,
        Instant baseTime,
        long offsetMs
    ) {
        int maxAttempts = Math.max(1, deliveryProperties.getDelivery().getMaxAttempts());
        long retryBackoffMs = Math.max(0, deliveryProperties.getDelivery().getRetryBackoff().toMillis());

        deliveries.add(new NotificationChannelDelivery(
            channel,
            NotificationDeliveryStatus.QUEUED,
            baseTime.plusMillis(offsetMs++),
            0,
            providerName(),
            null,
            null,
            null
        ));

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            deliveries.add(new NotificationChannelDelivery(
                channel,
                NotificationDeliveryStatus.SENT,
                baseTime.plusMillis(offsetMs++),
                attempt,
                providerName(),
                null,
                null,
                null
            ));

            NotificationDeliveryResult result = forceFailure
                ? NotificationDeliveryResult.failed("forced", "FORCED_FAILURE", "Forced failure from test endpoint")
                : deliveryAdapter.deliver(new NotificationDeliveryRequest(
                    notificationId,
                    customerId,
                    request.category(),
                    channel,
                    request.title(),
                    request.message(),
                    attempt
                ));

            if (result == null) {
                result = NotificationDeliveryResult.failed(providerName(), "DISPATCHER_RETURNED_NULL", "Dispatcher returned null result");
            }

            NotificationDeliveryStatus terminalStatus = result.delivered()
                ? NotificationDeliveryStatus.DELIVERED
                : NotificationDeliveryStatus.FAILED;

            deliveries.add(new NotificationChannelDelivery(
                channel,
                terminalStatus,
                baseTime.plusMillis(offsetMs++),
                attempt,
                result.provider(),
                result.providerReference(),
                result.errorCode(),
                result.errorMessage()
            ));

            if (result.delivered()) {
                break;
            }

            if (attempt < maxAttempts) {
                offsetMs += retryBackoffMs;
            }
        }

        return offsetMs;
    }

    private String providerName() {
        String provider = deliveryProperties.getDelivery().getProvider();
        return provider == null || provider.isBlank() ? "unknown" : provider;
    }

    private EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> defaultPreferences() {
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> byCategory =
            new EnumMap<>(NotificationCategory.class);
        for (NotificationCategory category : NotificationCategory.values()) {
            byCategory.put(category, defaultChannelMap());
        }
        return byCategory;
    }

    private EnumMap<NotificationChannel, Boolean> defaultChannelMap() {
        EnumMap<NotificationChannel, Boolean> channels = new EnumMap<>(NotificationChannel.class);
        for (NotificationChannel channel : NotificationChannel.values()) {
            channels.put(channel, true);
        }
        return channels;
    }

    private NotificationPreferencesResponse mapPreferences(
        String customerId,
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> prefs,
        String updatedBy
    ) {
        List<NotificationCategoryPreference> categories = new ArrayList<>();
        for (NotificationCategory category : NotificationCategory.values()) {
            EnumMap<NotificationChannel, Boolean> categoryPrefs = prefs.getOrDefault(category, defaultChannelMap());
            List<NotificationChannelPreference> channels = new ArrayList<>();
            for (NotificationChannel channel : NotificationChannel.values()) {
                channels.add(new NotificationChannelPreference(channel, Boolean.TRUE.equals(categoryPrefs.get(channel))));
            }
            categories.add(new NotificationCategoryPreference(category, channels));
        }

        return new NotificationPreferencesResponse(customerId, categories, Instant.now(), updatedBy);
    }

    private EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> getOrCreatePreferences(
        String customerId,
        boolean persistWhenCreated
    ) {
        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> existing = preferencesByCustomer.get(customerId);
        if (existing != null) {
            return existing;
        }

        EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> created = defaultPreferences();
        preferencesByCustomer.put(customerId, created);
        if (persistWhenCreated) {
            persistState();
        }
        return created;
    }

    private void loadState() {
        NotificationCenterState state = durableStateStore.read(
            STATE_KEY,
            new TypeReference<>() {
            },
            NotificationCenterState::empty
        );

        preferencesByCustomer.clear();
        preferencesByCustomer.putAll(state.preferencesByCustomer());

        inboxByCustomer.clear();
        state.inboxByCustomer().forEach((customerId, inbox) ->
            inboxByCustomer.put(customerId, new CopyOnWriteArrayList<>(inbox))
        );
    }

    private void persistState() {
        Map<String, EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>>> prefsSnapshot = new ConcurrentHashMap<>();
        preferencesByCustomer.forEach((customerId, prefsByCategory) -> {
            EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>> categorySnapshot =
                new EnumMap<>(NotificationCategory.class);
            prefsByCategory.forEach((category, channelPrefs) -> categorySnapshot.put(category, new EnumMap<>(channelPrefs)));
            prefsSnapshot.put(customerId, categorySnapshot);
        });

        Map<String, List<NotificationInboxItem>> inboxSnapshot = new ConcurrentHashMap<>();
        inboxByCustomer.forEach((customerId, inbox) -> inboxSnapshot.put(customerId, List.copyOf(inbox)));

        durableStateStore.write(STATE_KEY, new NotificationCenterState(SCHEMA_VERSION, prefsSnapshot, inboxSnapshot));
    }

    private record NotificationCenterState(
        int schemaVersion,
        Map<String, EnumMap<NotificationCategory, EnumMap<NotificationChannel, Boolean>>> preferencesByCustomer,
        Map<String, List<NotificationInboxItem>> inboxByCustomer
    ) {
        private static NotificationCenterState empty() {
            return new NotificationCenterState(SCHEMA_VERSION, Map.of(), Map.of());
        }
    }
}
