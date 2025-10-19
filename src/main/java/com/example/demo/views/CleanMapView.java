package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.example.demo.service.DeviceService;
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

import java.time.format.DateTimeFormatter;
import java.util.List;

@Route("map")
@PageTitle("Live Tracking - LAPSO Professional")
@AnonymousAllowed
public class CleanMapView extends VerticalLayout {

    @Autowired
    private SimpleAuthService authService;
    
    @Autowired
    private DeviceService deviceService;

    public CleanMapView(SimpleAuthService authService, DeviceService deviceService) {
        this.authService = authService;
        this.deviceService = deviceService;
        
        // Check authentication
        if (!authService.isAuthenticated()) {
            UI.getCurrent().navigate("login");
            return;
        }
        
        createCleanMapInterface();
    }

    private void createCleanMapInterface() {
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        
        // Modern gradient background
        getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("font-family", "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif")
            .set("min-height", "100vh");

        // Header
        add(createMapHeader());
        
        // Map container
        VerticalLayout mapContainer = new VerticalLayout();
        mapContainer.setSizeFull();
        mapContainer.setPadding(true);
        mapContainer.setSpacing(true);
        mapContainer.getStyle()
            .set("background", "rgba(255, 255, 255, 0.95)")
            .set("border-radius", "20px 20px 0 0")
            .set("margin", "0")
            .set("flex", "1");

        // Simple map placeholder for now
        createSimpleMapView(mapContainer);
        
        add(mapContainer);
    }

