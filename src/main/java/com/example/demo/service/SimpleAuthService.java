package com.example.demo.service;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.server.VaadinSession;
import org.springframework.stereotype.Service;

@Service
public class SimpleAuthService {
    
    public boolean isAuthenticated() {
        try {
            VaadinSession session = VaadinSession.getCurrent();
            if (session == null) {
                return false;
            }
            
            Boolean authenticated = (Boolean) session.getAttribute("authenticated");
            String user = (String) session.getAttribute("user");
            
            return Boolean.TRUE.equals(authenticated) && user != null;
        } catch (Exception e) {
            return false;
        }
    }
    
    public String getCurrentUser() {
        try {
            VaadinSession session = VaadinSession.getCurrent();
            return session != null ? (String) session.getAttribute("user") : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    public void login(String email) {
        try {
            VaadinSession session = VaadinSession.getCurrent();
            if (session != null) {
                session.setAttribute("user", email);
                session.setAttribute("authenticated", true);
            }
        } catch (Exception e) {
            System.err.println("Error during login: " + e.getMessage());
        }
    }
    
    public void logout() {
        VaadinSession session = VaadinSession.getCurrent();
        if (session != null) {
            session.setAttribute("user", null);
            session.setAttribute("authenticated", false);
        }
        UI.getCurrent().navigate("login");
    }
    
    public boolean authenticate(String email, String password) {
        // Simple authentication - in production, use proper password hashing
        return email.contains("@") && password.length() >= 3;
    }
    
    /**
     * Initialize authentication service
     */
    public void initialize() {
        System.out.println("✅ Authentication service initialized");
    }
}