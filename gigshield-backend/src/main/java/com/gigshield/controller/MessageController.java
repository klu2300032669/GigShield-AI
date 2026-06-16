package com.gigshield.controller;

import com.gigshield.dto.ApiResponse;
import com.gigshield.model.Message;
import com.gigshield.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@Tag(name = "Messaging", description = "In-app messaging system between workers and admin")
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    @Operation(summary = "Send a message to another user")
    public ResponseEntity<ApiResponse<Message>> sendMessage(@RequestBody Map<String, Object> body) {
        Long senderId = Long.valueOf(body.get("senderId").toString());
        Long receiverId = Long.valueOf(body.get("receiverId").toString());
        String subject = body.getOrDefault("subject", "No Subject").toString();
        String content = body.get("content").toString();

        Message message = messageService.sendMessage(senderId, receiverId, subject, content);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", message));
    }

    @GetMapping("/{workerId}")
    @Operation(summary = "Get all messages for a worker (inbox + sent)")
    public ResponseEntity<ApiResponse<List<Message>>> getMessages(@PathVariable Long workerId) {
        List<Message> messages = messageService.getMessages(workerId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/{workerId}/inbox")
    @Operation(summary = "Get inbox messages for a worker")
    public ResponseEntity<ApiResponse<List<Message>>> getInbox(@PathVariable Long workerId) {
        List<Message> messages = messageService.getInbox(workerId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a message as read")
    public ResponseEntity<ApiResponse<Message>> markAsRead(@PathVariable Long id) {
        Message message = messageService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", message));
    }

    @GetMapping("/{workerId}/unread-count")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long workerId) {
        long count = messageService.getUnreadCount(workerId);
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
