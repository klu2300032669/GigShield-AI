package com.gigshield.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "expected_deliveries", nullable = false)
    private Integer expectedDeliveries;

    @Column(name = "completed_deliveries", nullable = false)
    private Integer completedDeliveries;

    @Column(name = "delivery_drop_rate", precision = 5, scale = 2)
    private BigDecimal deliveryDropRate;

    @Column(name = "estimated_income_loss", precision = 10, scale = 2)
    private BigDecimal estimatedIncomeLoss;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private EnvironmentalEvent event;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (expectedDeliveries != null && completedDeliveries != null && expectedDeliveries > 0) {
            double dropRate = ((double)(expectedDeliveries - completedDeliveries) / expectedDeliveries) * 100;
            deliveryDropRate = BigDecimal.valueOf(Math.max(0, dropRate));
        }
    }
}
