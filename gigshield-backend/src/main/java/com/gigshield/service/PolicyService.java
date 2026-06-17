package com.gigshield.service;

import com.gigshield.dto.*;
import com.gigshield.exception.*;
import com.gigshield.model.*;
import com.gigshield.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final WorkerRepository workerRepository;
    private final InsurancePlanRepository insurancePlanRepository;
    private final com.gigshield.client.AIPredictionClient aiPredictionClient;

    @org.springframework.cache.annotation.Cacheable("plans")
    public List<InsurancePlan> getAllActivePlans() {
        return insurancePlanRepository.findByIsActiveTrue();
    }

    public List<InsurancePlanResponseDTO> getDynamicPlans(String city, Double rainfall, Double temp, Integer aqi) {
        List<InsurancePlan> basePlans = getAllActivePlans();
        
        return basePlans.stream().map(plan -> {
            // Build AI Request
            PremiumPredictionRequestDTO aiRequest = PremiumPredictionRequestDTO.builder()
                    .base_premium(plan.getPremiumAmount().doubleValue())
                    .city(city)
                    .rainfall_mm(rainfall)
                    .temperature_c(temp)
                    .aqi(aqi)
                    .coverage_type(plan.getCoverageType().name())
                    .risk_level("MEDIUM") // Default assumption, AI might refine it
                    .build();

            // Call AI for dynamic pricing
            PremiumPredictionResponseDTO aiResponse = aiPredictionClient.predictPremium(aiRequest);

            // Return hydrated DTO
            return InsurancePlanResponseDTO.builder()
                    .id(plan.getId())
                    .planName(plan.getPlanName())
                    .description(plan.getDescription())
                    .coverageType(plan.getCoverageType())
                    .originalPremiumAmount(plan.getPremiumAmount())
                    .premiumAmount(java.math.BigDecimal.valueOf(aiResponse.getDynamic_premium()))
                    .maxPayout(plan.getMaxPayout())
                    .billingCycle(plan.getBillingCycle())
                    .isActive(plan.getIsActive())
                    .pricingReasoning(aiResponse.getReasoning())
                    .build();
        }).collect(Collectors.toList());
    }

    public InsurancePlan getPlanById(Long planId) {
        return insurancePlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePlan", "id", planId));
    }

    @Transactional
    public PolicyResponseDTO purchasePolicy(PolicyRequestDTO dto) {
        Worker worker = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", dto.getWorkerId()));

        InsurancePlan plan = insurancePlanRepository.findById(dto.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("InsurancePlan", "id", dto.getPlanId()));

        if (!plan.getIsActive()) {
            throw new InvalidOperationException("This insurance plan is no longer active");
        }

        // Calculate policy dates based on billing cycle
        LocalDate startDate = LocalDate.now();
        LocalDate endDate = plan.getBillingCycle() == InsurancePlan.BillingCycle.WEEKLY
                ? startDate.plusWeeks(1)
                : startDate.plusMonths(1);

        Policy policy = Policy.builder()
                .worker(worker)
                .plan(plan)
                .startDate(startDate)
                .endDate(endDate)
                .premiumPaid(plan.getPremiumAmount())
                .build();

        Policy saved = policyRepository.save(policy);
        return toDTO(saved);
    }

    public PageResponse<PolicyResponseDTO> getWorkerPolicies(Long workerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Policy> policyPage = policyRepository.findByWorkerIdPaginated(workerId, pageable);
        
        List<PolicyResponseDTO> content = policyPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.<PolicyResponseDTO>builder()
                .content(content)
                .page(policyPage.getNumber())
                .size(policyPage.getSize())
                .totalElements(policyPage.getTotalElements())
                .totalPages(policyPage.getTotalPages())
                .last(policyPage.isLast())
                .first(policyPage.isFirst())
                .build();
    }

    @Transactional
    public PolicyResponseDTO cancelPolicy(Long policyId) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy", "id", policyId));

        if (policy.getStatus() != Policy.PolicyStatus.ACTIVE) {
            throw new InvalidOperationException("Only active policies can be cancelled. Current status: " + policy.getStatus());
        }

        policy.setStatus(Policy.PolicyStatus.CANCELLED);
        Policy saved = policyRepository.save(policy);
        return toDTO(saved);
    }

    private PolicyResponseDTO toDTO(Policy policy) {
        return PolicyResponseDTO.builder()
                .id(policy.getId())
                .workerId(policy.getWorker().getId())
                .workerName(policy.getWorker().getFullName())
                .planId(policy.getPlan().getId())
                .planName(policy.getPlan().getPlanName())
                .coverageType(policy.getPlan().getCoverageType().name())
                .startDate(policy.getStartDate())
                .endDate(policy.getEndDate())
                .status(policy.getStatus().name())
                .premiumPaid(policy.getPremiumPaid())
                .maxPayout(policy.getPlan().getMaxPayout())
                .createdAt(policy.getCreatedAt())
                .build();
    }
}
