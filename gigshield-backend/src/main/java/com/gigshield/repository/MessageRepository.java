package com.gigshield.repository;

import com.gigshield.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver " +
           "WHERE m.receiver.id = :workerId ORDER BY m.createdAt DESC")
    List<Message> findByReceiverId(Long workerId);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver " +
           "WHERE m.sender.id = :workerId ORDER BY m.createdAt DESC")
    List<Message> findBySenderId(Long workerId);

    @Query("SELECT m FROM Message m JOIN FETCH m.sender JOIN FETCH m.receiver " +
           "WHERE (m.sender.id = :workerId OR m.receiver.id = :workerId) ORDER BY m.createdAt DESC")
    List<Message> findAllByWorkerId(Long workerId);

    long countByReceiverIdAndIsReadFalse(Long receiverId);
}
