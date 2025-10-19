package com.example.demo.service;

import com.vaadin.flow.server.VaadinServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * Service to handle manual authentication within Vaadin context
 */
// @Service - Disabled for Clean UI
public class VaadinAuthenticationService {

    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserService userService;

    public boolean authenticateUser(String email, String password) {
        try {
            System.out.println("🔍 Attempting manual authentication for: " + email);
            
            // Create authentication token
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(email, password);
            
            System.out.println("🔑 Created authentication token for: " + email);
            
            // Authenticate
            Authentication authentication = authenticationManager.authenticate(authToken);
            System.out.println("✅ Authentication successful, principal: " + authentication.getPrincipal());
            
            // Set security context
            SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
            securityContext.setAuthentication(authentication);
            SecurityContextHolder.setContext(securityContext);
            
            System.out.println("🔒 Security context set for: " + email);
            
            // Store authentication in Vaadin session for better persistence
            try {
                com.vaadin.flow.server.VaadinSession.getCurrent().setAttribute("authenticated_user", email);
                com.vaadin.flow.server.VaadinSession.getCurrent().setAttribute("security_context", securityContext);
                System.out.println("📦 Security context stored in Vaadin session for: " + email);
                
                // Also try to store in HTTP session as backup
                HttpServletRequest request = VaadinServletRequest.getCurrent().getHttpServletRequest();
                HttpSession session = request.getSession(true);
                session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
                System.out.println("� Also stored in HTTP session for: " + email);
            } catch (Exception sessionEx) {
                System.err.println("⚠️ Could not store security context in session: " + sessionEx.getMessage());
            }
            
            // Update last login
            userService.updateLastLogin(email);
            
            System.out.println("✅ Manual authentication successful for: " + email);
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Manual authentication failed for " + email + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    public boolean registerUser(String email, String name, String password) {
        try {
            System.out.println("📝 Attempting registration for: " + email);
            userService.registerManualUser(email, name, password);
            System.out.println("✅ Registration successful for: " + email);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Registration failed for " + email + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
