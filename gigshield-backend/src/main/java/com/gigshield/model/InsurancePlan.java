package com.gigshield.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "insurance_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsurancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "coverage_type", length = 50)
    @Enumerated(EnumType.STRING)
    private CoverageType coverageType;

    @Column(name = "premium_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal premiumAmount;

    @Column(name = "max_payout", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxPayout;

    @Column(name = "billing_cycle", length = 20)
    @Enumerated(EnumType.STRING)
    private BillingCycle billingCycle;

    @Column(name = "is_active")
    private Boolean isActive;

    @JsonIgnore
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Policy> policies;

    @PrePersist
    protected void onCreate() {
        if (isActive == null) isActive = true;
    }

    public enum CoverageType {
        RAIN, HEAT, POLLUTION, ALL
    }

    public enum BillingCycle {
        WEEKLY, MONTHLY
    }
}
