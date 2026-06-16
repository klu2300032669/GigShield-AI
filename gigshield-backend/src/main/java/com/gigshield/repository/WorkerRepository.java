package com.gigshield.repository;

import com.gigshield.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    Optional<Worker> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(Worker.Role role);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Worker w SET w.deleted = true, w.deletedAt = CURRENT_TIMESTAMP, w.isActive = false WHERE w.id = :id")
    void softDeleteWorker(@org.springframework.data.repository.query.Param("id") Long id);
}
