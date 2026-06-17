package com.gigshield.repository;

import com.gigshield.model.Policy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    List<Policy> findByWorkerId(Long workerId);

    List<Policy> findByWorkerIdAndStatus(Long workerId, Policy.PolicyStatus status);

    List<Policy> findByStatus(Policy.PolicyStatus status);

    @Query("SELECT p FROM Policy p JOIN FETCH p.worker JOIN FETCH p.plan ORDER BY p.createdAt DESC")
    List<Policy> findAllWithDetails();

    @Query(value = "SELECT p FROM Policy p JOIN FETCH p.worker JOIN FETCH p.plan",
           countQuery = "SELECT COUNT(p) FROM Policy p")
    Page<Policy> findAllPaginated(Pageable pageable);

    @Query(value = "SELECT p FROM Policy p JOIN FETCH p.worker JOIN FETCH p.plan WHERE p.worker.id = :workerId",
           countQuery = "SELECT COUNT(p) FROM Policy p WHERE p.worker.id = :workerId")
    Page<Policy> findByWorkerIdPaginated(@org.springframework.data.repository.query.Param("workerId") Long workerId, Pageable pageable);

    @Query("SELECT p FROM Policy p JOIN FETCH p.worker JOIN FETCH p.plan WHERE p.id = :id")
    Optional<Policy> findByIdWithDetails(Long id);
}
