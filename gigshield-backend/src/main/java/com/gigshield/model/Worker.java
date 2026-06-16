package com.gigshield.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "workers", indexes = {
    @Index(name = "idx_worker_email", columnList = "email"),
    @Index(name = "idx_worker_role", columnList = "role"),
    @Index(name = "idx_worker_city", columnList = "city")
})
@SQLDelete(sql = "UPDATE workers SET deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id=? AND version=?")
@SQLRestriction("deleted = false")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false, length = 50)
    private String city;

    @Column(name = "platform_name", length = 50)
    private String platformName;

    @Column(name = "role", length = 20)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate;

    @Column(name = "is_active")
    private Boolean isActive;

    @JsonIgnore
    @OneToMany(mappedBy = "worker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Policy> policies;

    @JsonIgnore
    @OneToMany(mappedBy = "worker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<WorkerActivity> activities;

    @JsonIgnore
    @OneToMany(mappedBy = "worker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DeliveryStats> deliveryStats;

    @JsonIgnore
    @OneToMany(mappedBy = "worker", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Notification> notifications;

    // Optimistic locking
    @Version
    @Column(name = "version", nullable = false, columnDefinition = "bigint default 0")
    @Builder.Default
    private Long version = 0L;

    // Soft Delete
    @Column(name = "deleted", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean deleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (registrationDate == null) registrationDate = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (role == null) role = Role.WORKER;
        if (emailVerified == null) emailVerified = false;
        if (deleted == null) deleted = false;
    }

    public enum Role {
        WORKER, ADMIN
    }
}
