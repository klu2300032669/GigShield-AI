package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.model.Notification;
import com.gigshield.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Worker notification management")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<ApiResponse<List<Notification>>> getWorkerNotifications(@PathVariable Long workerId) {
        List<Notification> notifications = notificationService.getWorkerNotifications(workerId);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markAsRead(@PathVariable Long id) {
        Notification notification = notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", notification));
    }

    @GetMapping("/worker/{workerId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long workerId) {
        long count = notificationService.getUnreadCount(workerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
