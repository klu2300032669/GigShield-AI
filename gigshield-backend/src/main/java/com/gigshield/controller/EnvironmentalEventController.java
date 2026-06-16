package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.model.EnvironmentalEvent;
import com.gigshield.service.EnvironmentalEventService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@Tag(name = "Environmental Events", description = "Environmental event recording and querying")
public class EnvironmentalEventController {

    private final EnvironmentalEventService eventService;

    @PostMapping
    public ResponseEntity<ApiResponse<EnvironmentalEvent>> recordEvent(@Valid @RequestBody EnvironmentalEventDTO dto) {
        EnvironmentalEvent event = eventService.recordEvent(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Environmental event recorded", event));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<List<EnvironmentalEvent>>> getEventsByCity(@PathVariable String city) {
        List<EnvironmentalEvent> events = eventService.getEventsByCity(city);
        return ResponseEntity.ok(ApiResponse.success(events));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<EnvironmentalEvent>>> getRecentEvents() {
        List<EnvironmentalEvent> events = eventService.getRecentEvents();
        return ResponseEntity.ok(ApiResponse.success(events));
    }
}
