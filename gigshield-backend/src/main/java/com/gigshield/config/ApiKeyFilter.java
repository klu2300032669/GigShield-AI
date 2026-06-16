package com.gigshield.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates X-API-Key header for external service endpoints (webhooks, partner
 * APIs).
 * Internal endpoints protected by JWT are not affected.
 */
@Component
@Slf4j
public class ApiKeyFilter extends OncePerRequestFilter {

    @Value("${gigshield.api-key:gigshield-default-api-key-2024}")
    private String validApiKey;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String apiKey = request.getHeader("X-API-Key");

        if (apiKey == null || !apiKey.equals(validApiKey)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Invalid or missing API key\",\"data\":null}");
            log.warn("API key validation failed for {} {}", request.getMethod(), request.getRequestURI());
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        // Only filter webhook and partner API endpoints
        return !path.startsWith("/api/v1/webhooks/incoming") &&
                !path.startsWith("/api/v1/partner/");
    }
}
