package com.gigshield.service;

import com.gigshield.model.Notification;
import com.gigshield.model.Worker;
import com.gigshield.repository.NotificationRepository;
import com.gigshield.repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WorkerRepository workerRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Notification sendNotification(Long workerId, String title, String message, Notification.NotificationType type) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found: " + workerId));

        Notification notification = Notification.builder()
                .worker(worker)
                .title(title)
                .message(message)
                .type(type)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Send real-time notification via WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + workerId, saved);
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to worker {}: {}", workerId, e.getMessage());
        }

        return saved;
    }

    public List<Notification> getWorkerNotifications(Long workerId) {
        return notificationRepository.findByWorkerIdOrderByCreatedAtDesc(workerId);
    }

    public List<Notification> getUnreadNotifications(Long workerId) {
        return notificationRepository.findByWorkerIdAndIsReadFalse(workerId);
    }

    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));

        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    public long getUnreadCount(Long workerId) {
        return notificationRepository.countByWorkerIdAndIsReadFalse(workerId);
    }
}
