package com.gigshield.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "claims", indexes = {
    @Index(name = "idx_claim_status", columnList = "status"),
    @Index(name = "idx_claim_triggered_at", columnList = "triggered_at"),
    @Index(name = "idx_claim_policy_id", columnList = "policy_id")
})
@SQLDelete(sql = "UPDATE claims SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id=? AND version=?")
@SQLRestriction("deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"claims", "worker", "plan"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @JsonIgnoreProperties({"claims", "deliveryStats"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private EnvironmentalEvent event;

    @Column(name = "risk_score", precision = 5, scale = 4)
    private BigDecimal riskScore;

    @Column(name = "estimated_loss", nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedLoss;

    @Column(name = "claim_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal claimAmount;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private ClaimStatus status;

    @Column(name = "fraud_check_passed")
    private Boolean fraudCheckPassed;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @JsonIgnoreProperties({"claim"})
    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payout payout;

    // Optimistic locking
    @Version
    private Long version;

    // Soft delete
    @Column(name = "deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (triggeredAt == null) triggeredAt = LocalDateTime.now();
        if (status == null) status = ClaimStatus.PENDING;
        if (fraudCheckPassed == null) fraudCheckPassed = false;
        if (deleted == null) deleted = false;
    }

    public enum ClaimStatus {
        PENDING, APPROVED, REJECTED, PAID
    }
}
