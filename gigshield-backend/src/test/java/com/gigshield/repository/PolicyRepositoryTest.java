package com.gigshield.repository;

import com.gigshield.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class PolicyRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private PolicyRepository policyRepository;

    private Worker worker;
    private InsurancePlan plan;

    @BeforeEach
    void setUp() {
        worker = Worker.builder()
                .fullName("Test Worker")
                .email("policy-test@example.com")
                .passwordHash("$2a$10$hash")
                .phone("9876543210")
                .city("Mumbai")
                .platformName("Swiggy")
                .role(Worker.Role.WORKER)
                .emailVerified(true)
                .isActive(true)
                .deleted(false)
                .build();
        worker = entityManager.persistAndFlush(worker);

        plan = InsurancePlan.builder()
                .planName("Basic Plan")
                .coverageType(InsurancePlan.CoverageType.ALL)
                .premiumAmount(new BigDecimal("99.00"))
                .maxPayout(new BigDecimal("5000.00"))
                .billingCycle(InsurancePlan.BillingCycle.MONTHLY)
                .isActive(true)
                .build();
        plan = entityManager.persistAndFlush(plan);
    }

    private Policy createPolicy(Policy.PolicyStatus status) {
        Policy policy = Policy.builder()
                .worker(worker)
                .plan(plan)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(1))
                .premiumPaid(new BigDecimal("99.00"))
                .status(status)
                .deleted(false)
                .build();
        return entityManager.persistAndFlush(policy);
    }

    @Test
    @DisplayName("findAllPaginated() should return paginated results with JOIN FETCH")
    void findAllPaginated() {
        createPolicy(Policy.PolicyStatus.ACTIVE);
        createPolicy(Policy.PolicyStatus.EXPIRED);
        createPolicy(Policy.PolicyStatus.ACTIVE);

        Page<Policy> page = policyRepository.findAllPaginated(PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
        // Verify JOIN FETCH — worker and plan should be loaded
        assertThat(page.getContent().get(0).getWorker().getFullName()).isEqualTo("Test Worker");
        assertThat(page.getContent().get(0).getPlan().getPlanName()).isEqualTo("Basic Plan");
    }

    @Test
    @DisplayName("findByWorkerIdPaginated() should return only the worker's policies")
    void findByWorkerIdPaginated() {
        createPolicy(Policy.PolicyStatus.ACTIVE);
        createPolicy(Policy.PolicyStatus.ACTIVE);

        Page<Policy> page = policyRepository.findByWorkerIdPaginated(worker.getId(), PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getContent()).allMatch(p -> p.getWorker().getId().equals(worker.getId()));
    }

    @Test
    @DisplayName("findByWorkerIdAndStatus() should filter by status")
    void findByWorkerIdAndStatus() {
        createPolicy(Policy.PolicyStatus.ACTIVE);
        createPolicy(Policy.PolicyStatus.EXPIRED);
        createPolicy(Policy.PolicyStatus.ACTIVE);

        var activePolicies = policyRepository.findByWorkerIdAndStatus(worker.getId(), Policy.PolicyStatus.ACTIVE);

        assertThat(activePolicies).hasSize(2);
    }
}
