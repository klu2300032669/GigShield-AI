package com.gigshield.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "webhooks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Webhook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "partner_name", nullable = false, length = 100)
    private String partnerName;

    @Column(name = "event_types", length = 500)
    private String eventTypes; // Comma-separated: CLAIM_CREATED, CLAIM_APPROVED, EVENT_RECORDED

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "secret_key", length = 255)
    private String secretKey;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_triggered_at")
    private LocalDateTime lastTriggeredAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    public enum EventType {
        CLAIM_CREATED, CLAIM_APPROVED, CLAIM_REJECTED, EVENT_RECORDED, PAYOUT_COMPLETED
    }
}
