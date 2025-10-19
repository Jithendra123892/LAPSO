package com.example.demo.config;

import com.vaadin.flow.server.VaadinSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Custom authentication success handler for manual login
 */
@Component
public class ManualAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        System.out.println("🎉 Manual authentication success handler triggered for: " + authentication.getName());
        
        // Store authentication info in Vaadin session
        try {
            VaadinSession vaadinSession = VaadinSession.getCurrent();
            if (vaadinSession != null) {
                vaadinSession.setAttribute("authenticated_user", authentication.getName());
                vaadinSession.setAttribute("authentication", authentication);
                System.out.println("✅ Stored authentication in Vaadin session");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not store in Vaadin session: " + e.getMessage());
        }
        
        // Redirect to dashboard
        response.sendRedirect("/dashboard");
    }
}
