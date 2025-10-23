package com.example.demo.views;

import com.example.demo.service.PerfectAuthService;
import com.example.demo.service.DeviceService;
import com.example.demo.service.QuickActionsService;
import com.example.demo.model.Device;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.dialog.Dialog;
import com.vaadin.flow.component.dependency.JavaScript;
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
// import org.springframework.beans.factory.annotation.Autowired;
import com.vaadin.flow.component.combobox.ComboBox;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Route("map")
@PageTitle("LAPSO Device Map")
@AnonymousAllowed
public class CleanMapView extends VerticalLayout {

    private final PerfectAuthService authService;
    private final DeviceService deviceService;
    private final QuickActionsService quickActionsService;
    private String selectedDeviceId;
    private String deviceIdToUpdate;  // Added for delete functionality

    public CleanMapView(PerfectAuthService authService, DeviceService deviceService, QuickActionsService quickActionsService) {
        this.authService = authService;
        this.deviceService = deviceService;
        this.quickActionsService = quickActionsService;
        
        // Add user email to page for WebSocket subscription
        if (authService.isAuthenticated()) {
            String userEmail = authService.getLoggedInUser();
            if (userEmail != null) {
                UI.getCurrent().getPage().executeJs(
                    "window.currentUserEmail = $0;", userEmail
                );
                
                // Load battery alert system from static resources
                UI.getCurrent().getPage().addJavaScript("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js");
                UI.getCurrent().getPage().addJavaScript("https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js");
                UI.getCurrent().getPage().addJavaScript("./js/battery-alerts.js");
            }
        }
        
        // Since @AnonymousAllowed is set, allow access but show different content based on auth
        createCleanMapInterface();
    }

