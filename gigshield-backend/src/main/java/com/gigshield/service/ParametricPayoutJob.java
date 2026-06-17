package com.gigshield.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ParametricPayoutJob {

    private final ParametricPayoutService parametricPayoutService;

    // Run every hour. For testing, we can run it every 5 minutes: "0 0/5 * * * ?"
    // Here we run it every hour on the hour.
    @Scheduled(cron = "0 0 * * * ?")
    public void executeZeroTouchPayouts() {
        log.info("Scheduled trigger: Executing Zero-Touch Payouts");
        parametricPayoutService.processZeroTouchPayouts();
    }
}
