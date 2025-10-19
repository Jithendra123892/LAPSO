package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.example.demo.service.DeviceService;
import com.example.demo.service.AnalyticsService;
import com.example.demo.service.EnhancedLocationService;
import com.example.demo.service.GeofenceService;
import com.example.demo.model.Device;
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
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Route("dashboard")
@PageTitle("LAPSO - Professional Laptop Security Dashboard")
@AnonymousAllowed
public class CleanDashboard extends VerticalLayout {

    @Autowired
    private SimpleAuthService authService;
    
    @Autowired
    private DeviceService deviceService;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @Autowired
    private EnhancedLocationService enhancedLocationService;
    
    @Autowired
    private GeofenceService geofenceService;

    public CleanDashboard(SimpleAuthService authService, DeviceService deviceService, AnalyticsService analyticsService, EnhancedLocationService enhancedLocationService, GeofenceService geofenceService) {
        this.authService = authService;
        this.deviceService = deviceService;
        this.analyticsService = analyticsService;
        this.enhancedLocationService = enhancedLocationService;
        this.geofenceService = geofenceService;
        
        // Check authentication
        if (!authService.isAuthenticated()) {
            UI.getCurrent().navigate("login");
            return;
        }
        
        createCleanDashboard();
    }

    private void createCleanDashboard() {
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        
        // Friendly, welcoming background
        getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("font-family", "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
            .set("color", "#ffffff");

        // User-friendly header
        add(createWelcomeHeader());
        
        // Main content with user focus
        VerticalLayout mainContent = new VerticalLayout();
        mainContent.setPadding(true);
        mainContent.setSpacing(true);
        mainContent.getStyle()
            .set("max-width", "1000px")
            .set("margin", "0 auto")
            .set("width", "100%")
            .set("background", "rgba(255, 255, 255, 0.95)")
            .set("border-radius", "20px")
            .set("box-shadow", "0 20px 40px rgba(0,0,0,0.1)")
            .set("color", "#333");
        
        // User-focused status
        mainContent.add(createUserFriendlyStatus());
        
        // Simple devices section
        mainContent.add(createSimpleDevicesSection());
        
        // What users actually want to do
        mainContent.add(createUserActions());
        
        add(mainContent);
    }

    private Component createWelcomeHeader() {
        VerticalLayout header = new VerticalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(false);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.getStyle()
            .set("text-align", "center")
            .set("padding", "2rem 1rem");

        // Friendly greeting
        String currentUser = authService.getCurrentUser();
        String displayName = currentUser != null && currentUser.contains("@") ? 
            currentUser.split("@")[0] : "Friend";
        
        H1 greeting = new H1("Hi " + displayName + "! 👋");
        greeting.getStyle()
            .set("color", "#ffffff")
            .set("font-size", "2.5rem")
            .set("font-weight", "300")
            .set("margin", "0 0 0.5rem 0")
            .set("text-shadow", "0 2px 4px rgba(0,0,0,0.3)");
        
        Paragraph subtitle = new Paragraph("Your laptops are safe and sound 😊");
        subtitle.getStyle()
            .set("color", "rgba(255, 255, 255, 0.9)")
            .set("font-size", "1.2rem")
            .set("margin", "0 0 1rem 0")
            .set("font-weight", "400");
        
        // Simple status indicator
        Div statusIndicator = new Div();
        statusIndicator.add(new Span("🟢 Everything looks good"));
        statusIndicator.getStyle()
            .set("background", "rgba(255, 255, 255, 0.2)")
            .set("color", "#ffffff")
            .set("padding", "0.5rem 1rem")
            .set("border-radius", "25px")
            .set("font-weight", "500")
            .set("backdrop-filter", "blur(10px)");
        
        header.add(greeting, subtitle, statusIndicator);
        return header;
    }

    private Component createUserFriendlyStatus() {
        VerticalLayout statusSection = new VerticalLayout();
        statusSection.setPadding(false);
        statusSection.setSpacing(true);
        statusSection.getStyle().set("margin-bottom", "2rem");

        H2 sectionTitle = new H2("Your Protection Status");
        sectionTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0 0 1rem 0")
            .set("text-align", "center");

        HorizontalLayout statusCards = new HorizontalLayout();
        statusCards.setWidthFull();
        statusCards.setSpacing(true);
        statusCards.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);

        String userEmail = authService.getCurrentUser();
        Map<String, Object> analytics = analyticsService.getDashboardAnalytics(userEmail != null ? userEmail : "");

        statusCards.add(
            createFriendlyStatusCard("💻", "Your Laptops", analytics.get("totalDevices").toString(), "#10b981", "Being watched 24/7"),
            createFriendlyStatusCard("🛡️", "Protection Level", "Maximum", "#3b82f6", "Always monitoring"),
            createFriendlyStatusCard("💰", "Cost to You", "$0", "#8b5cf6", "Free forever")
        );

        statusSection.add(sectionTitle, statusCards);
        return statusSection;
    }

