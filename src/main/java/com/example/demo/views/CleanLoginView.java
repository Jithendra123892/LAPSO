package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.notification.NotificationVariant;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import org.springframework.beans.factory.annotation.Autowired;

@Route("login")
@PageTitle("Login - LAPSO Professional Security")
@AnonymousAllowed
public class CleanLoginView extends VerticalLayout {

    @Autowired
    private SimpleAuthService authService;

    private EmailField emailField;
    private PasswordField passwordField;

    public CleanLoginView(SimpleAuthService authService) {
        this.authService = authService;
        
        // Always show login interface - don't redirect if already authenticated
        // This prevents redirect loops
        createCleanLoginInterface();
    }

    private void createCleanLoginInterface() {
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        setAlignItems(FlexComponent.Alignment.CENTER);
        setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);
        
        // Modern gradient background
        getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("font-family", "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
            .set("min-height", "100vh");

        // Login card
        VerticalLayout loginCard = new VerticalLayout();
        loginCard.setPadding(true);
        loginCard.setSpacing(true);
        loginCard.setAlignItems(FlexComponent.Alignment.CENTER);
        loginCard.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "1.5rem")
            .set("box-shadow", "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)")
            .set("padding", "3rem")
            .set("max-width", "400px")
            .set("width", "100%")
            .set("margin", "2rem");

        // Logo and branding
        createBrandingSection(loginCard);
        
        // Login form
        createLoginForm(loginCard);
        
        // Features preview
        createFeaturesPreview(loginCard);
        
