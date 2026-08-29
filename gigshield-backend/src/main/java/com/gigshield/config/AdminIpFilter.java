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
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * IP whitelisting filter for admin endpoints.
 * Only requests from whitelisted IPs can access /api/v1/admin/** endpoints.
 */
@Component
@Slf4j
public class AdminIpFilter extends OncePerRequestFilter {

    private final Set<String> whitelistedIps;
    private final boolean enabled;

    public AdminIpFilter(
            @Value("${gigshield.admin.ip-whitelist:}") String ipWhitelist) {
        if (ipWhitelist == null || ipWhitelist.isBlank()) {
            // Empty whitelist = disabled (rely on JWT role-based auth instead)
            this.whitelistedIps = Set.of();
            this.enabled = false;
            log.info("Admin IP filter DISABLED — relying on JWT role-based security");
        } else {
            this.whitelistedIps = Arrays.stream(ipWhitelist.split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
            this.enabled = true;
            log.info("Admin IP whitelist configured: {}", this.whitelistedIps);
        }
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        if (!whitelistedIps.contains(clientIp)) {
            log.warn("Admin access denied for IP: {} on {}", clientIp, request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Access denied. Your IP is not whitelisted for admin endpoints.\",\"data\":null}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // Only filter admin endpoints
        return !request.getRequestURI().startsWith("/api/v1/admin");
    }
}
