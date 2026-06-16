package com.gigshield.repository;

import com.gigshield.model.EnvironmentalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnvironmentalEventRepository extends JpaRepository<EnvironmentalEvent, Long> {
    List<EnvironmentalEvent> findByCityOrderByEventTimestampDesc(String city);
    
    @Query("SELECT e FROM EnvironmentalEvent e WHERE e.eventTimestamp >= :since ORDER BY e.eventTimestamp DESC")
    List<EnvironmentalEvent> findRecentEvents(LocalDateTime since);
    
    List<EnvironmentalEvent> findByCityAndEventTimestampBetween(String city, LocalDateTime start, LocalDateTime end);
}
