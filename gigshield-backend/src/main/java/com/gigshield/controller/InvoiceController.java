package com.gigshield.controller;

import com.gigshield.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoice Generation", description = "Endpoints for downloading PDF invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping("/policy/{policyId}/download")
    @Operation(summary = "Download invoice for a policy premium")
    public ResponseEntity<byte[]> downloadPolicyInvoice(@PathVariable Long policyId) {
        byte[] pdfBytes = invoiceService.generateInvoice(policyId, "POLICY");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "invoice_policy_" + policyId + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
    
    @GetMapping("/claim/{claimId}/download")
    @Operation(summary = "Download settlement notice for a claim")
    public ResponseEntity<byte[]> downloadClaimInvoice(@PathVariable Long claimId) {
        byte[] pdfBytes = invoiceService.generateInvoice(claimId, "CLAIM");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "notice_claim_" + claimId + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
