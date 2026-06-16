package com.gigshield.service;

import com.gigshield.dto.WorkerLoginDTO;
import com.gigshield.dto.WorkerRegistrationDTO;
import com.gigshield.dto.WorkerResponseDTO;
import com.gigshield.exception.AuthenticationFailedException;
import com.gigshield.exception.DuplicateResourceException;
import com.gigshield.exception.PasswordValidationException;
import com.gigshield.model.Worker;
import com.gigshield.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class WorkerServiceTest {

    @Mock private WorkerRepository workerRepository;
    @Mock private PolicyRepository policyRepository;
    @Mock private ClaimRepository claimRepository;
    @Mock private PayoutRepository payoutRepository;
    @Mock private DeliveryStatsRepository deliveryStatsRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private EnvironmentalEventRepository environmentalEventRepository;
    @Mock private BCryptPasswordEncoder passwordEncoder;

    @InjectMocks
    private WorkerService workerService;

    private WorkerRegistrationDTO validRegistration;
    private Worker savedWorker;

    @BeforeEach
    void setUp() {
        validRegistration = new WorkerRegistrationDTO();
        validRegistration.setFullName("John Doe");
        validRegistration.setEmail("john@example.com");
        validRegistration.setPassword("Test@1234");
        validRegistration.setPhone("9876543210");
        validRegistration.setCity("Mumbai");
        validRegistration.setPlatformName("Swiggy");

        savedWorker = Worker.builder()
                .id(1L)
                .fullName("John Doe")
                .email("john@example.com")
                .passwordHash("$2a$10$hashedpassword")
                .phone("9876543210")
                .city("Mumbai")
                .platformName("Swiggy")
                .role(Worker.Role.WORKER)
                .emailVerified(false)
                .isActive(true)
                .registrationDate(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("register() should create a worker successfully")
    void registerSuccess() {
        when(workerRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Test@1234")).thenReturn("$2a$10$hashedpassword");
        when(workerRepository.save(any(Worker.class))).thenReturn(savedWorker);

        WorkerResponseDTO result = workerService.register(validRegistration);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("john@example.com");
        assertThat(result.getFullName()).isEqualTo("John Doe");
        assertThat(result.getRole()).isEqualTo("WORKER");
        verify(workerRepository).save(any(Worker.class));
    }

    @Test
    @DisplayName("register() should throw DuplicateResourceException for existing email")
    void registerDuplicateEmail() {
        when(workerRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> workerService.register(validRegistration))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("register() should throw PasswordValidationException for weak password")
    void registerWeakPassword() {
        validRegistration.setPassword("weak");

        assertThatThrownBy(() -> workerService.register(validRegistration))
                .isInstanceOf(PasswordValidationException.class);
    }

    @Test
    @DisplayName("login() should return worker on valid credentials")
    void loginSuccess() {
        when(workerRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedWorker));
        when(passwordEncoder.matches("Test@1234", "$2a$10$hashedpassword")).thenReturn(true);

        WorkerLoginDTO loginDTO = new WorkerLoginDTO();
        loginDTO.setEmail("john@example.com");
        loginDTO.setPassword("Test@1234");

        WorkerResponseDTO result = workerService.login(loginDTO);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("login() should throw AuthenticationFailedException for wrong password")
    void loginWrongPassword() {
        when(workerRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedWorker));
        when(passwordEncoder.matches("wrong", "$2a$10$hashedpassword")).thenReturn(false);

        WorkerLoginDTO loginDTO = new WorkerLoginDTO();
        loginDTO.setEmail("john@example.com");
        loginDTO.setPassword("wrong");

        assertThatThrownBy(() -> workerService.login(loginDTO))
                .isInstanceOf(AuthenticationFailedException.class);
    }

    @Test
    @DisplayName("login() should throw AuthenticationFailedException for non-existent email")
    void loginNonExistentEmail() {
        when(workerRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        WorkerLoginDTO loginDTO = new WorkerLoginDTO();
        loginDTO.setEmail("unknown@example.com");
        loginDTO.setPassword("Test@1234");

        assertThatThrownBy(() -> workerService.login(loginDTO))
                .isInstanceOf(AuthenticationFailedException.class);
    }

    @Test
    @DisplayName("toggleWorkerStatus() should toggle active status")
    void toggleWorkerStatus() {
        savedWorker.setIsActive(true);
        when(workerRepository.findById(1L)).thenReturn(Optional.of(savedWorker));
        when(workerRepository.save(any(Worker.class))).thenReturn(savedWorker);

        WorkerResponseDTO result = workerService.toggleWorkerStatus(1L);

        assertThat(result).isNotNull();
        verify(workerRepository).save(any(Worker.class));
    }

    @Test
    @DisplayName("markEmailVerified() should set emailVerified to true")
    void markEmailVerified() {
        savedWorker.setEmailVerified(false);
        when(workerRepository.findByEmail("john@example.com")).thenReturn(Optional.of(savedWorker));
        when(workerRepository.save(any(Worker.class))).thenReturn(savedWorker);

        workerService.markEmailVerified("john@example.com");

        assertThat(savedWorker.getEmailVerified()).isTrue();
        verify(workerRepository).save(savedWorker);
    }
}
