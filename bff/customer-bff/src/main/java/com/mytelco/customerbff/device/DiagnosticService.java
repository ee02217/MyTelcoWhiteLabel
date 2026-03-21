package com.mytelco.customerbff.device;

import org.springframework.stereotype.Service;

import java.util.Map;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class DiagnosticService {

    private final Random random = new Random();

    public DiagnosticRunResponse runDiagnostics(String lineId, List<DiagnosticTestType> testTypes) {
        List<DiagnosticResult> results = new ArrayList<>();

        if (testTypes == null || testTypes.isEmpty()) {
            testTypes = List.of(
                DiagnosticTestType.SIGNAL_STRENGTH,
                DiagnosticTestType.DATA_CONNECTIVITY,
                DiagnosticTestType.VOICE_CALL,
                DiagnosticTestType.SMS_DELIVERY,
                DiagnosticTestType.APN_CONFIGURATION,
                DiagnosticTestType.LATENCY_TEST
            );
        }

        for (DiagnosticTestType testType : testTypes) {
            results.add(runTest(lineId, testType));
        }

        DiagnosticSeverity overallSeverity = results.stream()
            .map(DiagnosticResult::severity)
            .max((a, b) -> a.ordinal() - b.ordinal())
            .orElse(DiagnosticSeverity.OK);

        boolean escalationRecommended = overallSeverity == DiagnosticSeverity.CRITICAL
            || results.stream().filter(r -> r.severity() == DiagnosticSeverity.WARNING).count() >= 3;

        return new DiagnosticRunResponse(
            lineId,
            results,
            overallSeverity,
            escalationRecommended,
            Instant.now()
        );
    }

    private DiagnosticResult runTest(String lineId, DiagnosticTestType testType) {
        return switch (testType) {
            case SIGNAL_STRENGTH -> testSignalStrength(lineId);
            case DATA_CONNECTIVITY -> testDataConnectivity(lineId);
            case VOICE_CALL -> testVoiceCall(lineId);
            case SMS_DELIVERY -> testSmsDelivery(lineId);
            case APN_CONFIGURATION -> testApnConfiguration(lineId);
            case LATENCY_TEST -> testLatency(lineId);
        };
    }

    private DiagnosticResult testSignalStrength(String lineId) {
        int signalDbm = -70 - random.nextInt(40);
        boolean good = signalDbm > -90;

        return new DiagnosticResult(
            DiagnosticTestType.SIGNAL_STRENGTH,
            good ? DiagnosticSeverity.OK : DiagnosticSeverity.WARNING,
            String.format("Signal strength: %d dBm", signalDbm),
            good ? "Signal is good." : "Move to an area with better coverage or check for obstructions.",
            Map.of("signalDbm", signalDbm, "bars", Math.max(1, (signalDbm + 120) / 10))
        );
    }

    private DiagnosticResult testDataConnectivity(String lineId) {
        boolean connected = random.nextInt(10) > 1;

        return new DiagnosticResult(
            DiagnosticTestType.DATA_CONNECTIVITY,
            connected ? DiagnosticSeverity.OK : DiagnosticSeverity.CRITICAL,
            connected ? "Data connection active" : "Data connection failed",
            connected ? "Data is working normally." : "Check APN settings or toggle airplane mode.",
            Map.of("connected", connected, "apn", "internet.operator.com")
        );
    }

    private DiagnosticResult testVoiceCall(String lineId) {
        boolean working = random.nextInt(10) > 2;

        return new DiagnosticResult(
            DiagnosticTestType.VOICE_CALL,
            working ? DiagnosticSeverity.OK : DiagnosticSeverity.WARNING,
            working ? "Voice calls operational" : "Voice call issues detected",
            working ? "Voice service is normal." : "Try restarting your device. If issue persists, contact support.",
            Map.of("voLTE", true, "csFallback", !working)
        );
    }

    private DiagnosticResult testSmsDelivery(String lineId) {
        boolean working = random.nextInt(10) > 1;

        return new DiagnosticResult(
            DiagnosticTestType.SMS_DELIVERY,
            working ? DiagnosticSeverity.OK : DiagnosticSeverity.WARNING,
            working ? "SMS delivery working" : "SMS delivery delays detected",
            working ? "SMS is working normally." : "Check message center number in settings.",
            Map.of("mmsCapable", true, "deliveryRate", working ? 100 : 85)
        );
    }

    private DiagnosticResult testApnConfiguration(String lineId) {
        boolean correct = random.nextInt(10) > 1;

        return new DiagnosticResult(
            DiagnosticTestType.APN_CONFIGURATION,
            correct ? DiagnosticSeverity.OK : DiagnosticSeverity.CRITICAL,
            correct ? "APN configuration correct" : "APN configuration error",
            correct ? "APN settings are correct." : "Reset APN to default or contact support for APN details.",
            Map.of("apnName", "internet.operator.com", "protocol", "IPV4V6", "correct", correct)
        );
    }

    private DiagnosticResult testLatency(String lineId) {
        int latencyMs = 20 + random.nextInt(80);

        return new DiagnosticResult(
            DiagnosticTestType.LATENCY_TEST,
            latencyMs < 80 ? DiagnosticSeverity.OK : DiagnosticSeverity.WARNING,
            String.format("Latency: %d ms", latencyMs),
            latencyMs < 80 ? "Network latency is acceptable." : "High latency may affect streaming/gaming. Try different network.",
            Map.of("latencyMs", latencyMs, "jitterMs", latencyMs / 5)
        );
    }

    public String escalateWithDiagnostics(String lineId, DiagnosticRunResponse diagnostics) {
        return "ESC-" + System.currentTimeMillis();
    }
}
