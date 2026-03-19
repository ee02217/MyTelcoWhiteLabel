package com.mytelco.customerbff.controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mytelco.customerbff.events.DeadLetterEvent;
import com.mytelco.customerbff.events.DomainEventBackboneService;
import com.mytelco.customerbff.events.DomainEventEnvelope;
import com.mytelco.customerbff.events.EventTopic;

@RestController
@RequestMapping("/api/v1/customer/events")
public class EventBackboneController {

    private final DomainEventBackboneService backboneService;

    public EventBackboneController(DomainEventBackboneService backboneService) {
        this.backboneService = backboneService;
    }

    @GetMapping("/topics")
    public ResponseEntity<Set<String>> listTopics() {
        return ResponseEntity.ok(backboneService.topics());
    }

    @GetMapping("/schema-policy")
    public ResponseEntity<Map<String, Integer>> schemaPolicy() {
        return ResponseEntity.ok(backboneService.schemaPolicy());
    }

    @GetMapping("/outbox")
    public ResponseEntity<List<DomainEventEnvelope>> outbox(
        @RequestParam(value = "topic", required = false) String topic,
        @RequestParam(value = "limit", required = false, defaultValue = "50") int limit
    ) {
        EventTopic resolvedTopic = EventTopic.fromValue(topic);
        return ResponseEntity.ok(backboneService.listOutbox(resolvedTopic, limit));
    }

    @GetMapping("/dlq")
    public ResponseEntity<List<DeadLetterEvent>> deadLetter(
        @RequestParam(value = "topic", required = false) String topic,
        @RequestParam(value = "limit", required = false, defaultValue = "50") int limit
    ) {
        EventTopic resolvedTopic = EventTopic.fromValue(topic);
        return ResponseEntity.ok(backboneService.listDeadLetter(resolvedTopic, limit));
    }

    @PostMapping("/dlq/{eventId}/replay")
    public ResponseEntity<DomainEventBackboneService.ReplayResult> replay(@PathVariable String eventId) {
        return ResponseEntity.ok(backboneService.replay(eventId));
    }

    @PostMapping("/dlq/replay")
    public ResponseEntity<DomainEventBackboneService.BulkReplayResult> replayBulk(
        @RequestParam(value = "topic", required = false) String topic,
        @RequestParam(value = "limit", required = false, defaultValue = "100") int limit
    ) {
        EventTopic resolvedTopic = EventTopic.fromValue(topic);
        return ResponseEntity.ok(backboneService.replay(resolvedTopic, limit));
    }
}
