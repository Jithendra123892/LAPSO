package com.example.demo.config;

import com.example.demo.service.UserService;
import com.example.demo.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;

/**
 * Simple Spring Security configuration that works with Vaadin
 * Avoids VaadinWebSecurity conflicts by using standard SecurityFilterChain
 */
@Configuration
@EnableWebSecurity  
public class VaadinSecurityConfiguration {

    private final UserService userService;
    private final CustomUserDetailsService customUserDetailsService;

    public VaadinSecurityConfiguration(UserService userService, CustomUserDetailsService customUserDetailsService) {
        this.userService = userService;
        this.customUserDetailsService = customUserDetailsService;
    }

    // Authentication beans are now handled by AuthenticationConfig to avoid conflicts

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Disable CSRF completely to avoid 403 errors
        http.csrf(csrf -> csrf.disable());
        
        // Disable X-Frame-Options to allow iframe/frame display
        http.headers(headers -> headers
            .frameOptions(frameOptions -> frameOptions.disable())
        );
        
        // Allow all access - no login required
        http.authorizeHttpRequests(authz -> authz
            .anyRequest().permitAll()
        );
        
        // No login required - direct access to dashboard
        
        return http.build();
    }
    
}