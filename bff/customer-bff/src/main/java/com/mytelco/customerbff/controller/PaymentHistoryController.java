package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.PaymentHistoryItem;
import com.mytelco.customerbff.model.PaymentHistoryResponse;
import com.mytelco.customerbff.model.PaymentRetryResponse;
import com.mytelco.customerbff.service.PaymentHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/customer/payments")
@Tag(name = "Payment History", description = "Payment history, receipts, and failed payment retries")
public class PaymentHistoryController {

    private final PaymentHistoryService paymentHistoryService;

    public PaymentHistoryController(PaymentHistoryService paymentHistoryService) {
        this.paymentHistoryService = paymentHistoryService;
    }

    @GetMapping("/history")
    @Operation(summary = "Get payment history")
    @ApiResponses({@ApiResponse(responseCode = "200", description = "Payment history for requested months")})
    public ResponseEntity<PaymentHistoryResponse> getPaymentHistory(
        @RequestParam(value = "months", required = false) Integer months
    ) {
        return ResponseEntity.ok(paymentHistoryService.getHistory(months));
    }

    @GetMapping("/receipt/{paymentId}/download")
    @Operation(summary = "Download a payment receipt as PDF")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Receipt downloaded"),
        @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String paymentId) throws IOException {
        PaymentHistoryItem payment = paymentHistoryService.getPayment(paymentId).orElse(null);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }

        Resource pdf = new ClassPathResource("invoices/sample-invoice.pdf");
        byte[] content = pdf.getInputStream().readAllBytes();
        String filename = "receipt-" + payment.referenceId() + ".pdf";

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(content.length)
            .body(content);
    }

    @PostMapping("/{paymentId}/retry")
    @Operation(summary = "Retry a failed payment with idempotency support")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Retry accepted or replayed"),
        @ApiResponse(responseCode = "404", description = "Payment not found")
    })
    public ResponseEntity<PaymentRetryResponse> retryPayment(
        @PathVariable String paymentId,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        PaymentRetryResponse response = paymentHistoryService.retryPayment(paymentId, idempotencyKey);
        if ("NOT_FOUND".equals(response.status())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
