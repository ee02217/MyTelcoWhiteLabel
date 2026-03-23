package com.mytelco.casebff.controller;

import com.mytelco.casebff.model.TroubleTicketCreateRequest;
import com.mytelco.casebff.model.TroubleTicketResponse;
import com.mytelco.casebff.security.CustomerIdentityResolver;
import com.mytelco.casebff.service.TroubleTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@Tag(name = "Trouble Ticket Management", description = "TMF646 Trouble Ticket API - Case Management")
public class TroubleTicketController {

    private final TroubleTicketService troubleTicketService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public TroubleTicketController(TroubleTicketService troubleTicketService, CustomerIdentityResolver customerIdentityResolver) {
        this.troubleTicketService = troubleTicketService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    @Operation(summary = "List trouble tickets", description = "Get all trouble tickets for the authenticated customer")
    public ResponseEntity<List<TroubleTicketResponse>> list(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(troubleTicketService.list(customerId));
    }

    @PostMapping
    @Operation(summary = "Create trouble ticket", description = "Create a new support case")
    public ResponseEntity<TroubleTicketResponse> create(Authentication authentication, @Valid @RequestBody TroubleTicketCreateRequest request) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        TroubleTicketResponse response = troubleTicketService.create(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get trouble ticket by id", description = "Get a trouble ticket by ID")
    public ResponseEntity<TroubleTicketResponse> get(Authentication authentication, @PathVariable String id) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        TroubleTicketResponse ticket = troubleTicketService.getByIdOrExternalId(customerId, id);
        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/events")
    @Operation(summary = "Add trouble ticket event", description = "Add an event/comment to a trouble ticket")
    public ResponseEntity<TroubleTicketResponse> addEvent(Authentication authentication,
                                                          @PathVariable String id,
                                                          @Valid @RequestBody EventRequest request) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        TroubleTicketResponse ticket = troubleTicketService.addEvent(customerId, id, request.eventType(), request.message());
        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ticket);
    }

    public record EventRequest(String eventType, @NotBlank String message) {}
}
