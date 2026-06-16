package com.gigshield.service;

import com.gigshield.dto.EnvironmentalEventDTO;
import com.gigshield.exception.ResourceNotFoundException;
import com.gigshield.model.EnvironmentalEvent;
import com.gigshield.repository.EnvironmentalEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class EnvironmentalEventService {

    private final EnvironmentalEventRepository eventRepository;

    @Transactional
    public EnvironmentalEvent recordEvent(EnvironmentalEventDTO dto) {
        EnvironmentalEvent event = EnvironmentalEvent.builder()
                .city(dto.getCity())
                .eventType(EnvironmentalEvent.EventType.valueOf(dto.getEventType()))
                .rainfallMm(dto.getRainfallMm())
                .temperatureC(dto.getTemperatureC())
                .aqi(dto.getAqi())
                .severity(EnvironmentalEvent.Severity.valueOf(dto.getSeverity()))
                .eventTimestamp(dto.getEventTimestamp() != null ? dto.getEventTimestamp() : LocalDateTime.now())
                .sourceApi(dto.getSourceApi())
                .build();

        return eventRepository.save(event);
    }

    public List<EnvironmentalEvent> getEventsByCity(String city) {
        return eventRepository.findByCityOrderByEventTimestampDesc(city);
    }

    public List<EnvironmentalEvent> getRecentEvents() {
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        return eventRepository.findRecentEvents(since);
    }

    public EnvironmentalEvent getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EnvironmentalEvent", "id", id));
    }
}
