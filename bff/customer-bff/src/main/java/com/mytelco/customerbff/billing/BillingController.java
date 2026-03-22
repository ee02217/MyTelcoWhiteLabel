package com.mytelco.customerbff.billing;

import com.mytelco.customerbff.security.CustomerIdentityResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/billing")
public class BillingController {

    private final BillingService billingService;
    private final CustomerIdentityResolver customerIdentityResolver;

    public BillingController(BillingService billingService, CustomerIdentityResolver customerIdentityResolver) {
        this.billingService = billingService;
        this.customerIdentityResolver = customerIdentityResolver;
    }

    // Payment Methods
    @GetMapping("/payment-methods")
    public ResponseEntity<List<PaymentMethod>> getPaymentMethods(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.getPaymentMethods(customerId));
    }

    @PostMapping("/payment-methods")
    public ResponseEntity<PaymentMethod> addPaymentMethod(
        Authentication authentication,
        @RequestBody AddPaymentMethodRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.addPaymentMethod(customerId, request));
    }

    @DeleteMapping("/payment-methods/{paymentMethodId}")
    public ResponseEntity<Map<String, Boolean>> deletePaymentMethod(
        Authentication authentication,
        @PathVariable String paymentMethodId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        boolean deleted = billingService.deletePaymentMethod(customerId, paymentMethodId);
        return ResponseEntity.ok(Map.of("success", deleted));
    }

    @PutMapping("/payment-methods/{paymentMethodId}/default")
    public ResponseEntity<PaymentMethod> setDefaultPaymentMethod(
        Authentication authentication,
        @PathVariable String paymentMethodId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        PaymentMethod method = billingService.setDefaultPaymentMethod(customerId, paymentMethodId);
        return method != null ? ResponseEntity.ok(method) : ResponseEntity.notFound().build();
    }

    // Billing Addresses
    @GetMapping("/addresses")
    public ResponseEntity<List<BillingAddress>> getBillingAddresses(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.getBillingAddresses(customerId));
    }

    @PostMapping("/addresses")
    public ResponseEntity<BillingAddress> addBillingAddress(
        Authentication authentication,
        @RequestBody AddAddressRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.addBillingAddress(customerId, request));
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<Map<String, Boolean>> deleteBillingAddress(
        Authentication authentication,
        @PathVariable String addressId
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        boolean deleted = billingService.deleteBillingAddress(customerId, addressId);
        return ResponseEntity.ok(Map.of("success", deleted));
    }

    // Auto-Pay
    @GetMapping("/autopay")
    public ResponseEntity<AutoPayConfig> getAutoPayConfig(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.getAutoPayConfig(customerId));
    }

    @PutMapping("/autopay")
    public ResponseEntity<AutoPayConfig> updateAutoPay(
        Authentication authentication,
        @RequestBody UpdateAutoPayRequest request
    ) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.updateAutoPay(
            customerId, 
            request.enabled(), 
            request.paymentMethodId(), 
            request.scheduleDay()
        ));
    }

    // Invoices
    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> getInvoices(Authentication authentication) {
        String customerId = customerIdentityResolver.resolveCustomerId(authentication);
        return ResponseEntity.ok(billingService.getInvoices(customerId));
    }
}

record UpdateAutoPayRequest(
    boolean enabled,
    String paymentMethodId,
    String scheduleDay
) {}
