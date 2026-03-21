package com.mytelco.customerbff.billing;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class BillingService {

    private final Map<String, List<PaymentMethod>> paymentMethods = new HashMap<>();
    private final Map<String, List<BillingAddress>> addresses = new HashMap<>();
    private final Map<String, AutoPayConfig> autoPayConfigs = new HashMap<>();
    private final Map<String, List<Invoice>> invoices = new HashMap<>();

    public BillingService() {
        // Mock payment methods
        List<PaymentMethod> methods = List.of(
            new PaymentMethod("pm-1", "customer-1", "CARD", "4242", "VISA", "12", "2027", true, "2024-01-15T10:00:00Z"),
            new PaymentMethod("pm-2", "customer-1", "CARD", "5555", "MASTERCARD", "06", "2026", false, "2024-06-01T10:00:00Z")
        );
        paymentMethods.put("customer-1", methods);

        // Mock addresses
        List<BillingAddress> addrs = List.of(
            new BillingAddress("addr-1", "customer-1", "line-1", "BILLING", "123 Main St", "Lisbon", "Lisbon", "1100-123", "PT", true, "2024-01-15T10:00:00Z", "2024-01-15T10:00:00Z")
        );
        addresses.put("customer-1", addrs);

        // Mock auto-pay
        autoPayConfigs.put("customer-1", new AutoPayConfig("customer-1", true, "pm-1", "15", "2024-01-15T10:00:00Z"));

        // Mock invoices
        List<Invoice> invs = List.of(
            new Invoice("inv-1", "INV-2026-001", "customer-1", "line-1", "2026-02-01", "2026-02-28", "2026-03-01", "2026-03-15", 35.99, "EUR", "PAID", "/api/v1/customer/payments/receipt/inv-1/download"),
            new Invoice("inv-2", "INV-2026-002", "customer-1", "line-1", "2026-03-01", "2026-03-31", "2026-04-01", "2026-04-15", 35.99, "EUR", "PENDING", "/api/v1/customer/payments/receipt/inv-2/download"),
            new Invoice("inv-3", "INV-2026-003", "customer-1", "line-1", "2026-01-01", "2026-01-31", "2026-02-01", "2026-02-15", 29.99, "EUR", "PAID", "/api/v1/customer/payments/receipt/inv-3/download")
        );
        invoices.put("customer-1", invs);
    }

    // Payment Methods
    public List<PaymentMethod> getPaymentMethods(String customerId) {
        return paymentMethods.computeIfAbsent(customerId, k -> new ArrayList<>());
    }

    public PaymentMethod getPaymentMethod(String customerId, String paymentMethodId) {
        return getPaymentMethods(customerId).stream()
            .filter(pm -> pm.paymentMethodId().equals(paymentMethodId))
            .findFirst()
            .orElse(null);
    }

    public PaymentMethod addPaymentMethod(String customerId, AddPaymentMethodRequest request) {
        PaymentMethod newMethod = new PaymentMethod(
            "pm-" + System.currentTimeMillis(),
            customerId,
            "CARD",
            request.cardLast4(),
            request.cardBrand(),
            request.expiryMonth(),
            request.expiryYear(),
            false,
            Instant.now().toString()
        );
        paymentMethods.computeIfAbsent(customerId, k -> new ArrayList<>()).add(newMethod);
        return newMethod;
    }

    public boolean deletePaymentMethod(String customerId, String paymentMethodId) {
        List<PaymentMethod> methods = paymentMethods.get(customerId);
        if (methods == null) return false;
        
        boolean removed = methods.removeIf(pm -> pm.paymentMethodId().equals(paymentMethodId));
        if (removed && !methods.isEmpty()) {
            // Set first as default if deleted was default
            PaymentMethod first = methods.get(0);
            methods.set(0, new PaymentMethod(
                first.paymentMethodId(), first.customerId(), first.type(),
                first.cardLast4(), first.cardBrand(), first.expiryMonth(), first.expiryYear(),
                true, first.createdAt()
            ));
        }
        return removed;
    }

    public PaymentMethod setDefaultPaymentMethod(String customerId, String paymentMethodId) {
        List<PaymentMethod> methods = paymentMethods.get(customerId);
        if (methods == null) return null;

        List<PaymentMethod> updated = methods.stream()
            .map(pm -> {
                boolean isDefault = pm.paymentMethodId().equals(paymentMethodId);
                return new PaymentMethod(
                    pm.paymentMethodId(), pm.customerId(), pm.type(),
                    pm.cardLast4(), pm.cardBrand(), pm.expiryMonth(), pm.expiryYear(),
                    isDefault, pm.createdAt()
                );
            })
            .toList();
        
        paymentMethods.put(customerId, updated);
        return updated.stream().filter(PaymentMethod::isDefault).findFirst().orElse(null);
    }

    // Billing Addresses
    public List<BillingAddress> getBillingAddresses(String customerId) {
        return addresses.computeIfAbsent(customerId, k -> new ArrayList<>());
    }

    public BillingAddress addBillingAddress(String customerId, AddAddressRequest request) {
        BillingAddress newAddr = new BillingAddress(
            "addr-" + System.currentTimeMillis(),
            customerId,
            request.lineId() != null ? request.lineId() : "line-1",
            request.type() != null ? request.type() : "BILLING",
            request.street(),
            request.city(),
            request.state(),
            request.postalCode(),
            request.country(),
            getBillingAddresses(customerId).isEmpty(),
            Instant.now().toString(),
            Instant.now().toString()
        );
        addresses.computeIfAbsent(customerId, k -> new ArrayList<>()).add(newAddr);
        return newAddr;
    }

    public boolean deleteBillingAddress(String customerId, String addressId) {
        List<BillingAddress> addrs = addresses.get(customerId);
        if (addrs == null) return false;
        return addrs.removeIf(a -> a.addressId().equals(addressId));
    }

    // Auto-Pay
    public AutoPayConfig getAutoPayConfig(String customerId) {
        return autoPayConfigs.computeIfAbsent(customerId, k -> 
            new AutoPayConfig(customerId, false, null, null, Instant.now().toString())
        );
    }

    public AutoPayConfig updateAutoPay(String customerId, boolean enabled, String paymentMethodId, String scheduleDay) {
        AutoPayConfig config = new AutoPayConfig(customerId, enabled, paymentMethodId, scheduleDay, Instant.now().toString());
        autoPayConfigs.put(customerId, config);
        return config;
    }

    // Invoices
    public List<Invoice> getInvoices(String customerId) {
        return invoices.computeIfAbsent(customerId, k -> new ArrayList<>());
    }
}
