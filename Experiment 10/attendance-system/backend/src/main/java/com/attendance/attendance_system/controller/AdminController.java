package com.attendance.attendance_system.controller;

import com.attendance.attendance_system.dto.TokenResponse;
import com.attendance.attendance_system.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor; // Use Lombok's RequiredArgsConstructor

@CrossOrigin(
        origins = "http://localhost:5173",
        methods = {RequestMethod.POST, RequestMethod.GET, RequestMethod.OPTIONS},
        allowedHeaders = {"Content-Type", "X-User-Id", "Authorization"}
)
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AttendanceService attendanceService;
    // Removed UserRepository and SessionRepository dependencies

    private static final String ADMIN = "admin";

    // Lombok handles the constructor for final fields:
    // public AdminController(AttendanceService attendanceService) { this.attendanceService = attendanceService; }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getActiveSessions() {
        // NOTE: The List<Map<String, Object>> import is missing in the file you provided,
        // but Spring will handle the return type if the method exists.
        List<Map<String, Object>> sessions = attendanceService.getActiveSessions();
        return ResponseEntity.ok(sessions);
    }

    @PostMapping("/generate-token")
    public ResponseEntity<TokenResponse> generateToken(@RequestParam String section, @RequestParam String sessionName) {
        String adminId = ADMIN;

        // ✅ CRITICAL FIX: The controller now only delegates the work to the service,
        // which contains the atomic MongoDB operation.
        TokenResponse response = attendanceService.generateToken(adminId, section, sessionName);

        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/generate-token", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}