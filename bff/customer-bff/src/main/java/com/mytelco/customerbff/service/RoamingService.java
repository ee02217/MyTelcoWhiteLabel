package com.mytelco.customerbff.service;

import com.mytelco.customerbff.model.RoamingPack;
import com.mytelco.customerbff.model.RoamingPackPurchaseRequest;
import com.mytelco.customerbff.model.RoamingPackPurchaseResponse;
import com.mytelco.customerbff.provider.RoamingProvider;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoamingService {

    private final RoamingProvider provider;

    public RoamingService(RoamingProvider provider) {
        this.provider = provider;
    }

    public List<RoamingPack> listPacks(String country, String lineId) {
        return provider.listPacks(country);
    }

    public RoamingPackPurchaseResponse purchase(RoamingPackPurchaseRequest request) {
        RoamingPack selected = provider.listPacks(request.country()).stream()
            .filter(pack -> pack.packId().equals(request.packId()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Pack not available"));
        return provider.purchase(request.lineId(), request.country(), selected);
    }
}
