package com.gigshield.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "environmental_events", indexes = {
    @Index(name = "idx_event_city_timestamp", columnList = "city, event_timestamp"),
    @Index(name = "idx_event_city", columnList = "city"),
    @Index(name = "idx_event_timestamp", columnList = "event_timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvironmentalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String city;

    @Column(name = "event_type", length = 30)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    @Column(name = "rainfall_mm", precision = 6, scale = 2)
    private BigDecimal rainfallMm;

    @Column(name = "temperature_c", precision = 5, scale = 2)
    private BigDecimal temperatureC;

    @Column
    private Integer aqi;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;

    @Column(name = "source_api", length = 50)
    private String sourceApi;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonIgnore
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Claim> claims;

    @JsonIgnore
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DeliveryStats> deliveryStats;

    // Soft delete
    @Column(name = "deleted")
    private Boolean deleted;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (deleted == null) deleted = false;
    }

    public enum EventType {
        HEAVY_RAIN, EXTREME_HEAT, HIGH_POLLUTION
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
