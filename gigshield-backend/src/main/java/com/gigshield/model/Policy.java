package com.gigshield.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import org.hibernate.annotations.Check;

@Entity
@Table(name = "policies", indexes = {
    @Index(name = "idx_policy_worker_status", columnList = "worker_id, status"),
    @Index(name = "idx_policy_end_date", columnList = "end_date"),
    @Index(name = "idx_policy_status", columnList = "status")
})
@Check(constraints = "end_date > start_date")
@SQLDelete(sql = "UPDATE policies SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id=? AND version=?")
@SQLRestriction("deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"policies", "activities", "deliveryStats", "notifications"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @JsonIgnoreProperties({"policies"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private InsurancePlan plan;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private PolicyStatus status;

    @Column(name = "premium_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal premiumPaid;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Claim> claims;

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
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = PolicyStatus.ACTIVE;
        if (deleted == null) deleted = false;
    }

    public enum PolicyStatus {
        ACTIVE, EXPIRED, CANCELLED
    }
}