        add(loginCard);
    }

    private void createBrandingSection(VerticalLayout loginCard) {
        // Logo
        Span logo = new Span("🛡️");
        logo.getStyle()
            .set("font-size", "4rem")
            .set("margin-bottom", "1rem");

        // Title
        H1 title = new H1("LAPSO");
        title.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "2rem")
            .set("font-weight", "800")
            .set("margin", "0 0 0.25rem 0")
            .set("text-align", "center");

        // Subtitle
        Paragraph subtitle = new Paragraph("Free & Open Source Laptop Tracking");
        subtitle.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "1rem")
            .set("margin", "0 0 0.5rem 0")
            .set("text-align", "center");
            
        // Free badge
        Span freeBadge = new Span("🆓 Completely Free");
        freeBadge.getStyle()
            .set("background", "#10b981")
            .set("color", "#ffffff")
            .set("padding", "0.25rem 0.75rem")
            .set("border-radius", "1rem")
            .set("font-size", "0.75rem")
            .set("font-weight", "600")
            .set("margin", "0 0 2rem 0");

        loginCard.add(logo, title, subtitle, freeBadge);
    }

    private void createLoginForm(VerticalLayout loginCard) {
        // Form title
        H2 formTitle = new H2("Welcome Back");
        formTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "700")
            .set("margin", "0 0 1.5rem 0")
            .set("text-align", "center");

        // Email field
        emailField = new EmailField("Email Address");
        emailField.setWidthFull();
        emailField.setPrefixComponent(VaadinIcon.USER.create());
        emailField.getStyle()
            .set("margin-bottom", "1rem");
        emailField.setValue("demo@lapso.in"); // Pre-fill for demo

        // Password field
        passwordField = new PasswordField("Password");
        passwordField.setWidthFull();
        passwordField.setPrefixComponent(VaadinIcon.LOCK.create());
        passwordField.getStyle()
            .set("margin-bottom", "1.5rem");
        passwordField.setValue("demo123"); // Pre-fill for demo
        
        // Add Enter key support - simplified
        passwordField.addKeyDownListener(com.vaadin.flow.component.Key.ENTER, e -> handleLogin());
        emailField.addKeyDownListener(com.vaadin.flow.component.Key.ENTER, e -> handleLogin());

        // Login button
        Button loginButton = new Button("Sign In", VaadinIcon.SIGN_IN.create());
        loginButton.setWidthFull();
        loginButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_LARGE);
        loginButton.getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("border", "none")
            .set("border-radius", "0.75rem")
            .set("font-weight", "600")
            .set("margin-bottom", "1rem");

        loginButton.addClickListener(e -> handleLogin());

        // Demo info
        Div demoInfo = new Div();
        demoInfo.getStyle()
            .set("background", "#f0f9ff")
            .set("border", "1px solid #0ea5e9")
            .set("border-radius", "0.5rem")
            .set("padding", "0.75rem")
            .set("margin", "1rem 0")
            .set("text-align", "center");

        Paragraph demoText = new Paragraph("💡 Demo credentials are pre-filled. Just click 'Sign In'!");
        demoText.getStyle()
            .set("color", "#0369a1")
            .set("font-size", "0.875rem")
            .set("margin", "0")
            .set("font-weight", "500");

        demoInfo.add(demoText);

        // Quick login options
        HorizontalLayout quickLogin = new HorizontalLayout();
        quickLogin.setWidthFull();
        quickLogin.setSpacing(true);
        quickLogin.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);

        Button guestBtn = new Button("Guest Access", VaadinIcon.USER_CHECK.create());
        guestBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        guestBtn.addClickListener(e -> {
            authService.login("guest@demo.com");
            UI.getCurrent().navigate("dashboard");
        });

        quickLogin.add(guestBtn);

        loginCard.add(formTitle, emailField, passwordField, demoInfo, loginButton, quickLogin);
    }

    private void createFeaturesPreview(VerticalLayout loginCard) {
        // Divider
        Hr divider = new Hr();
        divider.getStyle()
            .set("margin", "2rem 0 1.5rem 0")
            .set("border", "none")
            .set("border-top", "1px solid #e5e7eb");

        // Features title
        H3 featuresTitle = new H3("Why Choose LAPSO?");
        featuresTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.125rem")
            .set("font-weight", "600")
            .set("margin", "0 0 1rem 0")
            .set("text-align", "center");

        // Features list
        VerticalLayout features = new VerticalLayout();
        features.setPadding(false);
        features.setSpacing(true);

        features.add(
            createFeatureItem("🆓", "Completely Free", "No costs, no subscriptions"),
            createFeatureItem("🔓", "Open Source", "Transparent, modifiable code"),
            createFeatureItem("📍", "Basic Tracking", "Simple location monitoring"),
            createFeatureItem("🏠", "Self-Hosted", "Your data stays with you")
        );

        loginCard.add(divider, featuresTitle, features);
    }

    private Component createFeatureItem(String icon, String title, String description) {
        HorizontalLayout feature = new HorizontalLayout();
        feature.setAlignItems(FlexComponent.Alignment.CENTER);
        feature.setSpacing(true);
        feature.getStyle()
            .set("padding", "0.5rem 0");

        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "1.5rem")
            .set("min-width", "2rem");

        VerticalLayout content = new VerticalLayout();
        content.setPadding(false);
        content.setSpacing(false);

        Span titleSpan = new Span(title);
        titleSpan.getStyle()
            .set("color", "#1f2937")
            .set("font-weight", "600")
            .set("font-size", "0.875rem");

        Span descSpan = new Span(description);
        descSpan.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.75rem");

        content.add(titleSpan, descSpan);
        feature.add(iconSpan, content);
        return feature;
    }

    private void handleLogin() {
        String email = emailField.getValue();
        String password = passwordField.getValue();

        if (email.isEmpty() || password.isEmpty()) {
            Notification.show("Please fill in all fields", 3000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }

        try {
            if (authService.authenticate(email, password)) {
                authService.login(email);
                
                Notification.show("🎉 Welcome to LAPSO!", 2000, Notification.Position.TOP_CENTER)
                    .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
                
                // Navigate to dashboard directly
                UI.getCurrent().navigate("dashboard");
            } else {
                Notification.show("Invalid credentials. Please try again.", 3000, Notification.Position.TOP_CENTER)
                    .addThemeVariants(NotificationVariant.LUMO_ERROR);
            }
        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            Notification.show("Login error: " + e.getMessage(), 5000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
        }
    }
}