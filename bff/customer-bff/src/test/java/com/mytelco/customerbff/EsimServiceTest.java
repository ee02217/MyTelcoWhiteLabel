package com.mytelco.customerbff;

import com.mytelco.customerbff.model.EsimActivationStatus;
import com.mytelco.customerbff.provider.EsimProvider;
import com.mytelco.customerbff.service.EsimService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EsimServiceTest {

    @Test
    void statusProgressionMovesFromQrToInProgressToActivated() {
        EsimService service = new EsimService(new EsimProvider());

        var activated = service.activate("line-esim-1");
        assertEquals(EsimActivationStatus.QR_GENERATED, activated.status());

        var firstPoll = service.getStatus("line-esim-1");
        assertEquals(EsimActivationStatus.ACTIVATION_IN_PROGRESS, firstPoll.status());

        var secondPoll = service.getStatus("line-esim-1");
        assertEquals(EsimActivationStatus.ACTIVATED, secondPoll.status());
    }
}
