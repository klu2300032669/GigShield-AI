package com.gigshield.service;

import com.gigshield.model.Webhook;
import com.gigshield.repository.WebhookRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class WebhookService {

    private final WebhookRepository webhookRepository;

    @Transactional
    public Webhook registerWebhook(String url, String partnerName, String eventTypes) {
        Webhook webhook = Webhook.builder()
                .url(url)
                .partnerName(partnerName)
                .eventTypes(eventTypes)
                .secretKey("whsec_" + UUID.randomUUID().toString().replace("-", ""))
                .build();
        return webhookRepository.save(webhook);
    }

    public List<Webhook> getAllActiveWebhooks() {
        return webhookRepository.findByIsActiveTrue();
    }

    public List<Webhook> getAllWebhooks() {
        return webhookRepository.findAll();
    }

    @Transactional
    public void deactivateWebhook(Long id) {
        webhookRepository.findById(id).ifPresent(wh -> {
            wh.setIsActive(false);
            webhookRepository.save(wh);
        });
    }

    /**
     * Fires webhook events asynchronously to all registered endpoints
     * that are subscribed to this event type.
     */
    @Async
    public void fireEvent(String eventType, Map<String, Object> payload) {
        List<Webhook> webhooks = webhookRepository.findByIsActiveTrue();

        for (Webhook webhook : webhooks) {
            if (webhook.getEventTypes() != null && webhook.getEventTypes().contains(eventType)) {
                try {
                    RestTemplate restTemplate = new RestTemplate();
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    headers.set("X-Webhook-Secret", webhook.getSecretKey());
                    headers.set("X-Webhook-Event", eventType);

                    Map<String, Object> body = Map.of(
                            "event", eventType,
                            "timestamp", LocalDateTime.now().toString(),
                            "data", payload
                    );

                    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
                    restTemplate.postForEntity(webhook.getUrl(), request, String.class);

                    webhook.setLastTriggeredAt(LocalDateTime.now());
                    webhookRepository.save(webhook);

                    log.info("Webhook fired: {} -> {}", eventType, webhook.getUrl());
                } catch (Exception e) {
                    log.warn("Webhook delivery failed for {}: {}", webhook.getUrl(), e.getMessage());
                }
            }
        }
    }
}
