package com.gigshield.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@SuppressWarnings("null")
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@gigshield.ai}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        // Always log to console as fallback for demo/dev
        log.info("========================================");
        log.info("  OTP for {}: {}", toEmail, otpCode);
        log.info("  (Valid for 5 minutes)");
        log.info("========================================");

        if (mailSender == null) {
            log.warn("JavaMailSender not configured — OTP printed to console only.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("GigShield AI <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("GigShield Security: Your OTP Code");
            message.setText("Your One-Time Password (OTP) for GigShield AI is:\n\n"
                    + otpCode + "\n\n"
                    + "This code will expire in 5 minutes. If you did not request this, please ignore this email.");

            mailSender.send(message);
            log.info("Successfully sent OTP email to {}", toEmail);
        } catch (Exception e) {
            log.warn("Email send failed (OTP is in console above): {}", e.getMessage());
        }
    }

    @Async
    public void sendNotificationEmail(String toEmail, String subject, String body) {
        if (mailSender == null) {
            log.info("Notification email for {}: {} - {}", toEmail, subject, body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("GigShield AI <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Successfully sent notification email to {}", toEmail);
        } catch (Exception e) {
            log.warn("Notification email send failed: {}", e.getMessage());
        }
    }

    /**
     * Sends a rich HTML-formatted email using inline styles (no template engine required).
     * Supports claim updates, weather alerts, and policy reminders.
     */
    @Async
    public void sendHtmlEmail(String toEmail, String subject, String heading, String bodyText, String ctaText, String ctaUrl) {
        if (mailSender == null) {
            log.info("HTML email for {}: {} - {}", toEmail, subject, bodyText);
            return;
        }

        try {
            String htmlContent = buildHtmlTemplate(heading, bodyText, ctaText, ctaUrl);

            jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper =
                    new org.springframework.mail.javamail.MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("GigShield AI <" + fromEmail + ">");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Successfully sent HTML email to {}", toEmail);
        } catch (Exception e) {
            log.warn("HTML email send failed: {}", e.getMessage());
        }
    }

    private String buildHtmlTemplate(String heading, String bodyText, String ctaText, String ctaUrl) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
                + "<body style='margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#0a0c10;color:#e1e4ea;'>"
                + "<div style='max-width:600px;margin:0 auto;padding:40px 20px;'>"
                + "<div style='background:linear-gradient(135deg,#141820,#1a1f2e);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px;'>"
                + "<div style='text-align:center;margin-bottom:24px;'>"
                + "<span style='font-size:32px;'>🛡️</span>"
                + "<h1 style='color:#34d399;font-size:20px;margin:8px 0 0;'>GigShield AI</h1>"
                + "</div>"
                + "<h2 style='color:#fff;font-size:22px;text-align:center;margin-bottom:16px;'>" + heading + "</h2>"
                + "<p style='color:#a0a8b8;font-size:15px;line-height:1.6;text-align:center;'>" + bodyText + "</p>"
                + (ctaText != null && ctaUrl != null
                    ? "<div style='text-align:center;margin-top:24px;'>"
                      + "<a href='" + ctaUrl + "' style='display:inline-block;background:linear-gradient(135deg,#34d399,#2dd4bf);color:#0a0c10;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;'>"
                      + ctaText + "</a></div>"
                    : "")
                + "<hr style='border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0 16px;'>"
                + "<p style='color:#5a6270;font-size:12px;text-align:center;'>GigShield AI — Protecting gig workers with AI-powered insurance</p>"
                + "</div></div></body></html>";
    }
}
