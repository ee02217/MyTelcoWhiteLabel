package com.mytelco.adminbff.configflags.controller;

import com.mytelco.adminbff.configflags.model.AuditEntry;
import com.mytelco.adminbff.configflags.model.FlagUpdateRequest;
import com.mytelco.adminbff.configflags.model.FlagUpdateResponse;
import com.mytelco.adminbff.configflags.service.OperatorConfigService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/config")
public class OperatorConfigController {

    private final OperatorConfigService operatorConfigService;

    public OperatorConfigController(OperatorConfigService operatorConfigService) {
        this.operatorConfigService = operatorConfigService;
    }

    @GetMapping(value = "/flags/{operatorId}/{channel}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Boolean> getFlags(@PathVariable String operatorId, @PathVariable String channel) {
        return operatorConfigService.getFlags(operatorId, channel);
    }

    @GetMapping(value = "/journeys/{operatorId}/{journeyId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> getJourney(@PathVariable String operatorId, @PathVariable String journeyId) {
        return operatorConfigService.getJourney(operatorId, journeyId);
    }

    @PatchMapping(value = "/flags/{operatorId}/{channel}/{flagKey}",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public FlagUpdateResponse updateFlag(@PathVariable String operatorId,
                                         @PathVariable String channel,
                                         @PathVariable String flagKey,
                                         @Valid @RequestBody FlagUpdateRequest request,
                                         Principal principal) {
        var actor = principal != null ? principal.getName() : "system";
        return operatorConfigService.updateFlag(operatorId, channel, flagKey, request.enabled(), actor);
    }

    @GetMapping(value = "/flags/audit/{operatorId}/{channel}", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<AuditEntry> getAudit(@PathVariable String operatorId, @PathVariable String channel) {
        return operatorConfigService.getAudit(operatorId, channel);
    }
}
