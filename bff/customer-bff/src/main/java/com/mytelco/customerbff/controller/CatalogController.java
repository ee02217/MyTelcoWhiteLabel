package com.mytelco.customerbff.controller;

import com.mytelco.customerbff.model.CatalogConfirmSelectionRequest;
import com.mytelco.customerbff.model.CatalogConfirmSelectionResponse;
import com.mytelco.customerbff.model.CatalogResponse;
import com.mytelco.customerbff.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/catalog")
@Tag(name = "Customer Catalog", description = "Plan and add-on catalog endpoints")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    @Operation(summary = "Get plan/add-on catalog")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catalog retrieved"),
        @ApiResponse(responseCode = "400", description = "Invalid query parameters")
    })
    public ResponseEntity<CatalogResponse> getCatalog(
        @RequestParam String lineId,
        @RequestParam String operatorId,
        @RequestParam(required = false) String type
    ) {
        return ResponseEntity.ok(catalogService.getCatalog(lineId, operatorId, type));
    }

    @PostMapping("/confirm-selection")
    @Operation(summary = "Confirm selected catalog items")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Selection confirmed"),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    public ResponseEntity<CatalogConfirmSelectionResponse> confirmSelection(
        @Valid @RequestBody CatalogConfirmSelectionRequest request
    ) {
        return ResponseEntity.ok(catalogService.confirmSelection(request));
    }
}
