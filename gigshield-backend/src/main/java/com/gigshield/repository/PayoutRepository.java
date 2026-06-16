package com.gigshield.repository;

import com.gigshield.model.Payout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {

    Optional<Payout> findByClaimId(Long claimId);

    @Query("SELECT p FROM Payout p JOIN FETCH p.claim c JOIN FETCH c.policy pol JOIN FETCH pol.worker " +
           "WHERE pol.worker.id = :workerId ORDER BY p.paidAt DESC")
    List<Payout> findByWorkerId(Long workerId);

    @Query("SELECT p FROM Payout p JOIN FETCH p.claim c JOIN FETCH c.policy pol JOIN FETCH pol.worker " +
           "ORDER BY p.paidAt DESC")
    List<Payout> findAllWithDetails();

    @Query(value = "SELECT p FROM Payout p JOIN FETCH p.claim c JOIN FETCH c.policy pol JOIN FETCH pol.worker",
           countQuery = "SELECT COUNT(p) FROM Payout p")
    Page<Payout> findAllPaginated(Pageable pageable);

    @Query(value = "SELECT p FROM Payout p JOIN FETCH p.claim c JOIN FETCH c.policy pol JOIN FETCH pol.worker WHERE pol.worker.id = :workerId",
           countQuery = "SELECT COUNT(p) FROM Payout p WHERE p.claim.policy.worker.id = :workerId")
    Page<Payout> findByWorkerIdPaginated(@org.springframework.data.repository.query.Param("workerId") Long workerId, Pageable pageable);

    List<Payout> findByStatus(Payout.PayoutStatus status);
}
