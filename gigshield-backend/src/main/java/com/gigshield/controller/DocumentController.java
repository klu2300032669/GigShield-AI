package com.gigshield.controller;

import com.gigshield.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
@Tag(name = "Documents", description = "File and photo upload endpoints")
public class DocumentController {

    @PostMapping("/upload")
    @Operation(summary = "Upload a document or photo", description = "Mock endpoint that accepts a file and returns a dummy S3 URL")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "general") String type) {
        
        // Mocking file upload to a cloud storage like S3
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        String fileUrl = "https://cdn.gigshield.ai/" + type + "/" + fileName;

        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", Map.of(
                "fileName", file.getOriginalFilename(),
                "fileUrl", fileUrl,
                "fileType", file.getContentType(),
                "size", String.valueOf(file.getSize())
        )));
    }
}
