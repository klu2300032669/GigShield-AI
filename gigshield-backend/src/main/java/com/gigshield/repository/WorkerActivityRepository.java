package com.gigshield.repository;

import com.gigshield.model.WorkerActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkerActivityRepository extends JpaRepository<WorkerActivity, Long> {
    List<WorkerActivity> findByWorkerId(Long workerId);
    Optional<WorkerActivity> findByWorkerIdAndDate(Long workerId, LocalDate date);
    List<WorkerActivity> findByWorkerIdAndDateBetween(Long workerId, LocalDate start, LocalDate end);
}
