package com.example.demo.security;

import com.vaadin.flow.server.VaadinSession;
import com.vaadin.flow.component.UI;
import com.example.demo.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

/**
 * Manual authentication service for Vaadin with disabled form login
 * Handles authentication completely through manual session management
 */
// @Service - Disabled for Clean UI
public class VaadinCompatibleAuthService {

    @Autowired
    private CustomUserDetailsService customUserDetailsService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager; // Inject AuthenticationManager

    public boolean performAuthentication(String username, String password) {
        try {
            System.out.println("🔐 Starting manual authentication for: " + username);
            
            // Create authentication token
            UsernamePasswordAuthenticationToken authenticationToken = 
                new UsernamePasswordAuthenticationToken(username, password);
            
            // Authenticate using AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            
            // If authentication is successful, SecurityContextHolder is updated by Spring Security
            // We still need to update VaadinSession for Vaadin-specific components
            
            System.out.println("✅ Authentication successful for: " + username);
            
            // Also store in Vaadin session for Vaadin-specific components
            try {
                VaadinSession vaadinSession = VaadinSession.getCurrent();
                if (vaadinSession != null) {
                    // Link Vaadin session with HTTP session (if available)
                    // Spring Security will handle setting the SecurityContext in HttpSession
                    // We just ensure VaadinSession has access to the Authentication object
                    vaadinSession.setAttribute("authenticated_user", username);
                    vaadinSession.setAttribute("authentication", authentication);
                    vaadinSession.setAttribute("user_authenticated", Boolean.TRUE);
                    vaadinSession.setAttribute("userDetails", (UserDetails) authentication.getPrincipal());
                    
                    System.out.println("📦 Stored authentication in Vaadin session");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Could not set Vaadin session: " + e.getMessage());
                e.printStackTrace();
                // Don't fail the login if only Vaadin session setup fails
            }
            
            System.out.println("🎉 Complete manual authentication setup for: " + username);
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Manual authentication failed for " + username + ": " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
    
    public void logout() {
        try {
            SecurityContextHolder.clearContext();
            VaadinSession session = VaadinSession.getCurrent();
            if (session != null) {
                session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, null);
                session.setAttribute("SPRING_SECURITY_CONTEXT", null);
                session.setAttribute("authenticated_user", null);
                session.setAttribute("authentication", null);
                session.setAttribute("user_authenticated", null);
                session.setAttribute("userDetails", null);
            }
            System.out.println("✅ Manual logout successful");
        } catch (Exception e) {
            System.err.println("❌ Logout error: " + e.getMessage());
        }
    }
}
