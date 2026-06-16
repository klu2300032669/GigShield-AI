package com.gigshield.repository;

import com.gigshield.model.Worker;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class WorkerRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private WorkerRepository workerRepository;

    private Worker createWorker(String email, Worker.Role role) {
        Worker worker = Worker.builder()
                .fullName("Test Worker")
                .email(email)
                .passwordHash("$2a$10$hashedPassword")
                .phone("9876543210")
                .city("Mumbai")
                .platformName("Swiggy")
                .role(role)
                .emailVerified(false)
                .isActive(true)
                .deleted(false)
                .build();
        return entityManager.persistAndFlush(worker);
    }

    @Test
    @DisplayName("findByEmail() should return worker for existing email")
    void findByEmailExists() {
        createWorker("test@example.com", Worker.Role.WORKER);

        Optional<Worker> found = workerRepository.findByEmail("test@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    @DisplayName("findByEmail() should return empty for non-existing email")
    void findByEmailNotExists() {
        Optional<Worker> found = workerRepository.findByEmail("nonexistent@example.com");
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail() should return true for existing email")
    void existsByEmailTrue() {
        createWorker("exists@example.com", Worker.Role.WORKER);
        assertThat(workerRepository.existsByEmail("exists@example.com")).isTrue();
    }

    @Test
    @DisplayName("existsByEmail() should return false for non-existing email")
    void existsByEmailFalse() {
        assertThat(workerRepository.existsByEmail("nope@example.com")).isFalse();
    }

    @Test
    @DisplayName("countByRole() should count workers by role correctly")
    void countByRole() {
        createWorker("admin1@example.com", Worker.Role.ADMIN);
        createWorker("admin2@example.com", Worker.Role.ADMIN);
        createWorker("worker1@example.com", Worker.Role.WORKER);

        assertThat(workerRepository.countByRole(Worker.Role.ADMIN)).isEqualTo(2);
        assertThat(workerRepository.countByRole(Worker.Role.WORKER)).isEqualTo(1);
    }

    @Test
    @DisplayName("Soft-deleted workers should not appear in findAll()")
    void softDeleteFiltering() {
        Worker worker = createWorker("deleted@example.com", Worker.Role.WORKER);
        worker.setDeleted(true);
        entityManager.persistAndFlush(worker);

        Optional<Worker> found = workerRepository.findByEmail("deleted@example.com");
        assertThat(found).isEmpty();
    }
}
