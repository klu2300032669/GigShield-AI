package com.gigshield.controller;

import com.gigshield.dto.*;
import com.gigshield.model.DeliveryStats;
import com.gigshield.service.DeliveryStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/delivery-stats")
@RequiredArgsConstructor
@Tag(name = "Delivery Stats", description = "Worker delivery statistics recording")
public class DeliveryStatsController {

    private final DeliveryStatsService deliveryStatsService;

    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryStats>> recordStats(@Valid @RequestBody DeliveryStatsDTO dto) {
        DeliveryStats stats = deliveryStatsService.recordStats(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Delivery stats recorded", stats));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<ApiResponse<List<DeliveryStats>>> getWorkerStats(@PathVariable Long workerId) {
        List<DeliveryStats> stats = deliveryStatsService.getWorkerStats(workerId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
