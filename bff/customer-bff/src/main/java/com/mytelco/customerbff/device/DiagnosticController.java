package com.mytelco.customerbff.device;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/diagnostics")
public class DiagnosticController {

    private final DiagnosticService diagnosticService;
    private final DeviceService deviceService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public DiagnosticController(
        DiagnosticService diagnosticService,
        DeviceService deviceService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.diagnosticService = diagnosticService;
        this.deviceService = deviceService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @PostMapping("/run")
    public ResponseEntity<DiagnosticRunResponse> runDiagnostics(
        Authentication authentication,
        @RequestBody DiagnosticRunRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(
            customerId, 
            request.actingLineId(), 
            request.lineId(), 
            FamilyPermission.VIEW_USAGE
        );

        if (deviceService.getDevice(request.lineId()) == null) {
            return ResponseEntity.notFound().build();
        }

        DiagnosticRunResponse response = diagnosticService.runDiagnostics(
            request.lineId(),
            request.testTypes()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{lineId}/escalate")
    public ResponseEntity<Map<String, String>> escalate(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId,
        @RequestBody DiagnosticEscalateRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.VIEW_USAGE);

        DeviceInfo device = deviceService.getDevice(lineId);
        if (device == null) {
            return ResponseEntity.notFound().build();
        }

        String escalationId = diagnosticService.escalateWithDiagnostics(lineId, null);
        return ResponseEntity.ok(Map.of(
            "escalationId", escalationId,
            "status", "created",
            "message", "Support case created with diagnostic context"
        ));
    }
}

record DiagnosticRunRequest(
    String lineId,
    String actingLineId,
    List<DiagnosticTestType> testTypes
) {}

record DiagnosticEscalateRequest(
    String diagnosticSummary
) {}
