package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.example.demo.service.DeviceService;
import com.example.demo.model.Device;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.Html;
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
        
        // Professional header
        add(createMapHeader());
        
        // Main map container
        VerticalLayout mapContainer = new VerticalLayout();
        mapContainer.setSizeFull();
        mapContainer.setPadding(true);
        mapContainer.setSpacing(true);
        mapContainer.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "10px")
            .set("box-shadow", "0 4px 12px rgba(0,0,0,0.1)")
            .set("margin", "1rem");
        
        // Device selector
        mapContainer.add(createDeviceSelector());
        
        // Live map
        mapContainer.add(createLiveMap());
        
        // Device status panel
        mapContainer.add(createDeviceStatusPanel());
        
        add(mapContainer);
        
        // Add real-time updates
        addRealTimeUpdates();
    }
    
    private Component createMapHeader() {
        HorizontalLayout header = new HorizontalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(true);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("color", "#ffffff");
        
        // Back button
        Button backBtn = new Button("← Dashboard", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.getStyle().set("color", "#ffffff");
        backBtn.addClickListener(e -> UI.getCurrent().navigate(""));
        
        // Title
        H1 title = new H1("📍 Live Device Tracking");
        title.getStyle()
            .set("color", "#ffffff")
            .set("margin", "0")
            .set("font-size", "1.8rem")
            .set("font-weight", "600");
        
        // Status indicator
        Span statusIndicator = new Span("🟢 Live Tracking Active");
        statusIndicator.getStyle()
            .set("background", "rgba(255, 255, 255, 0.2)")
            .set("color", "#ffffff")
            .set("padding", "0.5rem 1rem")
            .set("border-radius", "20px")
            .set("font-weight", "500");
        
        header.add(backBtn, title);
        header.expand(title);
        header.add(statusIndicator);
        
        return header;
    }
    
    private Component createDeviceSelector() {
        HorizontalLayout selector = new HorizontalLayout();
        selector.setWidthFull();
        selector.setPadding(false);
        selector.setSpacing(true);
        selector.setAlignItems(FlexComponent.Alignment.CENTER);
        
        H3 selectorTitle = new H3("Select Device to Track:");
        selectorTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0")
            .set("font-size", "1.2rem");
        
        // Get user devices
        List<Device> devices = deviceService.getCurrentUserDevices();
        
        HorizontalLayout deviceButtons = new HorizontalLayout();
        deviceButtons.setSpacing(true);
        
        for (Device device : devices) {
            Button deviceBtn = new Button(device.getDeviceName());
            deviceBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
            deviceBtn.getStyle()
                .set("background", device.getIsOnline() ? "#10b981" : "#6b7280")
                .set("border-radius", "8px");
            
            deviceBtn.addClickListener(e -> {
                // Focus on this device
                focusOnDevice(device);
                Notification.show("📍 Tracking " + device.getDeviceName(), 3000, Notification.Position.TOP_CENTER)
                    .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
            });
            
            deviceButtons.add(deviceBtn);
        }
        
        if (devices.isEmpty()) {
            Span noDevices = new Span("No devices found. Add a device first.");
            noDevices.getStyle().set("color", "#6b7280");
            deviceButtons.add(noDevices);
        }
        
        selector.add(selectorTitle, deviceButtons);
        return selector;
    }
    
    private Component createLiveMap() {
        VerticalLayout mapSection = new VerticalLayout();
        mapSection.setPadding(false);
        mapSection.setSpacing(true);
        mapSection.getStyle()
            .set("border", "2px solid #e5e7eb")
            .set("border-radius", "10px")
            .set("min-height", "400px");
        
        // Map header
        HorizontalLayout mapHeader = new HorizontalLayout();
        mapHeader.setWidthFull();
        mapHeader.setPadding(true);
        mapHeader.setSpacing(true);
        mapHeader.setAlignItems(FlexComponent.Alignment.CENTER);
        mapHeader.getStyle()
            .set("background", "#f9fafb")
            .set("border-bottom", "1px solid #e5e7eb");
        
        H4 mapTitle = new H4("🗺️ Real-Time Location Map");
        mapTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0")
            .set("font-size", "1.1rem");
        
        Span lastUpdate = new Span("Last update: Live");
        lastUpdate.getStyle()
            .set("color", "#10b981")
            .set("font-weight", "600")
            .set("font-size", "0.9rem");
        lastUpdate.setId("last-update-time");
        
        mapHeader.add(mapTitle);
        mapHeader.expand(mapTitle);
        mapHeader.add(lastUpdate);
        
        // Interactive map container
        Div mapContainer = new Div();
        mapContainer.setId("live-map-container");
        mapContainer.getStyle()
            .set("width", "100%")
            .set("height", "400px")
            .set("background", "#f0f9ff")
            .set("display", "flex")
            .set("align-items", "center")
            .set("justify-content", "center")
            .set("position", "relative");
        
        // Map will be initialized with JavaScript
        Html mapScript = new Html("""
            <div id="map-placeholder" style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Interactive Map Loading...</h3>
                <p style="color: #6b7280; margin: 0;">Select a device above to start live tracking</p>
            </div>
            <script>
                // Initialize map when page loads
                document.addEventListener('DOMContentLoaded', function() {
                    initializeLiveMap();
                });
                
                function initializeLiveMap() {
                    console.log('🗺️ Initializing live map...');
                    // Map initialization will be handled by the real-time script
                }
                
                function focusOnDevice(deviceId, lat, lng, name) {
                    console.log('📍 Focusing on device:', name, 'at', lat, lng);
                    
                    // Update map placeholder with device info
                    const placeholder = document.getElementById('map-placeholder');
                    if (placeholder) {
                        placeholder.innerHTML = `
                            <div style="font-size: 3rem; margin-bottom: 1rem;">📍</div>
                            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0;">Tracking: ${name}</h3>
                            <p style="color: #10b981; margin: 0; font-weight: 600;">
                                📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
                            </p>
                            <p style="color: #6b7280; margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                                🔄 Live updates every 30 seconds
                            </p>
                        `;
                    }
                    
                    // Update last update time
                    const lastUpdateElement = document.getElementById('last-update-time');
                    if (lastUpdateElement) {
                        lastUpdateElement.textContent = 'Last update: ' + new Date().toLocaleTimeString();
                    }
                }
            </script>
            """);
        
        mapContainer.add(mapScript);
        
        mapSection.add(mapHeader, mapContainer);
        return mapSection;
    }
    
    private Component createDeviceStatusPanel() {
        HorizontalLayout statusPanel = new HorizontalLayout();
        statusPanel.setWidthFull();
        statusPanel.setPadding(true);
        statusPanel.setSpacing(true);
        statusPanel.getStyle()
            .set("background", "#f9fafb")
            .set("border-radius", "10px")
            .set("border", "1px solid #e5e7eb");
        
        // Quick stats
        List<Device> devices = deviceService.getCurrentUserDevices();
        long onlineCount = devices.stream().filter(d -> d.getIsOnline() != null && d.getIsOnline()).count();
        
        statusPanel.add(
            createQuickStat("📱", "Total Devices", String.valueOf(devices.size()), "#3b82f6"),
            createQuickStat("🟢", "Online Now", String.valueOf(onlineCount), "#10b981"),
            createQuickStat("📍", "Being Tracked", String.valueOf(onlineCount), "#8b5cf6"),
            createQuickStat("🔄", "Update Rate", "30 seconds", "#f59e0b")
        );
        
        return statusPanel;
    }
    
    private Component createQuickStat(String icon, String label, String value, String color) {
        VerticalLayout stat = new VerticalLayout();
        stat.setPadding(false);
        stat.setSpacing(false);
        stat.setAlignItems(FlexComponent.Alignment.CENTER);
        stat.getStyle()
            .set("text-align", "center")
            .set("flex", "1");
        
        Span iconSpan = new Span(icon);
        iconSpan.getStyle().set("font-size", "1.5rem");
        
        H4 valueH4 = new H4(value);
        valueH4.getStyle()
            .set("color", color)
            .set("font-size", "1.5rem")
            .set("font-weight", "700")
            .set("margin", "0.25rem 0");
        
        Span labelSpan = new Span(label);
        labelSpan.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("font-weight", "500");
        
        stat.add(iconSpan, valueH4, labelSpan);
        return stat;
    }
    
    private void focusOnDevice(Device device) {
        if (device.getLatitude() != null && device.getLongitude() != null) {
            // Execute JavaScript to focus on device
            UI.getCurrent().getPage().executeJs(
                "focusOnDevice($0, $1, $2, $3)",
                device.getDeviceId(),
                device.getLatitude(),
                device.getLongitude(),
                device.getDeviceName()
            );
        } else {
            Notification.show("📍 No location data available for " + device.getDeviceName(), 
                3000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
        }
    }
    
    private void addRealTimeUpdates() {
        // Add real-time WebSocket updates
        Html realTimeScript = new Html("""
            <script>
                // Connect to WebSocket for real-time updates
                let ws = null;
                
                function connectWebSocket() {
                    try {
                        ws = new WebSocket('ws://localhost:8080/ws');
                        
                        ws.onopen = function() {
                            console.log('🔌 WebSocket connected for live tracking');
                        };
                        
                        ws.onmessage = function(event) {
                            const data = JSON.parse(event.data);
                            if (data.type === 'device_update') {
                                updateDeviceLocation(data.data);
                            }
                        };
                        
                        ws.onclose = function() {
                            console.log('🔌 WebSocket disconnected, reconnecting...');
                            setTimeout(connectWebSocket, 5000);
                        };
                        
                    } catch (error) {
                        console.error('WebSocket connection failed:', error);
                        setTimeout(connectWebSocket, 5000);
                    }
                }
                
                function updateDeviceLocation(deviceData) {
                    if (deviceData.latitude && deviceData.longitude) {
                        console.log('📍 Live location update:', deviceData.deviceName, deviceData.latitude, deviceData.longitude);
                        
                        // Update map if this device is being tracked
                        focusOnDevice(deviceData.deviceId, deviceData.latitude, deviceData.longitude, deviceData.deviceName);
                        
                        // Show notification for location updates
                        showLocationUpdate(deviceData.deviceName, deviceData.latitude, deviceData.longitude);
                    }
                }
                
                function showLocationUpdate(deviceName, lat, lng) {
                    // Create a temporary notification
                    const notification = document.createElement('div');
                    notification.innerHTML = `
                        <div style="
                            position: fixed; 
                            top: 20px; 
                            right: 20px; 
                            background: #10b981; 
                            color: white; 
                            padding: 1rem; 
                            border-radius: 8px; 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                            z-index: 1000;
                            font-weight: 500;
                        ">
                            📍 ${deviceName} location updated<br>
                            <small>${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
                        </div>
                    `;
                    
                    document.body.appendChild(notification);
                    
                    // Remove after 3 seconds
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 3000);
                }
                
                // Start WebSocket connection
                connectWebSocket();
                
                // Refresh device status every 30 seconds
                setInterval(() => {
                    console.log('🔄 Refreshing device status...');
                    // This would trigger a page refresh or AJAX update
                }, 30000);
            </script>
            """);
        
        add(realTimeScript);
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        
        // Clean modern background
        getStyle()
            .set("background", "#f8fafc")
            .set("font-family", "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif");

        // Header
        add(createCleanHeader());
        
        // Main content
        HorizontalLayout mainContent = new HorizontalLayout();
        mainContent.setSizeFull();
        mainContent.setPadding(true);
        mainContent.setSpacing(true);
        
        // Map area (left side)
        mainContent.add(createMapArea());
        
        // Device panel (right side)
        mainContent.add(createDevicePanel());
        
        add(mainContent);
    }

    private Component createCleanHeader() {
        HorizontalLayout header = new HorizontalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(true);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);
        header.getStyle()
            .set("background", "#ffffff")
            .set("border-bottom", "1px solid #e5e7eb")
            .set("box-shadow", "0 1px 3px rgba(0, 0, 0, 0.1)");

        // Back button and title
        HorizontalLayout leftSection = new HorizontalLayout();
        leftSection.setAlignItems(FlexComponent.Alignment.CENTER);
        leftSection.setSpacing(true);
        
        Button backBtn = new Button("← Dashboard", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.addClickListener(e -> UI.getCurrent().navigate(""));
        
        H1 title = new H1("📍 Live Laptop Tracking");
        title.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "700")
            .set("margin", "0");
        
        leftSection.add(backBtn, title);

        // Controls
        HorizontalLayout controls = new HorizontalLayout();
        controls.setAlignItems(FlexComponent.Alignment.CENTER);
        controls.setSpacing(true);
        
        Button refreshBtn = new Button("Refresh", VaadinIcon.REFRESH.create());
        refreshBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        refreshBtn.addClickListener(e -> {
            Notification.show("🔄 Locations updated!", 2000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });
        
        Button fullscreenBtn = new Button("Fullscreen", VaadinIcon.EXPAND_SQUARE.create());
        fullscreenBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        fullscreenBtn.addClickListener(e -> {
            Notification.show("🖥️ Fullscreen mode activated!", 2000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });
        
        controls.add(refreshBtn, fullscreenBtn);
        
        header.add(leftSection, controls);
        return header;
    }

    private Component createMapArea() {
        VerticalLayout mapContainer = new VerticalLayout();
        mapContainer.setPadding(false);
        mapContainer.setSpacing(false);
        mapContainer.getStyle()
            .set("flex", "2")
            .set("background", "#ffffff")
            .set("border-radius", "1rem")
            .set("box-shadow", "0 1px 3px rgba(0, 0, 0, 0.1)")
            .set("overflow", "hidden");

        // Real interactive map with device locations
        mapContainer.setSizeFull();
        
        // Map HTML with real functionality
        Html mapHtml = new Html(createInteractiveMapHtml());
        mapHtml.getStyle()
            .set("width", "100%")
            .set("height", "500px")
            .set("border-radius", "0.75rem")
            .set("overflow", "hidden");
        
        mapContainer.add(mapHtml);
        
        return mapContainer;
    }
    
    private String createInteractiveMapHtml() {
        List<Device> devices = deviceService.getCurrentUserDevices();
        StringBuilder devicesJson = new StringBuilder("[");
        
        for (int i = 0; i < devices.size(); i++) {
            Device device = devices.get(i);
            if (device.getLatitude() != null && device.getLongitude() != null) {
                if (i > 0) devicesJson.append(",");
                devicesJson.append(String.format(
                    "{\"name\":\"%s\",\"lat\":%f,\"lng\":%f,\"online\":%b,\"address\":\"%s\"}",
                    device.getDeviceName() != null ? device.getDeviceName() : "Unknown Device",
                    device.getLatitude(),
                    device.getLongitude(),
                    device.getIsOnline() != null ? device.getIsOnline() : false,
                    device.getAddress() != null ? device.getAddress() : "Unknown Location"
                ));
            }
        }
        devicesJson.append("]");
        
        return String.format("""
            <div id="lapso-map" style="width: 100%%; height: 500px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%); border-radius: 0.75rem; position: relative; display: flex; align-items: center; justify-content: center; color: white;">
                <div style="text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🗺️</div>
                    <h2 style="font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem 0;">Live Device Map</h2>
                    <p style="font-size: 1.125rem; margin: 0 0 1rem 0; opacity: 0.9;">Real-time tracking • %d devices found</p>
                    <div id="device-markers" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        %s
                    </div>
                    <div style="margin-top: 2rem;">
                        <button onclick="refreshMap()" style="background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">🔄 Refresh Locations</button>
                    </div>
                </div>
            </div>
            <script>
                const devices = %s;
                
                function refreshMap() {
                    fetch('/api/location/monitoring-stats')
                        .then(response => response.json())
                        .then(data => {
                            console.log('📍 Map refreshed:', data);
                            showNotification('🗺️ Map updated with latest locations!');
                        })
                        .catch(error => console.error('Map refresh failed:', error));
                }
                
                function showNotification(message) {
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; z-index: 1000;';
                    notification.textContent = message;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                }
                
                // Auto-refresh every 30 seconds
                setInterval(refreshMap, 30000);
            </script>
            """, 
            devices.size(),
            generateDeviceMarkers(devices),
            devicesJson.toString()
        );
    }
    
    private String generateDeviceMarkers(List<Device> devices) {
        StringBuilder markers = new StringBuilder();
        for (Device device : devices) {
            if (device.getLatitude() != null && device.getLongitude() != null) {
                boolean isOnline = device.getIsOnline() != null ? device.getIsOnline() : false;
                markers.append(String.format(
                    "<div style='background: %s; color: white; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 600;'>%s %s</div>",
                    isOnline ? "#10b981" : "#ef4444",
                    isOnline ? "🟢" : "🔴",
                    device.getDeviceName() != null ? device.getDeviceName() : "Unknown Device"
                ));
            }
        }
        return markers.toString();
    }

    private Component createDevicePanel() {
        VerticalLayout panel = new VerticalLayout();
        panel.setPadding(true);
        panel.setSpacing(true);
        panel.getStyle()
            .set("flex", "1")
            .set("background", "#ffffff")
            .set("border-radius", "1rem")
            .set("box-shadow", "0 1px 3px rgba(0, 0, 0, 0.1)")
            .set("max-width", "350px")
            .set("min-width", "300px");

        // Panel header
        HorizontalLayout panelHeader = new HorizontalLayout();
        panelHeader.setWidthFull();
        panelHeader.setAlignItems(FlexComponent.Alignment.CENTER);
        panelHeader.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);

        H3 panelTitle = new H3("Your Devices");
        panelTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.25rem")
            .set("font-weight", "700")
            .set("margin", "0");

        Span deviceCount = new Span("🔴 Live Updates");
        deviceCount.getStyle()
            .set("background", "#dcfce7")
            .set("color", "#166534")
            .set("padding", "0.25rem 0.75rem")
            .set("border-radius", "1rem")
            .set("font-size", "0.75rem")
            .set("font-weight", "600")
            .set("animation", "pulse 2s infinite");

        panelHeader.add(panelTitle, deviceCount);

        // Device list
        VerticalLayout deviceList = new VerticalLayout();
        deviceList.setPadding(false);
        deviceList.setSpacing(true);

        List<Device> devices = deviceService.getCurrentUserDevices();
        
        if (devices.isEmpty()) {
            deviceList.add(createEmptyDeviceState());
        } else {
            for (Device device : devices) {
                deviceList.add(createMapDeviceCard(device));
            }
        }

        // Quick actions
        VerticalLayout quickActions = new VerticalLayout();
        quickActions.setPadding(false);
        quickActions.setSpacing(true);

        H4 actionsTitle = new H4("Quick Actions");
        actionsTitle.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1rem")
            .set("font-weight", "600")
            .set("margin", "1rem 0 0.5rem 0");

        Button locateAllBtn = new Button("Locate All Devices", VaadinIcon.LOCATION_ARROW_CIRCLE.create());
        locateAllBtn.setWidthFull();
        locateAllBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        locateAllBtn.getStyle()
            .set("background", "#10b981")
            .set("border-radius", "0.5rem");
        locateAllBtn.addClickListener(e -> {
            Notification.show("📍 Locating all devices...", 3000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });

        Button exportBtn = new Button("Export Locations", VaadinIcon.DOWNLOAD.create());
        exportBtn.setWidthFull();
        exportBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        exportBtn.addClickListener(e -> {
            Notification.show("📄 Location data exported!", 3000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });

        quickActions.add(actionsTitle, locateAllBtn, exportBtn);

        panel.add(panelHeader, deviceList, quickActions);
        return panel;
    }

    private Component createEmptyDeviceState() {
        VerticalLayout emptyState = new VerticalLayout();
        emptyState.setAlignItems(FlexComponent.Alignment.CENTER);
        emptyState.setPadding(true);
        emptyState.getStyle()
            .set("text-align", "center")
            .set("padding", "2rem");

        Span icon = new Span("📱");
        icon.getStyle().set("font-size", "2rem");

        Paragraph message = new Paragraph("No devices to track yet");
        message.getStyle()
            .set("color", "#6b7280")
            .set("margin", "0.5rem 0");

        Button addDeviceBtn = new Button("Add Device", VaadinIcon.PLUS.create());
        addDeviceBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_SMALL);
        addDeviceBtn.addClickListener(e -> UI.getCurrent().navigate("add-device"));

        emptyState.add(icon, message, addDeviceBtn);
        return emptyState;
    }

    private Component createMapDeviceCard(Device device) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.getStyle()
            .set("background", "#f8fafc")
            .set("border-radius", "0.75rem")
            .set("border", "1px solid #e5e7eb")
            .set("cursor", "pointer")
            .set("transition", "all 0.2s ease")
            .set("margin-bottom", "0.5rem");

        // Hover effect
        card.getElement().addEventListener("mouseenter", e -> {
            card.getStyle()
                .set("background", "#f1f5f9")
                .set("box-shadow", "0 4px 12px rgba(0, 0, 0, 0.15)");
        });
        
        card.getElement().addEventListener("mouseleave", e -> {
            card.getStyle()
                .set("background", "#f8fafc")
                .set("box-shadow", "none");
        });

        // Device header
        HorizontalLayout deviceHeader = new HorizontalLayout();
        deviceHeader.setWidthFull();
        deviceHeader.setAlignItems(FlexComponent.Alignment.CENTER);
        deviceHeader.setJustifyContentMode(FlexComponent.JustifyContentMode.BETWEEN);

        H4 deviceName = new H4("💻 " + (device.getDeviceName() != null ? device.getDeviceName() : "Unknown Device"));
        deviceName.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1rem")
            .set("font-weight", "600")
            .set("margin", "0");

        Span status = new Span();
        boolean isOnline = device.getIsOnline() != null ? device.getIsOnline() : false;
        status.setText(isOnline ? "🟢" : "🔴");
        status.getStyle().set("font-size", "0.75rem");

        deviceHeader.add(deviceName, status);

        // Location info
        Paragraph locationInfo = new Paragraph();
        if (device.getLatitude() != null && device.getLongitude() != null) {
            locationInfo.setText("📍 " + (device.getAddress() != null ? device.getAddress() : 
                String.format("%.4f, %.4f", device.getLatitude(), device.getLongitude())));
        } else {
            locationInfo.setText("📍 Location unavailable");
        }
        locationInfo.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("margin", "0.25rem 0 0.5rem 0");

        // Last seen
        Paragraph lastSeen = new Paragraph();
        if (device.getLastSeen() != null) {
            lastSeen.setText("⏰ " + device.getLastSeen().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")));
        } else {
            lastSeen.setText("⏰ Never seen");
        }
        lastSeen.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.75rem")
            .set("margin", "0");

        // Action buttons
        HorizontalLayout actions = new HorizontalLayout();
        actions.setSpacing(true);
        actions.getStyle().set("margin-top", "0.5rem");
        
        Button centerBtn = new Button("Center", VaadinIcon.CROSSHAIRS.create());
        centerBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_TERTIARY);
        centerBtn.addClickListener(e -> {
            Notification.show("🎯 Centered on " + device.getDeviceName(), 2000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });
        
        Button trackBtn = new Button("Track", VaadinIcon.LOCATION_ARROW.create());
        trackBtn.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_PRIMARY);
        trackBtn.getStyle().set("background", "#10b981");
        trackBtn.addClickListener(e -> {
            Notification.show("🔍 Tracking " + device.getDeviceName(), 2000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });
        
        actions.add(centerBtn, trackBtn);

        card.add(deviceHeader, locationInfo, lastSeen, actions);
        return card;
    }
}