package com.mytelco.casebff.service;

import com.mytelco.casebff.model.TroubleTicketCreateRequest;
import com.mytelco.casebff.model.TroubleTicketEventResponse;
import com.mytelco.casebff.model.TroubleTicketResponse;
import com.mytelco.casebff.repository.TroubleTicketRepository;
import com.mytelco.casebff.service.persistence.TroubleTicketEntity;
import com.mytelco.casebff.service.persistence.TroubleTicketEventEntity;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class TroubleTicketService {

    private final TroubleTicketRepository troubleTicketRepository;

    public TroubleTicketService(TroubleTicketRepository troubleTicketRepository) {
        this.troubleTicketRepository = troubleTicketRepository;
    }

    @Transactional
    public TroubleTicketResponse create(String customerId, TroubleTicketCreateRequest request) {
        Instant now = Instant.now();

        TroubleTicketEntity entity = new TroubleTicketEntity();
        entity.setExternalId(generateExternalId());
        entity.setCategory(request.category());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setPriority(normalizePriority(request.priority()));
        entity.setStatus("OPEN");
        entity.setCustomerId(customerId);
        entity.setAffectedServiceId(request.affectedServiceId());
        entity.setExpectedResponseAt(now.plus(slaDuration(entity.getPriority())));

        TroubleTicketEventEntity createdEvent = new TroubleTicketEventEntity();
        createdEvent.setEventType("CASE_CREATED");
        createdEvent.setActor("system");
        createdEvent.setActorType("SYSTEM");
        createdEvent.setMessage("Support case created");
        entity.addEvent(createdEvent);

        TroubleTicketEntity saved = troubleTicketRepository.save(entity);
        return toResponse(saved);
    }

    public List<TroubleTicketResponse> list(String customerId) {
        return troubleTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public TroubleTicketResponse getByIdOrExternalId(String customerId, String idOrExternalId) {
        Optional<TroubleTicketEntity> ticketOpt = findByIdOrExternalId(idOrExternalId);
        if (ticketOpt.isEmpty()) {
            return null;
        }

        TroubleTicketEntity ticket = ticketOpt.get();
        if (!ticket.getCustomerId().equals(customerId)) {
            return null;
        }

        return toResponse(ticket);
    }

    @Transactional
    public TroubleTicketResponse addEvent(String customerId, String idOrExternalId, String eventType, String message) {
        Optional<TroubleTicketEntity> ticketOpt = findByIdOrExternalId(idOrExternalId);
        if (ticketOpt.isEmpty()) {
            return null;
        }

        TroubleTicketEntity ticket = ticketOpt.get();
        if (!ticket.getCustomerId().equals(customerId)) {
            return null;
        }

        TroubleTicketEventEntity event = new TroubleTicketEventEntity();
        event.setEventType(eventType == null || eventType.isBlank() ? "MESSAGE" : eventType.trim().toUpperCase(Locale.ROOT));
        event.setActor(customerId);
        event.setActorType("CUSTOMER");
        event.setMessage(message);
        ticket.addEvent(event);

        TroubleTicketEntity saved = troubleTicketRepository.save(ticket);
        return toResponse(saved);
    }

    private Optional<TroubleTicketEntity> findByIdOrExternalId(String idOrExternalId) {
        if (idOrExternalId == null || idOrExternalId.isBlank()) {
            return Optional.empty();
        }

        try {
            UUID uuid = UUID.fromString(idOrExternalId);
            return troubleTicketRepository.findById(uuid);
        } catch (IllegalArgumentException ignored) {
            return troubleTicketRepository.findByExternalId(idOrExternalId);
        }
    }

    private TroubleTicketResponse toResponse(TroubleTicketEntity entity) {
        List<TroubleTicketEventResponse> timeline = entity.getEvents() == null
            ? List.of()
            : entity.getEvents().stream()
                .map(evt -> new TroubleTicketEventResponse(
                    evt.getId(),
                    evt.getEventType(),
                    evt.getActor(),
                    evt.getActorType(),
                    evt.getMessage(),
                    evt.getCreatedAt()
                ))
                .sorted(Comparator.comparing(TroubleTicketEventResponse::createdAt))
                .toList();

        return new TroubleTicketResponse(
            entity.getId(),
            entity.getExternalId(),
            entity.getCategory(),
            entity.getTitle(),
            entity.getDescription(),
            entity.getPriority(),
            entity.getStatus(),
            entity.getCustomerId(),
            entity.getAffectedServiceId(),
            entity.getSlaTarget(),
            entity.getExpectedResponseAt(),
            entity.getResolvedAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            timeline
        );
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "NORMAL";
        }
        return priority.trim().toUpperCase(Locale.ROOT);
    }

    private Duration slaDuration(String priority) {
        if ("HIGH".equalsIgnoreCase(priority) || "P1".equalsIgnoreCase(priority)) {
            return Duration.ofHours(2);
        }
        return Duration.ofHours(4);
    }

    private String generateExternalId() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "CASE-" + suffix;
    }
}
