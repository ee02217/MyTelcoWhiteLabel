package com.mytelco.customerbff;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mytelco.customerbff.controller.EsimController;
import com.mytelco.customerbff.controller.RoamingController;
import com.mytelco.customerbff.controller.SimController;
import com.mytelco.customerbff.family.FamilyRoleService;
import com.mytelco.customerbff.model.EsimActivationResponse;
import com.mytelco.customerbff.model.EsimActivationStatus;
import com.mytelco.customerbff.model.RoamingPack;
import com.mytelco.customerbff.model.RoamingPackPurchaseRequest;
import com.mytelco.customerbff.model.RoamingPackPurchaseResponse;
import com.mytelco.customerbff.model.SimActionRequest;
import com.mytelco.customerbff.model.SimActionResponse;
import com.mytelco.customerbff.model.SimStatus;
import com.mytelco.customerbff.model.StepUpAction;
import com.mytelco.customerbff.security.CustomerIdentityResolver;
import com.mytelco.customerbff.service.EsimService;
import com.mytelco.customerbff.service.RoamingService;
import com.mytelco.customerbff.service.SimService;
import com.mytelco.customerbff.service.StepUpAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({SimController.class, EsimController.class, RoamingController.class})
class SimEsimRoamingControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SimService simService;

    @MockBean
    private StepUpAuthService stepUpAuthService;

    @MockBean
    private EsimService esimService;

    @MockBean
    private RoamingService roamingService;

    @MockBean
    private CustomerIdentityResolver customerIdentityResolver;

    @MockBean
    private FamilyRoleService familyRoleService;

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void simBlockRejectsWithoutValidStepUp() throws Exception {
        SimActionRequest request = new SimActionRequest("bad-token", "lost phone");
        when(stepUpAuthService.isVerificationTokenValid("bad-token", "line-1", StepUpAction.SIM_BLOCK)).thenReturn(false);

        mockMvc.perform(post("/api/v1/customer/sim/line-1/block")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void esimStatusContractExposesLifecycleState() throws Exception {
        when(esimService.getStatus("line-1")).thenReturn(new EsimActivationResponse(
            "line-1", "esim-1", "LPA:1$test", "QR-line-1", EsimActivationStatus.ACTIVATION_IN_PROGRESS, Instant.now()
        ));

        mockMvc.perform(get("/api/v1/customer/esim/line-1/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lineId").value("line-1"))
            .andExpect(jsonPath("$.status").value("ACTIVATION_IN_PROGRESS"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void roamingPurchaseContractReturnsAllowanceAndValidity() throws Exception {
        when(roamingService.purchase(any(RoamingPackPurchaseRequest.class))).thenReturn(new RoamingPackPurchaseResponse(
            "line-1", "PT", "pack-weekly-3gb", 3, LocalDate.now(), LocalDate.now().plusDays(7), "PURCHASED"
        ));
        when(roamingService.listPacks(eq("pt"), eq("line-1"))).thenReturn(List.of(
            new RoamingPack("pack-weekly-3gb", "PT", "Roaming 3GB / 7 days", 3, 7, new BigDecimal("9.99"), "EUR")
        ));

        mockMvc.perform(get("/api/v1/customer/roaming/packs?country=pt&lineId=line-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].packId").value("pack-weekly-3gb"));

        mockMvc.perform(post("/api/v1/customer/roaming/packs/purchase")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new RoamingPackPurchaseRequest("line-1", "pt", "pack-weekly-3gb"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.updatedAllowanceGb").value(3))
            .andExpect(jsonPath("$.validUntil").exists());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void simBlockContractReturnsStateOnSuccess() throws Exception {
        when(stepUpAuthService.isVerificationTokenValid("good-token", "line-1", StepUpAction.SIM_BLOCK)).thenReturn(true);
        when(simService.block("line-1")).thenReturn(new SimActionResponse(
            "line-1", SimStatus.ACTIVE, SimStatus.BLOCKED, Instant.now(), "SIM blocked"
        ));

        mockMvc.perform(post("/api/v1/customer/sim/line-1/block")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new SimActionRequest("good-token", "lost device"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.currentStatus").value("BLOCKED"));
    }
}
