package com.gigshield.repository;

import com.gigshield.model.Webhook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, Long> {

    List<Webhook> findByIsActiveTrue();

    List<Webhook> findByEventTypesContaining(String eventType);
}
