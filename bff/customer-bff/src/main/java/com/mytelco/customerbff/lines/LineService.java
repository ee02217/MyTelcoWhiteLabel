package com.mytelco.customerbff.lines;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class LineService {

    private final Map<String, List<Line>> customerLines = new HashMap<>();
    private final Map<String, String> pendingPortings = new HashMap<>();

    public LineService() {
        // Mock lines for customer-1
        List<Line> lines = List.of(
            new Line(
                "line-1", "customer-1", "+351912345678", "ACTIVE",
                "plan-1", "Premium 50GB", 35.99,
                "ESIM", "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ESIM_ACTIVATION_line1",
                "LMNK-9876-XKJH-5432",
                "2024-01-15T10:00:00Z", "5901234123456", "890123456789012345",
                "DELIVERED", "123 Main St, Lisbon", null
            ),
            new Line(
                "line-2", "customer-1", "+351912345679", "ACTIVE",
                "plan-2", "Basic 10GB", 15.99,
                "PHYSICAL", null, null,
                "2024-06-01T10:00:00Z", "5901234123457", "890123456789016789",
                "SHIPPED", "123 Main St, Lisbon", "2026-03-25"
            ),
            new Line(
                "line-3", "customer-1", "+351912345680", "PENDING_CANCEL",
                "plan-1", "Premium 50GB", 35.99,
                "ESIM", null, null,
                "2024-03-01T10:00:00Z", "5901234123458", "890123456789012357",
                "DELIVERED", "123 Main St, Lisbon", null
            )
        );
        customerLines.put("customer-1", lines);
    }

    public List<Line> getLines(String customerId) {
        return customerLines.computeIfAbsent(customerId, k -> new ArrayList<>());
    }

    public Line getLine(String customerId, String lineId) {
        return getLines(customerId).stream()
            .filter(l -> l.lineId().equals(lineId))
            .findFirst()
            .orElse(null);
    }

    public LineDetails getLineDetails(String customerId, String lineId) {
        Line line = getLine(customerId, lineId);
        if (line == null) return null;

        NumberPorting porting = null;
        if (line.phoneNumber().startsWith("+351") && pendingPortings.containsKey(lineId)) {
            porting = new NumberPorting(
                "IN_PROGRESS", "MEO", 
                Instant.now().minusSeconds(86400).toString(),
                Instant.now().plusSeconds(172800).toString(),
                "123456", false
            );
        }

        List<Usage> usage = List.of(
            new Usage("2026-03", 32500.0, 51200.0, 45.0, 500.0, 12.0, 100.0)
        );

        return new LineDetails(
            line.lineId(), line.phoneNumber(), line.status(), 
            line.planName(), line.planPrice(), line.simType(),
            line.esimQrCode(), line.esimActivationCode(),
            line.activationDate(), line.ean13Code(), line.iccid(),
            line.deliveryStatus(), line.deliveryAddress(), line.estimatedDelivery(),
            porting, usage
        );
    }

    public Line addLine(String customerId, AddLineRequest request) {
        String lineId = "line-" + System.currentTimeMillis();
        String phoneNumber = request.phoneNumber() != null ? request.phoneNumber() : "+35191" + (int)(Math.random() * 90000000 + 10000000);
        String simType = request.simType() != null ? request.simType() : "ESIM";
        boolean isEsim = "ESIM".equalsIgnoreCase(simType);

        Line newLine = new Line(
            lineId, customerId, phoneNumber, "PENDING",
            request.planId(), "Selected Plan", 29.99,
            simType,
            isEsim ? "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ESIM_ACTIVATION_" + lineId : null,
            isEsim ? "LMNK-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase() : null,
            null, null, null,
            request.deliveryAddress() != null ? "PROCESSING" : "READY",
            request.deliveryAddress(), 
            isEsim ? null : "2026-03-28"
        );

        customerLines.computeIfAbsent(customerId, k -> new ArrayList<>()).add(newLine);
        return newLine;
    }

    public Line cancelLine(String customerId, String lineId, CancelLineRequest request) {
        List<Line> lines = customerLines.get(customerId);
        if (lines == null) return null;

        return lines.stream()
            .filter(l -> l.lineId().equals(lineId))
            .findFirst()
            .map(line -> {
                if (request.keepNumber()) {
                    pendingPortings.put(lineId, "PENDING");
                }
                return new Line(
                    line.lineId(), line.customerId(), line.phoneNumber(), "PENDING_CANCEL",
                    line.planId(), line.planName(), line.planPrice(),
                    line.simType(), line.esimQrCode(), line.esimActivationCode(),
                    line.activationDate(), line.ean13Code(), line.iccid(),
                    line.deliveryStatus(), line.deliveryAddress(), line.estimatedDelivery()
                );
            })
            .orElse(null);
    }

    public ProrationPreview getProrationPreview(String customerId, String lineId, String newPlanId) {
        Line line = getLine(customerId, lineId);
        if (line == null) return null;

        // Mock proration calculation
        double currentPrice = line.planPrice();
        double newPrice = 29.99;
        int daysRemaining = 10;
        int daysInMonth = 31;

        double creditForRemaining = (currentPrice / daysInMonth) * daysRemaining;
        double chargeForNewPlan = (newPrice / daysInMonth) * daysRemaining;

        return new ProrationPreview(
            creditForRemaining,
            chargeForNewPlan,
            chargeForNewPlan - creditForRemaining,
            Instant.now().plusSeconds(86400).toString(),
            daysRemaining
        );
    }

    public Line changePlan(String customerId, String lineId, String newPlanId) {
        List<Line> lines = customerLines.get(customerId);
        if (lines == null) return null;

        return lines.stream()
            .filter(l -> l.lineId().equals(lineId))
            .findFirst()
            .map(line -> new Line(
                line.lineId(), line.customerId(), line.phoneNumber(), "ACTIVE",
                newPlanId, "New Plan", 29.99,
                line.simType(), line.esimQrCode(), line.esimActivationCode(),
                line.activationDate(), line.ean13Code(), line.iccid(),
                line.deliveryStatus(), line.deliveryAddress(), line.estimatedDelivery()
            ))
            .orElse(null);
    }

    public NumberPorting startPorting(String customerId, String lineId, PortNumberRequest request) {
        pendingPortings.put(lineId, "IN_PROGRESS");
        return new NumberPorting(
            "IN_PROGRESS",
            request.donorOperator(),
            Instant.now().toString(),
            Instant.now().plusSeconds(172800).toString(),
            "123456",
            false
        );
    }

    public boolean verifyPortingOtp(String customerId, String lineId, String otp) {
        // Mock verification
        return "123456".equals(otp);
    }
}
