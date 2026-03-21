package com.mytelco.customerbff.device;

import com.mytelco.customerbff.family.FamilyPermission;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/devices")
public class DeviceController {

    private final DeviceService deviceService;
    private final CustomerIdentityResolver customerIdentityResolver;
    private final FamilyRoleService familyRoleService;

    public DeviceController(
        DeviceService deviceService,
        CustomerIdentityResolver customerIdentityResolver,
        FamilyRoleService familyRoleService
    ) {
        this.deviceService = deviceService;
        this.customerIdentityResolver = customerIdentityResolver;
        this.familyRoleService = familyRoleService;
    }

    @GetMapping
    public ResponseEntity<List<DeviceInfo>> listDevices(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(deviceService.getAllDevices(customerId));
    }

    @GetMapping("/{lineId}")
    public ResponseEntity<DeviceInfo> getDevice(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.VIEW_USAGE);

        DeviceInfo device = deviceService.getDevice(lineId);
        if (device == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(device);
    }

    @GetMapping("/{lineId}/compatibility")
    public ResponseEntity<DeviceCompatibilityCheck> checkCompatibility(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.VIEW_USAGE);

        return ResponseEntity.ok(deviceService.checkCompatibility(lineId));
    }

    @DeleteMapping("/{lineId}")
    public ResponseEntity<Void> unlinkDevice(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestHeader(value = "X-Family-Acting-Line-ID", required = false) String actingLineId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        familyRoleService.requirePermission(customerId, actingLineId, lineId, FamilyPermission.MANAGE_SIM);

        deviceService.unlinkDevice(lineId);
        return ResponseEntity.noContent().build();
    }
}