    private void createCleanMapInterface() {
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        
        // Clean white background
        getStyle()
            .set("background", "#f5f5f5")
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
            .set("background", "#ffffff")
            .set("color", "#1f2937")
            .set("padding", "1rem 2rem")
            .set("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

        // Back button
        Button backBtn = new Button("Back", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.getStyle()
            .set("color", "#374151")
            .set("border", "1px solid #d1d5db")
            .set("border-radius", "8px");
        backBtn.addClickListener(e -> UI.getCurrent().navigate("dashboard"));

        // Title
        H1 title = new H1("📍 Live Device Tracking");
        title.getStyle()
            .set("color", "#1f2937")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0")
            .set("flex", "1");

        // Fix Location button
        Button fixLocationBtn = new Button("Fix Location", VaadinIcon.MAP_MARKER.create());
        fixLocationBtn.addThemeVariants(ButtonVariant.LUMO_SUCCESS);
        fixLocationBtn.getStyle()
            .set("border-radius", "8px");
        fixLocationBtn.addClickListener(e -> {
            updateDeviceLocationFromBrowser();
        });
        
        // Refresh button
        Button refreshBtn = new Button("Refresh", VaadinIcon.REFRESH.create());
        refreshBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        refreshBtn.getStyle()
            .set("border-radius", "8px");
        refreshBtn.addClickListener(e -> {
            UI.getCurrent().getPage().reload();
        });
        
        // Delete Device button
        Button deleteBtn = new Button("Delete Device", VaadinIcon.TRASH.create());
        deleteBtn.addThemeVariants(ButtonVariant.LUMO_ERROR);
        deleteBtn.getStyle()
            .set("border-radius", "8px");
        deleteBtn.addClickListener(e -> {
            confirmAndDeleteDevice();
        });
        
        // Remote Control Buttons
        Button lockBtn = new Button("Lock", VaadinIcon.LOCK.create());
        lockBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        lockBtn.getStyle()
            .set("background", "#f97316")
            .set("color", "#ffffff")
            .set("border-radius", "8px");
        lockBtn.addClickListener(e -> {
            lockDevice();
        });
        
        Button screenshotBtn = new Button("Screenshot", VaadinIcon.CAMERA.create());
        screenshotBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        screenshotBtn.getStyle()
            .set("background", "#3b82f6")
            .set("color", "#ffffff")
            .set("border-radius", "8px");
        screenshotBtn.addClickListener(e -> {
            takeScreenshot();
        });
        
        Button wipeBtn = new Button("Wipe", VaadinIcon.WARNING.create());
        wipeBtn.addThemeVariants(ButtonVariant.LUMO_ERROR);
        wipeBtn.getStyle()
            .set("background", "#dc2626")
            .set("color", "#ffffff")
            .set("border-radius", "8px");
        wipeBtn.addClickListener(e -> {
            confirmAndWipeDevice();
        });

        header.add(backBtn, title, fixLocationBtn, refreshBtn, lockBtn, screenshotBtn, wipeBtn, deleteBtn);
        return header;
    }

    private void createSimpleMapView(VerticalLayout container) {
        // Check if user is logged in
        if (!authService.isLoggedIn()) {
            createLoginPromptState(container);
            return;
        }
        
        // Get user devices
        List<Device> devices = deviceService.getCurrentUserDevices();
        
        if (devices.isEmpty()) {
            createEmptyMapState(container);
            return;
        }

        // Device selector controls
        selectedDeviceId = devices.get(0).getDeviceId();
        ComboBox<Device> deviceSelect = new ComboBox<>("Select device");
        deviceSelect.setItems(devices);
        deviceSelect.setItemLabelGenerator(d -> d.getDeviceName() != null ? d.getDeviceName() : d.getDeviceId());
        deviceSelect.setValue(devices.get(0));
        deviceSelect.getStyle().set("max-width", "360px");
        deviceSelect.addValueChangeListener(e -> {
            if (e.getValue() != null) {
                selectedDeviceId = e.getValue().getDeviceId();
                Notification.show("Using device: " + (e.getValue().getDeviceName() != null ? e.getValue().getDeviceName() : e.getValue().getDeviceId()), 2000, Notification.Position.TOP_CENTER)
                    .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
            }
        });

        HorizontalLayout controls = new HorizontalLayout(deviceSelect);
        controls.setWidthFull();
        controls.setJustifyContentMode(FlexComponent.JustifyContentMode.START);
        controls.getStyle().set("margin-bottom", "0.5rem");

        // Map title
        H2 mapTitle = new H2("🗺️ Your Devices on the Map");
        mapTitle.getStyle()
            .set("color", "#1f2937")
            .set("text-align", "center")
            .set("margin", "0 0 2rem 0");

        // Real interactive map with Mappls (MapmyIndia)
        Div realMap = new Div();
        realMap.setId("deviceMap");
        realMap.getStyle()
            .set("background", "#f8f9fa")
            .set("border", "1px solid #dee2e6")
            .set("border-radius", "15px")
            .set("height", "500px")
            .set("width", "100%")
            .set("margin-bottom", "2rem");

        // Use Mappls Maps SDK (MapmyIndia) - requires script loading
        UI.getCurrent().getPage().executeJs(
            "const mapplsScript = document.createElement('script');" +
            "mapplsScript.src = 'https://apis.mapmyindia.com/advancedmaps/v1/caaf5c98c5ed09bc55b349b102a999ec/map_load?v=1.5';" +
            "mapplsScript.async = true;" +
            "document.head.appendChild(mapplsScript);"
        );
        
        // Create map with device markers using JavaScript
        createMapplsMap(realMap, devices);

        // Device list
        VerticalLayout devicesList = new VerticalLayout();
        devicesList.setPadding(false);
        devicesList.setSpacing(true);

        for (Device device : devices) {
            devicesList.add(createMapDeviceCard(device));
        }

    container.add(controls, mapTitle, realMap, devicesList);
    }
    
    private void createMapplsMap(Div mapContainer, List<Device> devices) {
        // Build device data for JavaScript
        StringBuilder devicesJson = new StringBuilder("[");
        boolean first = true;
        
        for (Device device : devices) {
            if (device.getLatitude() != null && device.getLongitude() != null) {
                if (!first) devicesJson.append(",");
                first = false;
                
                String safeName = device.getDeviceName() != null ? 
                    device.getDeviceName().replaceAll("[\"'\\\\]", "") : "Unknown";
                boolean isOnline = device.getIsOnline() != null && device.getIsOnline();
                
                devicesJson.append(String.format(
                    "{\"name\":\"%s\",\"lat\":%f,\"lng\":%f,\"online\":%b}",
                    safeName,
                    device.getLatitude(),
                    device.getLongitude(),
                    isOnline
                ));
            }
        }
        devicesJson.append("]");
        
        // Add distance info panel to the map container
        Div distancePanel = new Div();
        distancePanel.setId("distancePanel");
        distancePanel.addClassName("distance-panel");
        distancePanel.getStyle()
            .set("position", "absolute")
            .set("top", "70px")
            .set("right", "10px")
            .set("background", "white")
            .set("padding", "15px")
            .set("border-radius", "8px")
            .set("box-shadow", "0 2px 10px rgba(0,0,0,0.2)")
            .set("z-index", "1000")
            .set("min-width", "250px")
            .set("display", "none");
        
        distancePanel.getElement().setProperty("innerHTML", 
            "<div style='font-weight:bold;margin-bottom:10px;color:#667eea;'>📍 Location Info</div>" +
            "<div id='distanceInfo' style='color:#666;font-size:14px;'>Calculating...</div>");
        
        mapContainer.add(distancePanel);
        
        // JavaScript to create Mappls map with distance, routing and user location
        String mapScript = String.format("""
            (function() {
                var devices = %s;
                var retryCount = 0;
                var maxRetries = 50;
                var userLocation = null;
                var routeLayer = null;
                
                // Haversine formula for distance calculation
                function calculateDistance(lat1, lon1, lat2, lon2) {
                    var R = 6371; // Earth radius in km
                    var dLat = (lat2 - lat1) * Math.PI / 180;
                    var dLon = (lon2 - lon1) * Math.PI / 180;
                    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                }
                
                function updateDistancePanel(device, userLat, userLng) {
                    var distance = calculateDistance(userLat, userLng, device.lat, device.lng);
                    var distanceText = distance < 1 ? 
                        (distance * 1000).toFixed(0) + ' meters' : 
                        distance.toFixed(2) + ' km';
                    
                    var panel = document.getElementById('distancePanel');
                    var info = document.getElementById('distanceInfo');
                    
                    panel.style.display = 'block';
                    info.innerHTML = 
                        '<div style="margin-bottom:8px;"><b>Device:</b> ' + device.name + '</div>' +
                        '<div style="margin-bottom:8px;"><b>Distance:</b> ' + distanceText + '</div>' +
                        '<div style="font-size:12px;color:#999;">Your location: ' + 
                        userLat.toFixed(5) + ', ' + userLng.toFixed(5) + '</div>' +
                        '<div style="font-size:12px;color:#999;">Device location: ' + 
                        device.lat.toFixed(5) + ', ' + device.lng.toFixed(5) + '</div>';
                }
                
                function initMap() {
                    retryCount++;
                    
                    if (typeof MapmyIndia === 'undefined' || typeof L === 'undefined') {
                        if (retryCount < maxRetries) {
                            console.log('Mappls/Leaflet not loaded yet, retrying... (' + retryCount + '/' + maxRetries + ')');
                            setTimeout(initMap, 200);
                        } else {
                            console.error('Failed to load Mappls library after ' + maxRetries + ' attempts');
                            document.getElementById('deviceMap').innerHTML = 
                                '<div style="padding:20px;text-align:center;color:#666;">' +
                                '<h3>Map failed to load</h3>' +
                                '<p>Could not load Mappls Maps SDK</p>' +
                                '</div>';
                        }
                        return;
                    }
                    
                    if (devices.length === 0) {
                        document.getElementById('deviceMap').innerHTML = 
                            '<div style="display:flex;align-items:center;justify-content:center;height:100%%;color:#666;">' +
                            '<h3>No devices with location data</h3></div>';
                        return;
                    }
                    
                    try {
                        var avgLat = devices.reduce(function(sum, d) { return sum + d.lat; }, 0) / devices.length;
                        var avgLng = devices.reduce(function(sum, d) { return sum + d.lng; }, 0) / devices.length;
                        
                        var map = new MapmyIndia.Map('deviceMap', {
                            center: [avgLat, avgLng],
                            zoom: 13,
                            zoomControl: true,
                            location: true
                        });
                        
                        var userMarker = null;
                        
                        // Get user's current location
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                function(position) {
                                    userLocation = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude
                                    };
                                    
                                    // Add user location marker
                                    var userIcon = L.divIcon({
                                        className: 'user-location-marker',
                                        html: '<div style="background:#2196F3;color:white;padding:8px 12px;' +
                                              'border-radius:20px;font-weight:bold;box-shadow:0 2px 10px rgba(33,150,243,0.5);' +
                                              'white-space:nowrap;font-size:13px;">📍 You are here</div>',
                                        iconSize: [null, null],
                                        iconAnchor: [0, 0]
                                    });
                                    
                                    userMarker = L.marker([userLocation.lat, userLocation.lng], {
                                        icon: userIcon,
                                        title: 'Your Location'
                                    }).addTo(map);
                                    
                                    userMarker.bindPopup(
                                        '<div style="padding:8px;">' +
                                        '<b style="font-size:14px;color:#2196F3;">Your Current Location</b><br>' +
                                        '<small style="color:#666;">Lat: ' + userLocation.lat.toFixed(6) + 
                                        ', Lng: ' + userLocation.lng.toFixed(6) + '</small>' +
                                        '</div>'
                                    );
                                    
                                    // Calculate and show distance to nearest device
                                    if (devices.length > 0) {
                                        var nearestDevice = devices[0];
                                        updateDistancePanel(nearestDevice, userLocation.lat, userLocation.lng);
                                        
                                        // Draw line between user and device
                                        var routeLine = L.polyline([
                                            [userLocation.lat, userLocation.lng],
                                            [nearestDevice.lat, nearestDevice.lng]
                                        ], {
                                            color: '#667eea',
                                            weight: 3,
                                            opacity: 0.7,
                                            dashArray: '10, 10'
                                        }).addTo(map);
                                        
                                        // Fit bounds to show both locations
                                        var bounds = L.latLngBounds([
                                            [userLocation.lat, userLocation.lng],
                                            [nearestDevice.lat, nearestDevice.lng]
                                        ]);
                                        map.fitBounds(bounds, { padding: [80, 80] });
                                    }
                                },
                                function(error) {
                                    console.warn('Geolocation error:', error.message);
                                }
                            );
                        }
                        
                        // Add device markers
                        devices.forEach(function(device) {
                            var statusIcon = device.online ? '🟢' : '🔴';
                            var markerColor = device.online ? '#4caf50' : '#f44336';
                            
                            var customIcon = L.divIcon({
                                className: 'custom-device-marker',
                                html: '<div style="background:' + markerColor + 
                                      ';color:white;padding:6px 10px;border-radius:15px;font-weight:bold;' +
                                      'box-shadow:0 2px 8px rgba(0,0,0,0.3);white-space:nowrap;font-size:12px;">' +
                                      statusIcon + ' ' + device.name + '</div>',
                                iconSize: [null, null],
                                iconAnchor: [0, 0]
                            });
                            
                            var marker = L.marker([device.lat, device.lng], {
                                icon: customIcon,
                                title: device.name
                            }).addTo(map);
                            
                            var popupContent = '<div style="padding:8px;">' +
                                '<b style="font-size:14px;">' + device.name + '</b><br>' + 
                                '<span style="color:' + markerColor + ';font-weight:bold;">Status: ' + 
                                (device.online ? 'Online ✓' : 'Offline ✗') + '</span><br>' +
                                '<small style="color:#666;">Lat: ' + device.lat.toFixed(6) + 
                                ', Lng: ' + device.lng.toFixed(6) + '</small><br>' +
                                '<span style="background:' + 
                                (device.locationSource === 'AGENT' ? '#4caf50' : 
                                 device.locationSource === 'BROWSER' ? '#ff9800' : '#2196f3') + 
                                ';color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;margin-right:4px;">' +
                                (device.locationSource === 'AGENT' ? '🤖 Agent GPS' : 
                                 device.locationSource === 'BROWSER' ? '🌐 Browser GPS' : '📍 IP Location') + 
                                '</span>' +
                                '<span style="background:' + 
                                (device.accuracy && device.accuracy <= 10 ? '#4caf50' : 
                                 device.accuracy && device.accuracy <= 50 ? '#ff9800' : '#f44336') + 
                                ';color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">' +
                                (device.accuracy && device.accuracy <= 10 ? '🟢 Excellent (' + device.accuracy.toFixed(0) + 'm)' : 
                                 device.accuracy && device.accuracy <= 50 ? '🟡 Good (' + device.accuracy.toFixed(0) + 'm)' : 
                                 device.accuracy ? '🔴 Poor (' + device.accuracy.toFixed(0) + 'm)' : '⚪ Unknown') + 
                                '</span>';
                            
                            if (userLocation) {
                                var dist = calculateDistance(userLocation.lat, userLocation.lng, device.lat, device.lng);
                                var distText = dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(2) + ' km';
                                popupContent += '<br><b style="color:#667eea;">Distance: ' + distText + '</b>';
                            }
                            
                            popupContent += '</div>';
                            marker.bindPopup(popupContent);
                            
                            // Update distance panel on marker click
                            marker.on('click', function() {
                                if (userLocation) {
                                    updateDistancePanel(device, userLocation.lat, userLocation.lng);
                                }
                            });
                        });
                        
                        console.log('Mappls map loaded successfully with ' + devices.length + ' device(s)');
                        
                    } catch (error) {
                        console.error('Error creating Mappls map:', error);
                        document.getElementById('deviceMap').innerHTML = 
                            '<div style="padding:20px;text-align:center;color:#666;">' +
                            '<h3>Map initialization failed</h3>' +
                            '<p>' + error.message + '</p>' +
                            '</div>';
                    }
                }
                
                setTimeout(initMap, 1000);
            })();
        """, devicesJson.toString());
        
        UI.getCurrent().getPage().executeJs(mapScript);
    }
    
    private void updateDeviceLocationFromBrowser() {
        // Get user's devices
        List<Device> devices = deviceService.getCurrentUserDevices();
        
        if (devices.isEmpty()) {
            Notification.show("No devices found", 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }
        
        // Choose device based on selection, fallback to first
        deviceIdToUpdate = (selectedDeviceId != null && !selectedDeviceId.isBlank())
            ? selectedDeviceId
            : devices.get(0).getDeviceId();
        
        // JavaScript to get browser location and update device
        String updateScript = String.format("""
            (function() {
                if (!navigator.geolocation) {
                    alert('Geolocation is not supported by your browser');
                    return;
                }
                
                const notification = document.createElement('div');
                notification.style.cssText = 'position:fixed;top:20px;left:50%%;transform:translateX(-50%%);' +
                    'background:#2196F3;color:white;padding:15px 30px;border-radius:8px;' +
                    'box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:10000;font-weight:bold;';
                notification.textContent = '📍 Getting your location...';
                document.body.appendChild(notification);
                
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const accuracy = position.coords.accuracy;
                        
                        notification.textContent = 'Location acquired! Updating device...';
                        notification.style.background = '#4caf50';
                        
                        // Send to server
                        fetch('/api/device-location/update?' + new URLSearchParams({
                            deviceId: '%s',
                            latitude: lat.toString(),
                            longitude: lng.toString()
                        }), {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            credentials: 'same-origin'
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                notification.textContent = 'Device location updated! Reloading map...';
                                setTimeout(() => {
                                    location.reload();
                                }, 2000);
                            } else {
                                notification.textContent = 'Error: ' + data.message;
                                notification.style.background = '#f44336';
                                setTimeout(() => notification.remove(), 4000);
                            }
                        })
                        .catch(error => {
                            notification.textContent = 'Error updating location';
                            notification.style.background = '#f44336';
                            setTimeout(() => notification.remove(), 4000);
                        });
                    },
                    function(error) {
                        let errorMsg = '';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                errorMsg = 'Please allow location access';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                errorMsg = 'Location information unavailable';
                                break;
                            case error.TIMEOUT:
                                errorMsg = 'Location request timed out';
                                break;
                            default:
                                errorMsg = 'Unknown error occurred';
                        }
                        notification.textContent = '' + errorMsg;
                        notification.style.background = '#f44336';
                        setTimeout(() => notification.remove(), 4000);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            })();
    """, deviceIdToUpdate);
        
        UI.getCurrent().getPage().executeJs(updateScript);
    }
    
    /**
     * Confirm and delete the current device
     */
    private void confirmAndDeleteDevice() {
        if (deviceIdToUpdate == null) {
            Notification.show("No device selected", 3000, Notification.Position.MIDDLE);
            return;
        }
        
        // Create confirmation dialog
        Dialog confirmDialog = new Dialog();
        confirmDialog.setHeaderTitle("Delete Device");
        
        Div content = new Div();
        content.setText("Are you sure you want to delete this device? This action cannot be undone.");
        content.getStyle()
            .set("padding", "20px")
            .set("text-align", "center");
        
        Button confirmButton = new Button("Delete", VaadinIcon.TRASH.create());
        confirmButton.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_PRIMARY);
        confirmButton.addClickListener(e -> {
            deleteDevice();
            confirmDialog.close();
        });
        
        Button cancelButton = new Button("Cancel", VaadinIcon.CLOSE.create());
        cancelButton.addClickListener(e -> confirmDialog.close());
        
        HorizontalLayout buttons = new HorizontalLayout(cancelButton, confirmButton);
        buttons.setJustifyContentMode(FlexComponent.JustifyContentMode.END);
        buttons.getStyle().set("padding", "10px");
        
        confirmDialog.add(content, buttons);
        confirmDialog.open();
    }
    
    /**
     * Lock the current device remotely
     */
    private void lockDevice() {
        if (selectedDeviceId == null) {
            Notification.show("Please select a device first", 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }
        
        try {
            String userEmail = authService.getLoggedInUser();
            if (userEmail == null) {
                Notification.show("Please login first", 3000, Notification.Position.MIDDLE)
                    .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }
            
            System.out.println("🔒 LOCK BUTTON CLICKED:");
            System.out.println("   Device ID: " + selectedDeviceId);
            System.out.println("   User Email: " + userEmail);
            
            // Call QuickActionsService directly on server-side
            quickActionsService.lockDevice(selectedDeviceId, userEmail).thenAccept(result -> {
                UI.getCurrent().access(() -> {
                    if ((Boolean) result.get("success")) {
                        Notification.show("🔒 Lock command queued! Device will lock within 30 seconds.", 
                            4000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
                        System.out.println("✅ Lock command successful for: " + selectedDeviceId);
                    } else {
                        Notification.show("❌ Lock failed: " + result.get("error"), 
                            4000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_ERROR);
                        System.err.println("❌ Lock failed: " + result.get("error"));
                    }
                });
            }).exceptionally(ex -> {
                UI.getCurrent().access(() -> {
                    Notification.show("❌ Lock error: " + ex.getMessage(), 
                        4000, Notification.Position.TOP_END)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                    System.err.println("❌ Lock exception: " + ex.getMessage());
                });
                return null;
            });
            
        } catch (Exception e) {
            Notification.show("❌ Lock error: " + e.getMessage(), 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            System.err.println("❌ Lock exception in UI: " + e.getMessage());
        }
    }
    
    /**
     * OLD JavaScript-based lock method (replaced with server-side call above)
     */
    private void lockDeviceOld() {
        if (selectedDeviceId == null) {
            return;
        }
        
        try {
            // Call lock endpoint
            String url = "/api/quick-actions/lock/" + selectedDeviceId;
            
            UI.getCurrent().getPage().executeJs(
                "console.log('🔒 Sending lock command to:', $0);" +
                "fetch($0, { method: 'POST', headers: { 'Content-Type': 'application/json' } })" +
                ".then(r => {" +
                "  console.log('Lock response status:', r.status);" +
                "  return r.json();" +
                "})" +
                ".then(data => {" +
                "  console.log('Lock response data:', data);" +
                "  if (data.success) {" +
                "    const n = document.createElement('div');" +
                "    n.textContent = '🔒 Lock command queued! Device will lock within 30 seconds.';" +
                "    n.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "    document.body.appendChild(n);" +
                "    setTimeout(() => n.remove(), 4000);" +
                "  } else {" +
                "    const n = document.createElement('div');" +
                "    n.textContent = '❌ Lock failed: ' + (data.error || 'Unknown error');" +
                "    n.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "    document.body.appendChild(n);" +
                "    setTimeout(() => n.remove(), 4000);" +
                "  }" +
                "})" +
                ".catch(e => {" +
                "  console.error('Lock error:', e);" +
                "  const n = document.createElement('div');" +
                "  n.textContent = '❌ Network error: ' + e.message;" +
                "  n.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "  document.body.appendChild(n);" +
                "  setTimeout(() => n.remove(), 4000);" +
                "});",
                url
            );
            
        } catch (Exception e) {
            Notification.show("Error: " + e.getMessage(), 5000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
        }
    }
    
    /**
     * Take screenshot of the current device
     */
    private void takeScreenshot() {
        if (selectedDeviceId == null) {
            Notification.show("Please select a device first", 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }
        
        try {
            String userEmail = authService.getLoggedInUser();
            if (userEmail == null) {
                Notification.show("Please login first", 3000, Notification.Position.MIDDLE)
                    .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }
            
            System.out.println("📸 SCREENSHOT BUTTON CLICKED:");
            System.out.println("   Device ID: " + selectedDeviceId);
            System.out.println("   User Email: " + userEmail);
            
            // Call QuickActionsService directly on server-side
            quickActionsService.takeScreenshot(selectedDeviceId, userEmail).thenAccept(result -> {
                UI.getCurrent().access(() -> {
                    if ((Boolean) result.get("success")) {
                        Notification.show("📸 Screenshot command queued! Check back in 30 seconds.", 
                            5000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
                        System.out.println("✅ Screenshot command successful for: " + selectedDeviceId);
                    } else {
                        Notification.show("❌ Screenshot failed: " + result.get("error"), 
                            4000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_ERROR);
                        System.err.println("❌ Screenshot failed: " + result.get("error"));
                    }
                });
            }).exceptionally(ex -> {
                UI.getCurrent().access(() -> {
                    Notification.show("❌ Screenshot error: " + ex.getMessage(), 
                        4000, Notification.Position.TOP_END)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                    System.err.println("❌ Screenshot exception: " + ex.getMessage());
                });
                return null;
            });
            
        } catch (Exception e) {
            Notification.show("❌ Screenshot error: " + e.getMessage(), 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            System.err.println("❌ Screenshot exception in UI: " + e.getMessage());
        }
    }
    
    /**
     * OLD JavaScript-based screenshot method (replaced with server-side call above)
     */
    private void takeScreenshotOld() {
        if (selectedDeviceId == null) {
            return;
        }
        
        try {
            // Call screenshot endpoint
            String url = "/api/quick-actions/screenshot/" + selectedDeviceId;
            
            UI.getCurrent().getPage().executeJs(
                "console.log('📸 Sending screenshot command to:', $0);" +
                "fetch($0, { method: 'POST', headers: { 'Content-Type': 'application/json' } })" +
                ".then(r => {" +
                "  console.log('Screenshot response status:', r.status);" +
                "  return r.json();" +
                "})" +
                ".then(data => {" +
                "  console.log('Screenshot response data:', data);" +
                "  if (data.success) {" +
                "    const n = document.createElement('div');" +
                "    n.textContent = '📸 Screenshot command queued! Check back in 30 seconds.';" +
                "    n.style.cssText = 'position:fixed;top:20px;right:20px;background:#3b82f6;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "    document.body.appendChild(n);" +
                "    setTimeout(() => n.remove(), 5000);" +
                "    " +
                "    // Show screenshot viewer after delay" +
                "    setTimeout(() => {" +
                "      fetch('/api/screenshots/list/' + $1)" +
                "      .then(r => r.json())" +
                "      .then(screenshots => {" +
                "        if (screenshots.success && screenshots.screenshots.length > 0) {" +
                "          const latest = screenshots.screenshots[screenshots.screenshots.length - 1];" +
                "          const dialog = document.createElement('div');" +
                "          dialog.innerHTML = `" +
                "            <div style='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:20000;display:flex;align-items:center;justify-content:center;' onclick='this.remove()'>" +
                "              <div style='background:white;padding:20px;border-radius:12px;max-width:90%;max-height:90%;overflow:auto;' onclick='event.stopPropagation()'>" +
                "                <h2 style='margin:0 0 15px 0;'>Latest Screenshot</h2>" +
                "                <img src='${latest.url}' style='max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);'/>" +
                "                <p style='margin:10px 0 0 0;text-align:center;color:#666;'>${new Date(latest.timestamp).toLocaleString()}</p>" +
                "                <button onclick='this.closest(\"div\").parentElement.remove()' style='margin-top:15px;padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;width:100%;'>Close</button>" +
                "              </div>" +
                "            </div>" +
                "          `;" +
                "          document.body.appendChild(dialog);" +
                "        }" +
                "      });" +
                "    }, 32000);" +
                "  } else {" +
                "    const n = document.createElement('div');" +
                "    n.textContent = '❌ Screenshot failed: ' + (data.error || 'Unknown error');" +
                "    n.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "    document.body.appendChild(n);" +
                "    setTimeout(() => n.remove(), 4000);" +
                "  }" +
                "})" +
                ".catch(e => {" +
                "  console.error('Screenshot error:', e);" +
                "  const n = document.createElement('div');" +
                "  n.textContent = '❌ Network error: ' + e.message;" +
                "  n.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:15px 25px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.3);z-index:10000;font-size:16px';" +
                "  document.body.appendChild(n);" +
                "  setTimeout(() => n.remove(), 4000);" +
                "});",
                url, selectedDeviceId
            );
            
        } catch (Exception e) {
            Notification.show("Error: " + e.getMessage(), 5000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
        }
    }
    
    /**
     * Confirm and wipe device (DANGEROUS - requires double confirmation)
     */
    private void confirmAndWipeDevice() {
        if (selectedDeviceId == null) {
            Notification.show("Please select a device first", 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }
        
        // Create first confirmation dialog
        Dialog confirmDialog1 = new Dialog();
        confirmDialog1.setHeaderTitle("🚨 EMERGENCY WIPE WARNING");
        confirmDialog1.setModal(true);
        confirmDialog1.setCloseOnOutsideClick(false);
        confirmDialog1.setCloseOnEsc(false);
        confirmDialog1.setDraggable(false);
        
            // Ensure dialog appears above the map (Map SDK may use huge z-index)
            confirmDialog1.getElement().getStyle()
                .set("z-index", "2147483647")
                .set("--lumo-base-color", "rgba(0, 0, 0, 0.75)");
        
        Div content1 = new Div();
        H3 warning1 = new H3("EXTREME CAUTION ");
        warning1.getStyle().set("color", "#d32f2f").set("margin", "0 0 15px 0");
        
        Paragraph p1 = new Paragraph("This will permanently delete ALL data on the device:");
        Paragraph p2 = new Paragraph("• All files and documents");
        Paragraph p3 = new Paragraph("• All applications and settings");
        Paragraph p4 = new Paragraph("• All personal data");
        Paragraph p5 = new Paragraph("This action CANNOT be undone!");
        p5.getStyle().set("color", "#d32f2f").set("font-weight", "bold").set("margin-top", "15px");
        
        content1.add(warning1, p1, p2, p3, p4, p5);
        content1.getStyle().set("padding", "20px");
        
        Button confirmButton1 = new Button("I Understand - Proceed", VaadinIcon.ARROW_RIGHT.create());
        confirmButton1.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_PRIMARY);
        confirmButton1.addClickListener(e -> {
            confirmDialog1.close();
            showSecondWipeConfirmation();
        });
        
        Button cancelButton1 = new Button("Cancel", VaadinIcon.CLOSE.create());
        cancelButton1.addThemeVariants(ButtonVariant.LUMO_CONTRAST);
        cancelButton1.addClickListener(e -> confirmDialog1.close());
        
        HorizontalLayout buttons1 = new HorizontalLayout(cancelButton1, confirmButton1);
        buttons1.setJustifyContentMode(FlexComponent.JustifyContentMode.END);
        buttons1.getStyle().set("padding", "10px");
        
        confirmDialog1.add(content1, buttons1);
        confirmDialog1.open();
    }
    
    /**
     * Second confirmation for wipe
     */
    private void showSecondWipeConfirmation() {
        Dialog confirmDialog2 = new Dialog();
        confirmDialog2.setHeaderTitle("FINAL CONFIRMATION");
        confirmDialog2.setModal(true);
        confirmDialog2.setCloseOnOutsideClick(false);
        confirmDialog2.setCloseOnEsc(false);
        confirmDialog2.setDraggable(false);
        
        // Fix z-index overlap - ensure dialog is above map
        confirmDialog2.getElement().getStyle()
                .set("z-index", "2147483647")
            .set("--lumo-base-color", "rgba(0, 0, 0, 0.75)");
        
        Div content2 = new Div();
        H3 warning2 = new H3("LAST CHANCE ");
        warning2.getStyle().set("color", "#d32f2f").set("margin", "0 0 20px 0");
        
        Paragraph instruction = new Paragraph("Type WIPE_CONFIRMED to proceed:");
        instruction.getStyle().set("font-size", "16px").set("font-weight", "bold");
        
        content2.add(warning2, instruction);
        content2.getStyle().set("padding", "20px").set("text-align", "center");
        
        com.vaadin.flow.component.textfield.TextField confirmationField = new com.vaadin.flow.component.textfield.TextField();
        confirmationField.setPlaceholder("Type WIPE_CONFIRMED");
        confirmationField.setWidthFull();
        confirmationField.getStyle().set("margin", "0 20px");
        
        Button wipeButton = new Button("WIPE DEVICE NOW", VaadinIcon.WARNING.create());
        wipeButton.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_PRIMARY);
        wipeButton.getStyle().set("background", "#8B0000");
        wipeButton.addClickListener(e -> {
            if ("WIPE_CONFIRMED".equals(confirmationField.getValue())) {
                confirmDialog2.close();
                executeWipe();
            } else {
                Notification.show("Incorrect confirmation code", 3000, Notification.Position.MIDDLE);
            }
        });
        
        Button cancelButton2 = new Button("Cancel", VaadinIcon.CLOSE.create());
        cancelButton2.addThemeVariants(ButtonVariant.LUMO_CONTRAST);
        cancelButton2.addClickListener(e -> confirmDialog2.close());
        
        HorizontalLayout buttons2 = new HorizontalLayout(cancelButton2, wipeButton);
        buttons2.setJustifyContentMode(FlexComponent.JustifyContentMode.END);
        buttons2.getStyle().set("padding", "10px 20px");
        
        confirmDialog2.add(content2, confirmationField, buttons2);
        confirmDialog2.open();
    }
    
    /**
     * Execute the wipe command
     */
    private void executeWipe() {
        if (selectedDeviceId == null) {
            Notification.show("Please select a device first", 3000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            return;
        }
        
        try {
            String userEmail = authService.getLoggedInUser();
            if (userEmail == null) {
                Notification.show("Please login first", 3000, Notification.Position.MIDDLE)
                    .addThemeVariants(NotificationVariant.LUMO_ERROR);
                return;
            }
            
            System.out.println("💣 WIPE BUTTON CLICKED:");
            System.out.println("   Device ID: " + selectedDeviceId);
            System.out.println("   User Email: " + userEmail);
            
            // Call QuickActionsService directly on server-side
            quickActionsService.wipeDevice(selectedDeviceId, userEmail, "WIPE_CONFIRMED").thenAccept(result -> {
                UI.getCurrent().access(() -> {
                    if ((Boolean) result.get("success")) {
                        Notification.show("💣 WIPE command queued! Device will be wiped within 30 seconds.", 
                            5000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_ERROR);
                        System.out.println("✅ Wipe command successful for: " + selectedDeviceId);
                    } else {
                        Notification.show("❌ Wipe failed: " + result.get("error"), 
                            4000, Notification.Position.TOP_END)
                            .addThemeVariants(NotificationVariant.LUMO_ERROR);
                        System.err.println("❌ Wipe failed: " + result.get("error"));
                    }
                });
            }).exceptionally(ex -> {
                UI.getCurrent().access(() -> {
                    Notification.show("❌ Wipe error: " + ex.getMessage(), 
                        4000, Notification.Position.TOP_END)
                        .addThemeVariants(NotificationVariant.LUMO_ERROR);
                    System.err.println("❌ Wipe exception: " + ex.getMessage());
                });
                return null;
            });
            
        } catch (Exception e) {
            Notification.show("❌ Wipe error: " + e.getMessage(), 5000, Notification.Position.MIDDLE)
                .addThemeVariants(NotificationVariant.LUMO_ERROR);
            System.err.println("❌ Wipe exception in UI: " + e.getMessage());
        }
    }
    
    /**
     * Delete the device from the database
     */
    private void deleteDevice() {
        try {
            String userEmail = authService.getLoggedInUser();
            if (userEmail == null) {
                Notification.show("Please login first", 3000, Notification.Position.MIDDLE);
                return;
            }
            
            Device device = deviceService.getDeviceByIdAndUserEmail(deviceIdToUpdate, userEmail);
            if (device == null) {
                Notification.show("Device not found", 3000, Notification.Position.MIDDLE);
                return;
            }
            
            deviceService.deleteDevice(device.getId());
            
            Notification.show("Device deleted successfully!", 3000, Notification.Position.MIDDLE);
            
            // Redirect to dashboard
            UI.getCurrent().navigate("dashboard");
            
        } catch (Exception e) {
            Notification.show("Error deleting device: " + e.getMessage(), 5000, Notification.Position.MIDDLE);
        }
    }
    
    private void createMapComponents(Div mapContainer, List<Device> devices) {
        // Legacy method - kept for compatibility
        // Map background
        mapContainer.getStyle()
            .set("background", "linear-gradient(45deg, #e3f2fd 0%, #bbdefb 100%)")
            .set("position", "relative");
        
        // Map header
        Div mapHeader = new Div();
        mapHeader.getStyle()
            .set("position", "absolute")
            .set("top", "10px")
            .set("left", "10px")
            .set("background", "rgba(255,255,255,0.9)")
            .set("padding", "10px")
            .set("border-radius", "8px")
            .set("z-index", "100");
        
        H4 mapTitle = new H4("🗺️ Live Device Map");
        mapTitle.getStyle().set("margin", "0").set("color", "#1976d2");
        
        Paragraph mapDesc = new Paragraph("Real-time device locations");
        mapDesc.getStyle().set("margin", "5px 0 0 0").set("font-size", "12px").set("color", "#666");
        
        mapHeader.add(mapTitle, mapDesc);
        mapContainer.add(mapHeader);
        
        // Device markers using proper components
        int deviceCount = 0;
        for (Device device : devices) {
            if (device.getLatitude() != null && device.getLongitude() != null) {
                createDeviceMarker(mapContainer, device, deviceCount);
                deviceCount++;
            }
        }
        
        // Show message if no devices with location
        if (deviceCount == 0) {
            Div noDevicesMsg = new Div();
            noDevicesMsg.getStyle()
                .set("position", "absolute")
                .set("top", "50%")
                .set("left", "50%")
                .set("transform", "translate(-50%, -50%)")
                .set("text-align", "center")
                .set("color", "#666");
            noDevicesMsg.add(new H3("No devices with location data"));
            mapContainer.add(noDevicesMsg);
        }
        
        // Map legend
        createMapLegend(mapContainer);
    }
    
    private void createDeviceMarker(Div mapContainer, Device device, int index) {
        // Calculate position (better algorithm than before)
        double x = 50 + (index * 120) % 350; // Spread devices across map
        double y = 80 + (index * 90) % 300;
        
        Div marker = new Div();
        boolean isOnline = device.getIsOnline() != null && device.getIsOnline();
        String status = isOnline ? "🟢" : "🔴";
        String color = isOnline ? "#4caf50" : "#f44336";
        
        marker.getStyle()
            .set("position", "absolute")
            .set("left", x + "px")
            .set("top", y + "px")
            .set("background", color)
            .set("color", "white")
            .set("padding", "8px 12px")
            .set("border-radius", "20px")
            .set("font-size", "12px")
            .set("font-weight", "bold")
            .set("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
            .set("cursor", "pointer");
        
        // Sanitize device name to prevent XSS
        String safeName = device.getDeviceName() != null ? 
            device.getDeviceName().replaceAll("[<>\"'&]", "") : "Unknown";
        
        marker.setText(status + " " + safeName);
        marker.getElement().setAttribute("title", 
            safeName + " - Lat: " + device.getLatitude() + ", Lng: " + device.getLongitude());
        
        mapContainer.add(marker);
    }
    
    private void createMapLegend(Div mapContainer) {
        Div legend = new Div();
        legend.getStyle()
            .set("position", "absolute")
            .set("bottom", "10px")
            .set("right", "10px")
            .set("background", "rgba(255,255,255,0.9)")
            .set("padding", "10px")
            .set("border-radius", "8px");
        
        Div onlineItem = new Div();
        onlineItem.getStyle().set("font-size", "12px").set("margin-bottom", "5px");
        onlineItem.add(new Span("🟢 Online"));
        
        Div offlineItem = new Div();
        offlineItem.getStyle().set("font-size", "12px");
        offlineItem.add(new Span("🔴 Offline"));
        
        legend.add(onlineItem, offlineItem);
        mapContainer.add(legend);
    }

    private void createLoginPromptState(VerticalLayout container) {
        VerticalLayout loginPrompt = new VerticalLayout();
        loginPrompt.setAlignItems(FlexComponent.Alignment.CENTER);
        loginPrompt.setPadding(true);
        loginPrompt.getStyle()
            .set("text-align", "center")
            .set("padding", "4rem 2rem");

        Span icon = new Span("🔐");
        icon.getStyle().set("font-size", "4rem");

        H2 title = new H2("Login Required");
        title.getStyle()
            .set("color", "#1f2937")
            .set("margin", "1rem 0 0.5rem 0");

        Paragraph description = new Paragraph("Please log in to view your device locations on the map");
        description.getStyle()
            .set("color", "#6b7280")
            .set("margin", "0 0 2rem 0");

        Button loginButton = new Button("Login", VaadinIcon.SIGN_IN.create());
        loginButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_LARGE);
        loginButton.getStyle()
            .set("background", "#3b82f6")
            .set("border-radius", "25px");
        loginButton.addClickListener(e -> UI.getCurrent().navigate("login"));

        loginPrompt.add(icon, title, description, loginButton);
        container.add(loginPrompt);
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

        Button addDevice = new Button("Add Device", VaadinIcon.PLUS.create());
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

