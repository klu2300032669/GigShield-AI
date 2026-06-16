package com.gigshield.service;

import com.gigshield.model.AuditLog;
import com.gigshield.repository.AuditLogRepository;
import com.gigshield.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Logs an admin action asynchronously so it doesn't block the main request.
     */
    @Async
    public void logAction(String action, String entityType, Long entityId,
                          String performedBy, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedBy(performedBy)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Audit: {} on {}#{} by {}", action, entityType, entityId, performedBy);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }

    public PageResponse<AuditLog> getAuditLogs(int page, int size) {
        Page<AuditLog> logPage = auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
        return PageResponse.<AuditLog>builder()
                .content(logPage.getContent())
                .page(logPage.getNumber())
                .size(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .last(logPage.isLast())
                .first(logPage.isFirst())
                .build();
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream().limit(100).collect(Collectors.toList());
    }
}
