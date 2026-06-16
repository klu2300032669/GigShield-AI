package com.gigshield.repository;

import com.gigshield.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
    List<Notification> findByWorkerIdAndIsReadFalse(Long workerId);
    long countByWorkerIdAndIsReadFalse(Long workerId);
}
