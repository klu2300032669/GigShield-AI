package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.model.AuditLog;
import com.gigshield.model.EnvironmentalEvent;
import com.gigshield.model.Notification;
import com.gigshield.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Platform administration: workers, claims, payouts, events management")
public class AdminController {

    private final WorkerService workerService;
    private final ClaimService claimService;
    private final PayoutService payoutService;
    private final EnvironmentalEventService environmentalEventService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    // ---- Platform Stats ----
    @GetMapping("/stats")
    @Operation(summary = "Get platform-wide statistics")
    public ResponseEntity<ApiResponse<AdminStatsDTO>> getPlatformStats() {
        AdminStatsDTO stats = workerService.getPlatformStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ---- Worker Management ----
    @GetMapping("/workers")
    @Operation(summary = "Get all registered workers")
    public ResponseEntity<ApiResponse<PageResponse<WorkerResponseDTO>>> getAllWorkers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<WorkerResponseDTO> workers = workerService.getAllWorkers(page, size);
        return ResponseEntity.ok(ApiResponse.success(workers));
    }

    @PutMapping("/workers/{id}/toggle-status")
    @Operation(summary = "Toggle worker active/inactive status")
    public ResponseEntity<ApiResponse<WorkerResponseDTO>> toggleWorkerStatus(@PathVariable Long id) {
        WorkerResponseDTO worker = workerService.toggleWorkerStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Worker status toggled", worker));
    }

    @PutMapping("/workers/{id}/promote")
    @Operation(summary = "Toggle worker role between WORKER and ADMIN")
    public ResponseEntity<ApiResponse<WorkerResponseDTO>> promoteWorkerStatus(@PathVariable Long id) {
        WorkerResponseDTO worker = workerService.promoteToAdmin(id);
        String action = worker.getRole().equals("ADMIN") ? "promoted to Admin" : "demoted to Worker";
        return ResponseEntity.ok(ApiResponse.success("Worker " + action, worker));
    }

    @DeleteMapping("/workers/{id}")
    @Operation(summary = "Delete a worker and all their associated data")
    public ResponseEntity<ApiResponse<String>> deleteWorker(@PathVariable Long id) {
        workerService.deleteWorker(id);
        return ResponseEntity.ok(ApiResponse.success("Worker successfully deleted"));
    }

