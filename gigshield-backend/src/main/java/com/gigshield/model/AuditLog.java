package com.gigshield.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_performer", columnList = "performed_by")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String action; // CLAIM_APPROVED, CLAIM_REJECTED, WORKER_TOGGLED, WORKER_PROMOTED, etc.

    @Column(name = "entity_type", length = 50)
    private String entityType; // CLAIM, WORKER, POLICY, PAYOUT

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy; // Email of the admin who performed the action

    @Column(length = 500)
    private String details; // Human-readable description

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
