package com.gigshield.service;

import com.gigshield.model.Claim;
import com.gigshield.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ClaimRepository claimRepository;

    /**
     * Generates a CSV report of all claims.
     */
    public byte[] generateClaimsCsv() {
        List<Claim> claims = claimRepository.findAllWithDetails();
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("Claim ID,Worker Name,Plan Name,Event Type,City,Risk Score,")
          .append("Estimated Loss,Claim Amount,Status,Fraud Check,Triggered At,Resolved At\n");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (Claim c : claims) {
            sb.append(c.getId()).append(",");
            sb.append(escCsv(c.getPolicy().getWorker().getFullName())).append(",");
            sb.append(escCsv(c.getPolicy().getPlan().getPlanName())).append(",");
            sb.append(c.getEvent().getEventType()).append(",");
            sb.append(escCsv(c.getEvent().getCity())).append(",");
            sb.append(c.getRiskScore()).append(",");
            sb.append(c.getEstimatedLoss()).append(",");
            sb.append(c.getClaimAmount()).append(",");
            sb.append(c.getStatus()).append(",");
            sb.append(c.getFraudCheckPassed() != null && c.getFraudCheckPassed() ? "PASS" : "FAIL").append(",");
            sb.append(c.getTriggeredAt() != null ? c.getTriggeredAt().format(dtf) : "").append(",");
            sb.append(c.getResolvedAt() != null ? c.getResolvedAt().format(dtf) : "").append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generates a PDF report of all claims (skeleton with structured text).
     */
    public byte[] generateClaimsPdf() {
        List<Claim> claims = claimRepository.findAllWithDetails();

        StringBuilder content = new StringBuilder();
        content.append("%PDF-1.4\n")
               .append("%GigShield AI - Claims Report\n")
               .append("Generated: ").append(java.time.LocalDateTime.now()).append("\n\n")
               .append("=== CLAIMS REPORT ===\n\n")
               .append(String.format("%-6s %-20s %-18s %-15s %-10s %-12s %-10s%n",
                       "ID", "Worker", "Plan", "Event", "Risk", "Amount", "Status"))
               .append("─".repeat(95)).append("\n");

        for (Claim c : claims) {
            content.append(String.format("%-6d %-20s %-18s %-15s %-10s %-12s %-10s%n",
                    c.getId(),
                    truncate(c.getPolicy().getWorker().getFullName(), 19),
                    truncate(c.getPolicy().getPlan().getPlanName(), 17),
                    c.getEvent().getEventType(),
                    c.getRiskScore(),
                    "₹" + c.getClaimAmount(),
                    c.getStatus()));
        }

        content.append("\n─".repeat(95)).append("\n")
               .append("Total Claims: ").append(claims.size()).append("\n")
               .append("%%EOF\n");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            out.write(content.toString().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to generate claims PDF", e);
        }
        return out.toByteArray();
    }

    private String escCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() > maxLen ? s.substring(0, maxLen - 1) + "…" : s;
    }
}
