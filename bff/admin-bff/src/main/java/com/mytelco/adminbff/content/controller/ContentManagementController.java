package com.mytelco.adminbff.content.controller;

import com.mytelco.adminbff.content.model.ContentLocaleResponse;
import com.mytelco.adminbff.content.model.ContentRollbackRequest;
import com.mytelco.adminbff.content.model.ContentSummaryResponse;
import com.mytelco.adminbff.content.model.ContentUpdateRequest;
import com.mytelco.adminbff.content.model.ContentVersionResponse;
import com.mytelco.adminbff.content.service.ContentManagementService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/operators/{operatorId}/content")
public class ContentManagementController {

    private final ContentManagementService contentManagementService;

    public ContentManagementController(ContentManagementService contentManagementService) {
        this.contentManagementService = contentManagementService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ContentSummaryResponse> listContent(@PathVariable String operatorId) {
        return contentManagementService.listContent(operatorId);
    }

    @GetMapping(value = "/{contentId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ContentLocaleResponse getContent(
        @PathVariable String operatorId,
        @PathVariable String contentId,
        @RequestParam("locale") String locale,
        @RequestParam(value = "version", required = false) Integer version
    ) {
        return contentManagementService.getContent(operatorId, contentId, locale, version);
    }

    @PatchMapping(value = "/{contentId}", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ContentVersionResponse updateContent(
        @PathVariable String operatorId,
        @PathVariable String contentId,
        @RequestBody ContentUpdateRequest request,
        Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "system";
        return contentManagementService.updateContent(operatorId, contentId, request, actor);
    }

    @PostMapping(value = "/{contentId}/rollback", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ContentVersionResponse rollbackContent(
        @PathVariable String operatorId,
        @PathVariable String contentId,
        @RequestBody ContentRollbackRequest request,
        Principal principal
    ) {
        String actor = principal != null ? principal.getName() : "system";
        return contentManagementService.rollbackContent(operatorId, contentId, request, actor);
    }
}
