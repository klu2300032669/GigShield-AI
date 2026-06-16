package com.gigshield.service;

import com.gigshield.exception.ResourceNotFoundException;
import com.gigshield.model.Message;
import com.gigshield.model.Worker;
import com.gigshield.repository.MessageRepository;
import com.gigshield.repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class MessageService {

    private final MessageRepository messageRepository;
    private final WorkerRepository workerRepository;

    @Transactional
    public Message sendMessage(Long senderId, Long receiverId, String subject, String content) {
        Worker sender = workerRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", senderId));
        Worker receiver = workerRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", receiverId));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .subject(subject)
                .content(content)
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getMessages(Long workerId) {
        return messageRepository.findAllByWorkerId(workerId);
    }

    public List<Message> getInbox(Long workerId) {
        return messageRepository.findByReceiverId(workerId);
    }

    public List<Message> getSent(Long workerId) {
        return messageRepository.findBySenderId(workerId);
    }

    @Transactional
    public Message markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));
        message.setIsRead(true);
        return messageRepository.save(message);
    }

    public long getUnreadCount(Long workerId) {
        return messageRepository.countByReceiverIdAndIsReadFalse(workerId);
    }
}
