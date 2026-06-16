package com.gigshield.repository;

import com.gigshield.model.InsurancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InsurancePlanRepository extends JpaRepository<InsurancePlan, Long> {
    List<InsurancePlan> findByIsActiveTrue();
    List<InsurancePlan> findByCoverageType(InsurancePlan.CoverageType coverageType);
}
