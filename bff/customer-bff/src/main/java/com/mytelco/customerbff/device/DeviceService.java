package com.mytelco.customerbff.device;

import com.mytelco.customerbff.provider.SimLifecycleProvider;
import com.mytelco.customerbff.provider.UsageProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DeviceService {

    private final Map<String, DeviceInfo> devices = new ConcurrentHashMap<>();
    private final SimLifecycleProvider simLifecycleProvider;
    private final UsageProvider usageProvider;

    public DeviceService(SimLifecycleProvider simLifecycleProvider, UsageProvider usageProvider) {
        this.simLifecycleProvider = simLifecycleProvider;
        this.usageProvider = usageProvider;
        initializeMockDevices();
    }

    private void initializeMockDevices() {
        devices.put("line-1", new DeviceInfo(
            "line-1", "3515000001", "iPhone 15 Pro", "861234567890123", true,
            "ACTIVATED", "ACTIVE", "CONNECTED", Instant.now().toString()
        ));
        devices.put("line-2", new DeviceInfo(
            "line-2", "3515000002", "Samsung Galaxy S24", "861234567890124", true,
            "ACTIVATED", "ACTIVE", "CONNECTED", Instant.now().toString()
        ));
        devices.put("line-3", new DeviceInfo(
            "line-3", "3515000003", "Google Pixel 8", "861234567890125", true,
            "PENDING", "ACTIVE", "CONNECTED", Instant.now().toString()
        ));
        devices.put("line-mobile-1", new DeviceInfo(
            "line-mobile-1", "3515000010", "iPhone 14", "861234567890130", true,
            "ACTIVATED", "ACTIVE", "CONNECTED", Instant.now().toString()
        ));
    }

    public List<DeviceInfo> getAllDevices(String customerId) {
        return List.copyOf(devices.values());
    }

    public DeviceInfo getDevice(String lineId) {
        return devices.get(lineId);
    }

    public DeviceCompatibilityCheck checkCompatibility(String lineId) {
        DeviceInfo device = devices.get(lineId);
        if (device == null) {
            return new DeviceCompatibilityCheck(lineId, false, false, "Device not found", "Device not found");
        }

        boolean planCompatible = device.simStatus().equals("ACTIVE");
        boolean roamingCompatible = device.networkStatus().equals("CONNECTED") && device.simStatus().equals("ACTIVE");

        String planMessage = planCompatible
            ? "Device is compatible with current plan"
            : "Device SIM is not active. Please contact support.";

        String roamingMessage = roamingCompatible
            ? "Device is roaming-ready"
            : "Check data settings or contact support for roaming activation.";

        return new DeviceCompatibilityCheck(lineId, planCompatible, roamingCompatible, planMessage, roamingMessage);
    }

    public void unlinkDevice(String lineId) {
        devices.remove(lineId);
    }
}
