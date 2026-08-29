package com.gigshield.config;

import com.gigshield.model.Worker;
import com.gigshield.repository.WorkerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AdminDataLoader implements CommandLineRunner {

    private final WorkerRepository workerRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Read from environment variables (recommended for production)
        String adminEmail = System.getenv("GIGSHIELD_ADMIN_EMAIL");
        String adminPassword = System.getenv("GIGSHIELD_ADMIN_PASSWORD");
        String adminName = System.getenv("GIGSHIELD_ADMIN_NAME");

        // Fall back to default for development/demo
        if (adminEmail == null || adminEmail.isBlank()) {
            adminEmail = "saketh.surubhotla@gmail.com";
        }
        if (adminPassword == null || adminPassword.isBlank()) {
            adminPassword = "Admin@2024#Secure";
        }
        if (adminName == null || adminName.isBlank()) {
            adminName = "Saketh Surubhotla";
        }

        // Force reset EVERY worker's password to Password@123 to fix corrupted data.sql seeds
        String defaultWorkerPasswordHash = passwordEncoder.encode("Password@123");
        workerRepository.findAll().forEach(worker -> {
            if (worker.getRole() != Worker.Role.ADMIN) {
                worker.setPasswordHash(defaultWorkerPasswordHash);
                workerRepository.save(worker);
            }
        });
        log.info("✅ All standard worker passwords reset to 'Password@123'");

        // Check if admin user exists and ensure password is valid
        if (workerRepository.existsByEmail(adminEmail)) {
            final String emailForLog = adminEmail;
            final String finalAdminPassword = adminPassword;
            workerRepository.findByEmail(adminEmail).ifPresent(worker -> {
                worker.setRole(Worker.Role.ADMIN);
                // Force reset password hash to fix invalid seeds from data.sql
                worker.setPasswordHash(passwordEncoder.encode(finalAdminPassword));
                workerRepository.save(worker);
                log.info("✅ User {} promoted to ADMIN and password reset.", emailForLog);
            });
            return;
        }
        Worker admin = Worker.builder()
                .fullName(adminName)
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .phone("+91-0000000000")
                .city("Platform")
                .platformName("GigShield")
                .role(Worker.Role.ADMIN)
                .emailVerified(true)
                .isActive(true)
                .build();

        workerRepository.save(admin);

        log.info("═══════════════════════════════════════════════════");
        log.info("  🔐 INITIAL ADMIN ACCOUNT CREATED");
        log.info("  📧 Email:    {}", adminEmail);
        log.info("  🔑 Password: {}", adminPassword);
        log.info("  ⚠️  Change this password immediately!");
        log.info("  💡 Set GIGSHIELD_ADMIN_EMAIL and GIGSHIELD_ADMIN_PASSWORD");
        log.info("     environment variables to customize.");
        log.info("═══════════════════════════════════════════════════");
    }
}