    // ---- Claims Management ----
    @GetMapping("/claims")
    @Operation(summary = "Get all claims across all workers")
    public ResponseEntity<ApiResponse<PageResponse<ClaimResponseDTO>>> getAllClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ClaimResponseDTO> claims = claimService.getAllClaims(page, size);
        return ResponseEntity.ok(ApiResponse.success(claims));
    }

    @PutMapping("/claims/{id}/approve")
    @Operation(summary = "Approve a pending claim and initiate payout")
    public ResponseEntity<ApiResponse<ClaimResponseDTO>> approveClaim(@PathVariable Long id) {
        ClaimResponseDTO claim = claimService.approveClaim(id);
        return ResponseEntity.ok(ApiResponse.success("Claim approved", claim));
    }

    @PutMapping("/claims/{id}/reject")
    @Operation(summary = "Reject a pending claim")
    public ResponseEntity<ApiResponse<ClaimResponseDTO>> rejectClaim(@PathVariable Long id) {
        ClaimResponseDTO claim = claimService.rejectClaim(id);
        return ResponseEntity.ok(ApiResponse.success("Claim rejected", claim));
    }

    @DeleteMapping("/claims/{id}")
    @Operation(summary = "Delete a claim permanently")
    public ResponseEntity<ApiResponse<String>> deleteClaim(@PathVariable Long id) {
        claimService.deleteClaim(id);
        return ResponseEntity.ok(ApiResponse.success("Claim successfully deleted"));
    }

    // ---- Payout Management ----
    @GetMapping("/payouts")
    @Operation(summary = "Get all payouts")
    public ResponseEntity<ApiResponse<PageResponse<PayoutResponseDTO>>> getAllPayouts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<PayoutResponseDTO> payouts = payoutService.getAllPayouts(page, size);
        return ResponseEntity.ok(ApiResponse.success(payouts));
    }

    @PutMapping("/payouts/{id}/complete")
    @Operation(summary = "Mark a payout as completed with transaction reference")
    public ResponseEntity<ApiResponse<PayoutResponseDTO>> completePayout(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        String txRef = body.getOrDefault("transactionRef", "TXN-" + System.currentTimeMillis());
        PayoutResponseDTO payout = payoutService.completePayout(id, txRef);
        return ResponseEntity.ok(ApiResponse.success("Payout completed", payout));
    }

    // ---- Events Management ----
    @GetMapping("/events")
    @Operation(summary = "Get recent environmental events")
    public ResponseEntity<ApiResponse<List<EnvironmentalEvent>>> getAllEvents() {
        List<EnvironmentalEvent> events = environmentalEventService.getRecentEvents();
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    // ---- Audit Log Viewer ----
    @GetMapping("/audit-logs")
    @Operation(summary = "View admin audit logs with pagination")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<AuditLog> logs = auditService.getAuditLogs(page, size);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    // ---- Analytics Chart Data ----
    @GetMapping("/analytics/chart-data")
    @Operation(summary = "Get chart data for admin analytics dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChartData() {
        AdminStatsDTO stats = workerService.getPlatformStats();
        Map<String, Object> chartData = Map.of(
                "claimsByStatus", Map.of(
                        "pending", stats.getPendingClaims(),
                        "approved", stats.getApprovedClaims(),
                        "rejected", stats.getRejectedClaims()
                ),
                "financials", Map.of(
                        "totalRevenue", stats.getTotalRevenue(),
                        "totalPayouts", stats.getTotalPayoutAmount()
                ),
                "overview", Map.of(
                        "totalWorkers", stats.getTotalWorkers(),
                        "activeWorkers", stats.getActiveWorkers(),
                        "totalPolicies", stats.getTotalPolicies(),
                        "activePolicies", stats.getActivePolicies(),
                        "totalEvents", stats.getTotalEvents()
                )
        );
        return ResponseEntity.ok(ApiResponse.success(chartData));
    }

    // ---- Bulk Operations ----
    @PutMapping("/claims/bulk-approve")
    @Operation(summary = "Bulk approve multiple pending claims", description = "Accepts a list of claim IDs to approve in batch")
    public ResponseEntity<ApiResponse<List<ClaimResponseDTO>>> bulkApproveClaims(@RequestBody List<Long> claimIds) {
        List<ClaimResponseDTO> results = claimService.bulkApproveClaims(claimIds);
        return ResponseEntity.ok(ApiResponse.success(results.size() + " claims approved", results));
    }

    @PutMapping("/claims/bulk-reject")
    @Operation(summary = "Bulk reject multiple pending claims", description = "Accepts a list of claim IDs to reject in batch")
    public ResponseEntity<ApiResponse<List<ClaimResponseDTO>>> bulkRejectClaims(@RequestBody List<Long> claimIds) {
        List<ClaimResponseDTO> results = claimService.bulkRejectClaims(claimIds);
        return ResponseEntity.ok(ApiResponse.success(results.size() + " claims rejected", results));
    }

    // ---- Admin Send Notification ----
    @PostMapping("/notifications/send")
    @Operation(summary = "Send a custom notification to a specific worker")
    public ResponseEntity<ApiResponse<String>> sendNotification(@RequestBody Map<String, Object> body) {
        Long workerId = Long.valueOf(body.get("workerId").toString());
        String title = body.getOrDefault("title", "Admin Notification").toString();
        String message = body.getOrDefault("message", "").toString();
        notificationService.sendNotification(workerId, title, message, Notification.NotificationType.SYSTEM);
        return ResponseEntity.ok(ApiResponse.success("Notification sent to worker #" + workerId));
    }

    // ---- Admin Broadcast Notification ----
    @PostMapping("/notifications/broadcast")
    @Operation(summary = "Broadcast a notification to all active workers")
    public ResponseEntity<ApiResponse<String>> broadcastNotification(@RequestBody Map<String, String> body) {
        String title = body.getOrDefault("title", "Platform Announcement");
        String message = body.getOrDefault("message", "");
        List<WorkerResponseDTO> allWorkers = workerService.getAllWorkers(0, 9999).getContent();
        int sent = 0;
        for (WorkerResponseDTO w : allWorkers) {
            try {
                notificationService.sendNotification(w.getId(), title, message, Notification.NotificationType.SYSTEM);
                sent++;
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(ApiResponse.success("Notification broadcast to " + sent + " workers"));
    }

}