    private Component createSimpleDevicesSection() {
        VerticalLayout section = new VerticalLayout();
        section.setPadding(false);
        section.setSpacing(true);

        // Simple, friendly header
        H2 sectionTitle = new H2("Your Laptops 💻");
        sectionTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0 0 1rem 0")
            .set("text-align", "center");

        // Devices list
        List<Device> devices = deviceService.getCurrentUserDevices();
        
        if (devices.isEmpty()) {
            section.add(sectionTitle, createFriendlyEmptyState());
        } else {
            VerticalLayout devicesList = new VerticalLayout();
            devicesList.setPadding(false);
            devicesList.setSpacing(true);
            
            for (Device device : devices) {
                devicesList.add(createFriendlyDeviceCard(device));
            }
            
            section.add(sectionTitle, devicesList);
        }

        return section;
    }

    private Component createUserActions() {
        VerticalLayout section = new VerticalLayout();
        section.setPadding(false);
        section.setSpacing(true);

        H2 sectionTitle = new H2("What would you like to do? 🤔");
        sectionTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0 0 1rem 0")
            .set("text-align", "center");

        HorizontalLayout actionsGrid = new HorizontalLayout();
        actionsGrid.setWidthFull();
        actionsGrid.setSpacing(true);
        actionsGrid.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);

        actionsGrid.add(
            createUserActionCard("📍", "Find My Laptop", "Show me where it is right now", () -> UI.getCurrent().navigate("map")),
            createUserActionCard("🔒", "Lock My Laptop", "Lock it if I think it's stolen", () -> {
                Notification.show("🔒 Your laptop will be locked remotely. Choose your device from the list above!", 
                    5000, Notification.Position.TOP_CENTER)
                    .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
            }),
            createUserActionCard("📱", "Protect Another Device", "Add my phone, tablet, or another laptop", () -> UI.getCurrent().navigate("download-agent"))
        );

