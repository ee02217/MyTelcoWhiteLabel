package com.mytelco.customerbff.lines;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/lines")
public class LineController {

    private final LineService lineService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public LineController(LineService lineService, CustomerIdentityResolver customerIdentityResolver) {
        this.lineService = lineService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    @GetMapping
    public ResponseEntity<List<Line>> getLines(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(lineService.getLines(customerId));
    }

    @GetMapping("/{lineId}")
    public ResponseEntity<Line> getLine(Authentication authentication, @PathVariable String lineId) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        Line line = lineService.getLine(customerId, lineId);
        return line != null ? ResponseEntity.ok(line) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{lineId}/details")
    public ResponseEntity<LineDetails> getLineDetails(Authentication authentication, @PathVariable String lineId) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        LineDetails details = lineService.getLineDetails(customerId, lineId);
        return details != null ? ResponseEntity.ok(details) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Line> addLine(Authentication authentication, @RequestBody AddLineRequest request) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(lineService.addLine(customerId, request));
    }

    @PostMapping("/{lineId}/cancel")
    public ResponseEntity<Line> cancelLine(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestBody CancelLineRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        Line line = lineService.cancelLine(customerId, lineId, request);
        return line != null ? ResponseEntity.ok(line) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{lineId}/proration")
    public ResponseEntity<ProrationPreview> getProrationPreview(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestParam String newPlanId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        ProrationPreview preview = lineService.getProrationPreview(customerId, lineId, newPlanId);
        return preview != null ? ResponseEntity.ok(preview) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{lineId}/change-plan")
    public ResponseEntity<Line> changePlan(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestBody ChangePlanRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        Line line = lineService.changePlan(customerId, lineId, request.planId());
        return line != null ? ResponseEntity.ok(line) : ResponseEntity.notFound().build();
    }

    @PostMapping("/{lineId}/porting")
    public ResponseEntity<NumberPorting> startPorting(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestBody PortNumberRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(lineService.startPorting(customerId, lineId, request));
    }

    @PostMapping("/{lineId}/porting/verify")
    public ResponseEntity<Map<String, Boolean>> verifyPortingOtp(
        Authentication authentication,
        @PathVariable String lineId,
        @RequestBody Map<String, String> body
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        String otp = body.get("otp");
        boolean verified = lineService.verifyPortingOtp(customerId, lineId, otp);
        return ResponseEntity.ok(Map.of("verified", verified));
    }
}
