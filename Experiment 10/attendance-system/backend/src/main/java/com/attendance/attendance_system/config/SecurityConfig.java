package com.attendance.attendance_system.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
// Renaming to SecurityConfig to reflect the file structure commonly used
public class SecurityConfig {

    /**
     * Configures the security filter chain, enabling custom CORS configuration.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // FIX: Use the custom CorsConfigurationSource bean to explicitly allow 5173
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable CSRF protection (necessary for API development)
                .csrf(csrf -> csrf.disable())

                // Configure authorization rules
                .authorizeHttpRequests(authorize -> authorize
                        // Allow all API endpoints that we are currently working on
                        .requestMatchers("/api/**").permitAll()

                        // All other requests require authentication
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    /**
     * Defines the explicit CORS policy for the application.
     * This ensures the browser's preflight OPTIONS requests are accepted from the frontend.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. Explicitly allow the origin of your frontend
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));

        // 2. Allow necessary HTTP methods (POST for token generation/check-in, OPTIONS for preflight)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "OPTIONS"));

        // 3. Allow all headers, including custom ones like "X-User-Id"
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // 4. Important: allow credentials (good practice for session/cookie usage)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply this configuration to all API paths
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
