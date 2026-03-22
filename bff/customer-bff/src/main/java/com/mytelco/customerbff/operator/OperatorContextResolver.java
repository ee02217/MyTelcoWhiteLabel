package com.mytelco.customerbff.operator;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.mytelco.customerbff.config.OperatorAdapterProperties;

@Component
public class OperatorContextResolver {

    private final OperatorAdapterProperties properties;

    public OperatorContextResolver(OperatorAdapterProperties properties) {
        this.properties = properties;
    }

    public String resolveOperatorId(String customerId) {
        String mapped = properties.getCustomerOperatorOverrides().get(customerId);
        if (StringUtils.hasText(mapped)) {
            return mapped;
        }
        return properties.getDefaultOperatorId();
    }
}