    private Component createMapHeader() {
        HorizontalLayout header = new HorizontalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(true);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.getStyle()
            .set("color", "#ffffff")
            .set("padding", "1rem 2rem");

        // Back button
        Button backBtn = new Button("← Back", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.getStyle()
            .set("color", "#ffffff")
            .set("border", "1px solid rgba(255, 255, 255, 0.3)")
            .set("border-radius", "20px");
        backBtn.addClickListener(e -> UI.getCurrent().navigate("dashboard"));

        // Title
        H1 title = new H1("📍 Live Device Tracking");
        title.getStyle()
            .set("color", "#ffffff")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0")
            .set("flex", "1");

        // Refresh button
        Button refreshBtn = new Button("🔄 Refresh", VaadinIcon.REFRESH.create());
        refreshBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        refreshBtn.getStyle()
            .set("background", "rgba(255, 255, 255, 0.2)")
            .set("border", "1px solid rgba(255, 255, 255, 0.3)")
            .set("color", "#ffffff")
            .set("border-radius", "20px");
        refreshBtn.addClickListener(e -> {
            Notification.show("🔄 Refreshing device locations...", 2000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });

        header.add(backBtn, title, refreshBtn);
        return header;
    }

    private void createSimpleMapView(VerticalLayout container) {
        // Get user devices
        List<Device> devices = deviceService.getCurrentUserDevices();
        
        if (devices.isEmpty()) {
            createEmptyMapState(container);
            return;
        }

        // Map title
        H2 mapTitle = new H2("🗺️ Your Devices on the Map");
        mapTitle.getStyle()
            .set("color", "#1f2937")
            .set("text-align", "center")
            .set("margin", "0 0 2rem 0");

        // Simple map placeholder
        Div mapPlaceholder = new Div();
        mapPlaceholder.getStyle()
            .set("background", "linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)")
            .set("border", "2px solid #0ea5e9")
            .set("border-radius", "15px")
            .set("height", "400px")
            .set("display", "flex")
            .set("align-items", "center")
            .set("justify-content", "center")
            .set("flex-direction", "column")
            .set("margin-bottom", "2rem");

        Span mapIcon = new Span("🗺️");
        mapIcon.getStyle().set("font-size", "4rem");

        H3 mapMessage = new H3("Interactive Map Coming Soon!");
        mapMessage.getStyle()
            .set("color", "#0369a1")
            .set("margin", "1rem 0 0.5rem 0");

        Paragraph mapDesc = new Paragraph("For now, see your device locations below");
        mapDesc.getStyle()
            .set("color", "#0284c7")
            .set("margin", "0");

        mapPlaceholder.add(mapIcon, mapMessage, mapDesc);

        // Device list
        VerticalLayout devicesList = new VerticalLayout();
        devicesList.setPadding(false);
        devicesList.setSpacing(true);

        for (Device device : devices) {
            devicesList.add(createMapDeviceCard(device));
        }

        container.add(mapTitle, mapPlaceholder, devicesList);
    }

    private void createEmptyMapState(VerticalLayout container) {
        VerticalLayout emptyState = new VerticalLayout();
        emptyState.setAlignItems(FlexComponent.Alignment.CENTER);
        emptyState.setPadding(true);
        emptyState.getStyle()
            .set("text-align", "center")
            .set("padding", "4rem 2rem");

        Span icon = new Span("📍");
        icon.getStyle().set("font-size", "4rem");

        H2 title = new H2("No devices to track yet");
        title.getStyle()
            .set("color", "#1f2937")
            .set("margin", "1rem 0 0.5rem 0");

        Paragraph description = new Paragraph("Add your first device to see it on the map");
        description.getStyle()
            .set("color", "#6b7280")
            .set("margin", "0 0 2rem 0");

        Button addDevice = new Button("📱 Add Device", VaadinIcon.PLUS.create());
        addDevice.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_LARGE);
        addDevice.getStyle()
            .set("background", "#10b981")
            .set("border-radius", "25px");
        addDevice.addClickListener(e -> UI.getCurrent().navigate("download-agent"));

        emptyState.add(icon, title, description, addDevice);
        container.add(emptyState);
    }

    private Component createMapDeviceCard(Device device) {
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
            .set("margin-bottom", "1rem");

        // Device info
        VerticalLayout deviceInfo = new VerticalLayout();
        deviceInfo.setPadding(false);
        deviceInfo.setSpacing(false);
        deviceInfo.getStyle().set("flex", "1");

        String deviceName = device.getDeviceName() != null ? device.getDeviceName() : "Unknown Device";
        H3 nameH3 = new H3("💻 " + deviceName);
        nameH3.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.1rem")
            .set("font-weight", "600")
            .set("margin", "0 0 0.5rem 0");

        // Location info
        String locationText = "📍 ";
        if (device.getLatitude() != null && device.getLongitude() != null) {
            locationText += String.format("Lat: %.4f, Lng: %.4f", device.getLatitude(), device.getLongitude());
            if (device.getAddress() != null) {
                locationText = "📍 " + device.getAddress();
            }
        } else {
            locationText += "Location not available";
        }

        Paragraph locationP = new Paragraph(locationText);
        locationP.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.9rem")
            .set("margin", "0 0 0.5rem 0");

        // Last seen
        String lastSeenText = "⏰ ";
        if (device.getLastSeen() != null) {
            lastSeenText += "Last seen: " + device.getLastSeen().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm"));
        } else {
            lastSeenText += "Never seen";
        }

        Paragraph lastSeenP = new Paragraph(lastSeenText);
        lastSeenP.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("margin", "0");

        deviceInfo.add(nameH3, locationP, lastSeenP);

        // Status badge
        Span statusBadge = new Span();
        boolean isOnline = device.getIsOnline() != null ? device.getIsOnline() : false;
        statusBadge.setText(isOnline ? "🟢 Online" : "🔴 Offline");
        statusBadge.getStyle()
            .set("background", isOnline ? "#dcfce7" : "#fef2f2")
            .set("color", isOnline ? "#166534" : "#991b1b")
            .set("padding", "0.5rem 1rem")
            .set("border-radius", "20px")
            .set("font-size", "0.875rem")
            .set("font-weight", "600");

        card.add(deviceInfo, statusBadge);
        return card;
    }
}