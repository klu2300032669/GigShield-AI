package com.gigshield.controller;

import com.gigshield.dto.ApiResponse;
import com.gigshield.model.Webhook;
import com.gigshield.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Partner webhook registration and management")
public class WebhookController {

    private final WebhookService webhookService;

    @PostMapping("/register")
    @Operation(summary = "Register a new webhook endpoint")
    public ResponseEntity<ApiResponse<Webhook>> registerWebhook(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        String partnerName = body.getOrDefault("partnerName", "Unknown Partner");
        String eventTypes = body.getOrDefault("eventTypes", "CLAIM_CREATED,CLAIM_APPROVED");

        Webhook webhook = webhookService.registerWebhook(url, partnerName, eventTypes);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Webhook registered successfully", webhook));
    }

    @GetMapping
    @Operation(summary = "List all registered webhooks")
    public ResponseEntity<ApiResponse<List<Webhook>>> getAllWebhooks() {
        List<Webhook> webhooks = webhookService.getAllWebhooks();
        return ResponseEntity.ok(ApiResponse.success(webhooks));
    }

    @PutMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a webhook")
    public ResponseEntity<ApiResponse<String>> deactivateWebhook(@PathVariable Long id) {
        webhookService.deactivateWebhook(id);
        return ResponseEntity.ok(ApiResponse.success("Webhook deactivated", "success"));
    }
}
