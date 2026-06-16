package com.gigshield.repository;

import com.gigshield.model.Claim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    @Query("SELECT c FROM Claim c JOIN FETCH c.policy p JOIN FETCH p.worker JOIN FETCH p.plan " +
           "JOIN FETCH c.event WHERE p.worker.id = :workerId ORDER BY c.triggeredAt DESC")
    List<Claim> findByWorkerId(Long workerId);

    @Query("SELECT c FROM Claim c JOIN FETCH c.policy p JOIN FETCH p.worker JOIN FETCH p.plan " +
           "JOIN FETCH c.event ORDER BY c.triggeredAt DESC")
    List<Claim> findAllWithDetails();

    @Query(value = "SELECT c FROM Claim c JOIN FETCH c.policy p JOIN FETCH p.worker JOIN FETCH p.plan JOIN FETCH c.event",
           countQuery = "SELECT COUNT(c) FROM Claim c")
    Page<Claim> findAllPaginated(Pageable pageable);

    @Query(value = "SELECT c FROM Claim c JOIN FETCH c.policy p JOIN FETCH p.worker JOIN FETCH p.plan JOIN FETCH c.event WHERE p.worker.id = :workerId",
           countQuery = "SELECT COUNT(c) FROM Claim c WHERE c.policy.worker.id = :workerId")
    Page<Claim> findByWorkerIdPaginated(@org.springframework.data.repository.query.Param("workerId") Long workerId, Pageable pageable);

    @Query("SELECT c FROM Claim c JOIN FETCH c.policy p JOIN FETCH p.worker JOIN FETCH p.plan " +
           "JOIN FETCH c.event WHERE c.id = :id")
    Optional<Claim> findByIdWithDetails(Long id);

    List<Claim> findByPolicyId(Long policyId);
    List<Claim> findByStatus(Claim.ClaimStatus status);
}
