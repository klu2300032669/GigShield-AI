package com.gigshield.controller;

import com.gigshield.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Report generation (CSV, PDF) for claims and analytics data")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/claims/csv")
    @Operation(summary = "Download all claims as CSV")
    public ResponseEntity<byte[]> downloadClaimsCsv() {
        byte[] csvBytes = reportService.generateClaimsCsv();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("filename", "gigshield_claims_report.csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/claims/pdf")
    @Operation(summary = "Download all claims as PDF report")
    public ResponseEntity<byte[]> downloadClaimsPdf() {
        byte[] pdfBytes = reportService.generateClaimsPdf();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "gigshield_claims_report.pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
