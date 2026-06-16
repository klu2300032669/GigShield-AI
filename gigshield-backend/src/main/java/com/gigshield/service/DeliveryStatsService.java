package com.gigshield.service;

import com.gigshield.dto.DeliveryStatsDTO;
import com.gigshield.model.*;
import com.gigshield.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DeliveryStatsService {

    private final DeliveryStatsRepository deliveryStatsRepository;
    private final WorkerRepository workerRepository;
    private final EnvironmentalEventRepository eventRepository;

    @Transactional
    public DeliveryStats recordStats(DeliveryStatsDTO dto) {
        Worker worker = workerRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new RuntimeException("Worker not found: " + dto.getWorkerId()));

        EnvironmentalEvent event = null;
        if (dto.getEventId() != null) {
            event = eventRepository.findById(dto.getEventId())
                    .orElseThrow(() -> new RuntimeException("Event not found: " + dto.getEventId()));
        }

        DeliveryStats stats = DeliveryStats.builder()
                .worker(worker)
                .date(dto.getDate())
                .expectedDeliveries(dto.getExpectedDeliveries())
                .completedDeliveries(dto.getCompletedDeliveries())
                .estimatedIncomeLoss(dto.getEstimatedIncomeLoss())
                .event(event)
                .build();

        return deliveryStatsRepository.save(stats);
    }

    public List<DeliveryStats> getWorkerStats(Long workerId) {
        return deliveryStatsRepository.findByWorkerId(workerId);
    }

    public List<DeliveryStats> getWorkerStatsByDateRange(Long workerId, LocalDate start, LocalDate end) {
        return deliveryStatsRepository.findByWorkerIdAndDateBetween(workerId, start, end);
    }
}
