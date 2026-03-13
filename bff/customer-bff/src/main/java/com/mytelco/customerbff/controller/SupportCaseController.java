package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.SupportCaseCreateRequest;
import com.mytelco.customerbff.model.SupportCaseMessageRequest;
import com.mytelco.customerbff.model.SupportCaseResponse;
import com.mytelco.customerbff.service.SupportCaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/support/cases")
@Tag(name = "Support Cases", description = "Customer support case creation and timeline tracking")
public class SupportCaseController {

    private final SupportCaseService supportCaseService;

    public SupportCaseController(SupportCaseService supportCaseService) {
        this.supportCaseService = supportCaseService;
    }

    @PostMapping
    @Operation(summary = "Create support case")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Case created")})
    public ResponseEntity<SupportCaseResponse> create(@Valid @RequestBody SupportCaseCreateRequest request) {
        return ResponseEntity.ok(supportCaseService.create(request));
    }

    @GetMapping
    @Operation(summary = "List support cases")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Cases listed")})
    public ResponseEntity<List<SupportCaseResponse>> list() {
        return ResponseEntity.ok(supportCaseService.list());
    }

    @GetMapping("/{caseId}")
    @Operation(summary = "Get support case by id")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Case found")})
    public ResponseEntity<SupportCaseResponse> get(@PathVariable String caseId) {
        SupportCaseResponse supportCase = supportCaseService.get(caseId);
        if (supportCase == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(supportCase);
    }

    @PostMapping("/{caseId}/messages")
    @Operation(summary = "Append message to support case timeline")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Timeline updated")})
    public ResponseEntity<SupportCaseResponse> addMessage(@PathVariable String caseId,
                                                          @Valid @RequestBody SupportCaseMessageRequest request) {
        SupportCaseResponse supportCase = supportCaseService.addMessage(caseId, request);
        if (supportCase == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(supportCase);
    }
}