        section.add(sectionTitle, actionsGrid);
        return section;
    }

    // Helper methods
    private Component createFriendlyStatusCard(String icon, String title, String value, String color, String description) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.1)")
            .set("border", "2px solid " + color)
            .set("flex", "1")
            .set("min-width", "200px")
            .set("text-align", "center")
            .set("transition", "all 0.3s ease")
            .set("cursor", "default");

        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "2.5rem")
            .set("margin-bottom", "0.5rem");

        H3 valueH3 = new H3(value);
        valueH3.getStyle()
            .set("color", color)
            .set("font-size", "2rem")
            .set("font-weight", "700")
            .set("margin", "0 0 0.25rem 0");

        H4 titleH4 = new H4(title);
        titleH4.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1rem")
            .set("font-weight", "600")
            .set("margin", "0 0 0.5rem 0");

        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("margin", "0");

        card.add(iconSpan, valueH3, titleH4, desc);
        return card;
    }
    
    private Component createFriendlyEmptyState() {
        VerticalLayout emptyState = new VerticalLayout();
        emptyState.setAlignItems(FlexComponent.Alignment.CENTER);
        emptyState.setPadding(true);
        emptyState.getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("border-radius", "20px")
            .set("padding", "3rem")
            .set("text-align", "center")
            .set("color", "#ffffff");

        Span icon = new Span("🚀");
        icon.getStyle().set("font-size", "4rem");

        H3 title = new H3("Ready to protect your first laptop?");
        title.getStyle()
            .set("color", "#ffffff")
            .set("margin", "1rem 0 0.5rem 0")
            .set("font-weight", "600");

        Paragraph description = new Paragraph("It takes just 2 minutes to set up. We'll guide you through every step!");
        description.getStyle()
            .set("color", "rgba(255, 255, 255, 0.9)")
            .set("margin", "0 0 2rem 0")
            .set("font-size", "1.1rem");

        Button addFirstDevice = new Button("🛡️ Protect My Laptop", VaadinIcon.PLUS.create());
        addFirstDevice.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_LARGE);
        addFirstDevice.getStyle()
            .set("background", "rgba(255, 255, 255, 0.2)")
            .set("border", "2px solid rgba(255, 255, 255, 0.3)")
            .set("color", "#ffffff")
            .set("border-radius", "25px")
            .set("padding", "1rem 2rem")
            .set("font-size", "1.1rem")
            .set("font-weight", "600")
            .set("backdrop-filter", "blur(10px)");
        addFirstDevice.addClickListener(e -> UI.getCurrent().navigate("download-agent"));

        emptyState.add(icon, title, description, addFirstDevice);
        return emptyState;
    }
    
    private Component createFriendlyDeviceCard(Device device) {
        HorizontalLayout card = new HorizontalLayout();
        card.setWidthFull();
        card.setPadding(true);
        card.setSpacing(true);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("border", "1px solid #e5e7eb")
            .set("box-shadow", "0 2px 10px rgba(0, 0, 0, 0.1)")
            .set("transition", "all 0.3s ease")
            .set("margin-bottom", "1rem");

        // Device info with friendly language
        VerticalLayout deviceInfo = new VerticalLayout();
        deviceInfo.setPadding(false);
        deviceInfo.setSpacing(false);
        deviceInfo.getStyle().set("flex", "1");

        String deviceName = device.getDeviceName() != null ? device.getDeviceName() : "Your Laptop";
        H3 nameH3 = new H3("💻 " + deviceName);
        nameH3.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.2rem")
            .set("font-weight", "600")
            .set("margin", "0 0 0.5rem 0");

        // Friendly status message
        String statusMessage = "";
        String statusColor = "#10b981";
        boolean isOnline = device.getIsOnline() != null ? device.getIsOnline() : false;
        
        if (isOnline) {
            if (device.getAddress() != null && device.getAddress().toLowerCase().contains("home")) {
                statusMessage = "😊 Safe at home";
            } else if (device.getAddress() != null) {
                statusMessage = "📍 At " + device.getAddress();
            } else {
                statusMessage = "✅ Online and protected";
            }
        } else {
            statusMessage = "😴 Sleeping (offline)";
            statusColor = "#f59e0b";
        }

        Paragraph statusP = new Paragraph(statusMessage);
        statusP.getStyle()
            .set("color", statusColor)
            .set("font-size", "1rem")
            .set("margin", "0 0 0.5rem 0")
            .set("font-weight", "500");

        // Last seen info
        String lastSeenText = "Last seen: " + getTimeAgo(device.getLastSeen());
        Paragraph lastSeenP = new Paragraph(lastSeenText);
        lastSeenP.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("margin", "0");

        deviceInfo.add(nameH3, statusP, lastSeenP);

        // Quick action buttons with friendly labels
        HorizontalLayout actions = new HorizontalLayout();
        actions.setSpacing(true);
        
        Button findBtn = new Button("📍 Find", VaadinIcon.LOCATION_ARROW.create());
        findBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_PRIMARY);
        findBtn.getStyle()
            .set("background", "#10b981")
            .set("border-radius", "20px");
        findBtn.addClickListener(e -> UI.getCurrent().navigate("map"));
        
        Button protectBtn = new Button("🔒 Lock", VaadinIcon.LOCK.create());
        protectBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_CONTRAST);
        protectBtn.getStyle().set("border-radius", "20px");
        protectBtn.addClickListener(e -> {
            executeQuickAction(device.getDeviceId(), "lock", "🔒 Your laptop is now locked!");
        });
        
        actions.add(findBtn, protectBtn);

        card.add(deviceInfo, actions);
        return card;
    }
    
    private Component createUserActionCard(String icon, String title, String description, Runnable action) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "20px")
            .set("border", "2px solid #e5e7eb")
            .set("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.1)")
            .set("flex", "1")
            .set("text-align", "center")
            .set("cursor", "pointer")
            .set("transition", "all 0.3s ease")
            .set("min-height", "150px")
            .set("justify-content", "center")
            .set("max-width", "250px");

        // Hover effect
        card.getElement().addEventListener("mouseenter", e -> {
            card.getStyle()
                .set("box-shadow", "0 8px 25px rgba(0, 0, 0, 0.15)")
                .set("transform", "translateY(-5px)")
                .set("border-color", "#10b981");
        });
        
        card.getElement().addEventListener("mouseleave", e -> {
            card.getStyle()
                .set("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.1)")
                .set("transform", "translateY(0)")
                .set("border-color", "#e5e7eb");
        });

        card.addClickListener(e -> action.run());

        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "2.5rem")
            .set("margin-bottom", "1rem");

        H3 titleH3 = new H3(title);
        titleH3.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.1rem")
            .set("font-weight", "600")
            .set("margin", "0 0 0.5rem 0");

        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.9rem")
            .set("margin", "0")
            .set("line-height", "1.4");

        card.add(iconSpan, titleH3, desc);
        return card;
    }
    
    private void executeQuickAction(String deviceId, String action, String successMessage) {
        Notification.show(successMessage, 3000, Notification.Position.TOP_CENTER)
            .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
    }
    
    private String getTimeAgo(LocalDateTime lastSeen) {
        if (lastSeen == null) return "unknown";
        
        long minutes = java.time.Duration.between(lastSeen, LocalDateTime.now()).toMinutes();
        
        if (minutes < 1) return "just now";
        if (minutes < 60) return minutes + " minutes ago";
        if (minutes < 1440) return (minutes / 60) + " hours ago";
        return (minutes / 1440) + " days ago";
    }
}