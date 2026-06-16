package com.gigshield.repository;

import com.gigshield.model.DeliveryStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeliveryStatsRepository extends JpaRepository<DeliveryStats, Long> {
    List<DeliveryStats> findByWorkerId(Long workerId);
    List<DeliveryStats> findByWorkerIdAndDateBetween(Long workerId, LocalDate start, LocalDate end);
    List<DeliveryStats> findByWorkerIdAndDate(Long workerId, LocalDate date);
}
