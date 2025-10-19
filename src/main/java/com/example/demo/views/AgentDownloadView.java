package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
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

@Route("download-agent")
@PageTitle("Download LAPSO Agent - Start Tracking")
@AnonymousAllowed
public class AgentDownloadView extends VerticalLayout {

    @Autowired
    private SimpleAuthService authService;

    public AgentDownloadView(SimpleAuthService authService) {
        this.authService = authService;
        
        // Check authentication
        if (!authService.isAuthenticated()) {
            UI.getCurrent().navigate("login");
            return;
        }
        
        createDownloadInterface();
    }

    private void createDownloadInterface() {
        setSizeFull();
        setPadding(false);
        setSpacing(false);
        
        // Header
        add(createHeader());
        
        // Main content
        VerticalLayout mainContent = new VerticalLayout();
        mainContent.setPadding(true);
        mainContent.setSpacing(true);
        mainContent.getStyle()
            .set("max-width", "1000px")
            .set("margin", "0 auto")
            .set("width", "100%");
        
        // Step-by-step guide
        mainContent.add(createStepByStepGuide());
        
        // Download options
        mainContent.add(createDownloadOptions());
        
        // Installation instructions
        mainContent.add(createInstallationInstructions());
        
        // Troubleshooting
        mainContent.add(createTroubleshooting());
        
        add(mainContent);
    }
    
    private Component createHeader() {
        VerticalLayout header = new VerticalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(false);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("color", "#ffffff")
            .set("text-align", "center")
            .set("padding", "3rem 1rem");

        // Back button
        Button backBtn = new Button("← Back to Dashboard", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.getStyle().set("color", "#ffffff");
        backBtn.addClickListener(e -> UI.getCurrent().navigate(""));
        
        H1 title = new H1("📱 Download LAPSO Agent");
        title.getStyle()
            .set("color", "#ffffff")
            .set("font-size", "2.5rem")
            .set("font-weight", "300")
            .set("margin", "1rem 0 0.5rem 0")
            .set("text-shadow", "0 2px 4px rgba(0,0,0,0.3)");
        
        Paragraph subtitle = new Paragraph("Install the agent on your laptop to start real-time tracking");
        subtitle.getStyle()
            .set("color", "rgba(255, 255, 255, 0.9)")
            .set("font-size", "1.2rem")
            .set("margin", "0 0 2rem 0")
            .set("font-weight", "400");
        
        HorizontalLayout headerTop = new HorizontalLayout();
        headerTop.setWidthFull();
        headerTop.add(backBtn);
        headerTop.setJustifyContentMode(FlexComponent.JustifyContentMode.START);
        
        header.add(headerTop, title, subtitle);
        return header;
    }
    
    private Component createStepByStepGuide() {
        VerticalLayout guide = new VerticalLayout();
        guide.setPadding(true);
        guide.setSpacing(true);
        guide.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("box-shadow", "0 4px 15px rgba(0,0,0,0.1)")
            .set("margin-bottom", "2rem");
        
        H2 guideTitle = new H2("🚀 Quick Setup Guide");
        guideTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1.5rem 0")
            .set("text-align", "center");
        
        HorizontalLayout steps = new HorizontalLayout();
        steps.setWidthFull();
        steps.setSpacing(true);
        steps.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);
        
        steps.add(
            createStep("1", "📥", "Download", "Choose your operating system and download the agent"),
            createStep("2", "⚙️", "Install", "Run the installer and follow the setup wizard"),
            createStep("3", "🔐", "Login", "Enter your LAPSO credentials to connect"),
            createStep("4", "📍", "Track", "Your device will appear on the dashboard immediately")
        );
        
        guide.add(guideTitle, steps);
        return guide;
    }
    
    private Component createStep(String number, String icon, String title, String description) {
        VerticalLayout step = new VerticalLayout();
        step.setPadding(true);
        step.setSpacing(false);
        step.setAlignItems(FlexComponent.Alignment.CENTER);
        step.getStyle()
            .set("background", "#f9fafb")
            .set("border-radius", "10px")
            .set("border", "2px solid #e5e7eb")
            .set("text-align", "center")
            .set("flex", "1")
            .set("min-width", "200px")
            .set("transition", "all 0.3s ease");
        
        // Step number
        Span stepNumber = new Span(number);
        stepNumber.getStyle()
            .set("background", "#667eea")
            .set("color", "#ffffff")
            .set("width", "30px")
            .set("height", "30px")
            .set("border-radius", "50%")
            .set("display", "flex")
            .set("align-items", "center")
            .set("justify-content", "center")
            .set("font-weight", "600")
            .set("margin-bottom", "1rem");
        
        // Icon
        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "2rem")
            .set("margin-bottom", "0.5rem");
        
        // Title
        H4 titleH4 = new H4(title);
        titleH4.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 0.5rem 0")
            .set("font-size", "1.1rem");
        
        // Description
        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.9rem")
            .set("margin", "0")
            .set("line-height", "1.4");
        
        step.add(stepNumber, iconSpan, titleH4, desc);
        return step;
    }
    
    private Component createDownloadOptions() {
        VerticalLayout downloadSection = new VerticalLayout();
        downloadSection.setPadding(true);
        downloadSection.setSpacing(true);
        downloadSection.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("box-shadow", "0 4px 15px rgba(0,0,0,0.1)")
            .set("margin-bottom", "2rem");
        
        H2 sectionTitle = new H2("💻 Choose Your Operating System");
        sectionTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1.5rem 0")
            .set("text-align", "center");
        
        HorizontalLayout downloadOptions = new HorizontalLayout();
        downloadOptions.setWidthFull();
        downloadOptions.setSpacing(true);
        downloadOptions.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);
        
        // Windows
        downloadOptions.add(createDownloadCard(
            "🪟", "Windows", "Windows 10/11", 
            "lapso-windows-installer.exe", "/agents/windows/lapso-installer.ps1",
            "Most popular choice"
        ));
        
        // macOS
        downloadOptions.add(createDownloadCard(
            "🍎", "macOS", "macOS 10.15+", 
            "lapso-macos-installer.pkg", "/agents/macos/lapso-installer.sh",
            "For Mac users"
        ));
        
        // Linux
        downloadOptions.add(createDownloadCard(
            "🐧", "Linux", "Ubuntu/Debian/CentOS", 
            "lapso-linux-installer.deb", "/agents/linux/lapso-installer.sh",
            "For Linux enthusiasts"
        ));
        
        downloadSection.add(sectionTitle, downloadOptions);
        return downloadSection;
    }
    
    private Component createDownloadCard(String icon, String os, String version, String filename, String downloadUrl, String note) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(true);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#f9fafb")
            .set("border-radius", "15px")
            .set("border", "2px solid #e5e7eb")
            .set("text-align", "center")
            .set("flex", "1")
            .set("min-width", "250px")
            .set("transition", "all 0.3s ease")
            .set("cursor", "pointer");
        
        // Hover effect
        card.getElement().addEventListener("mouseenter", e -> {
            card.getStyle()
                .set("border-color", "#667eea")
                .set("transform", "translateY(-5px)")
                .set("box-shadow", "0 8px 25px rgba(0,0,0,0.15)");
        });
        
        card.getElement().addEventListener("mouseleave", e -> {
            card.getStyle()
                .set("border-color", "#e5e7eb")
                .set("transform", "translateY(0)")
                .set("box-shadow", "none");
        });
        
        // Icon
        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "3rem")
            .set("margin-bottom", "1rem");
        
        // OS name
        H3 osName = new H3(os);
        osName.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 0.5rem 0")
            .set("font-size", "1.3rem");
        
        // Version
        Span versionSpan = new Span(version);
        versionSpan.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.9rem")
            .set("margin-bottom", "1rem");
        
        // Download button
        Button downloadBtn = new Button("📥 Download " + filename, VaadinIcon.DOWNLOAD.create());
        downloadBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY, ButtonVariant.LUMO_LARGE);
        downloadBtn.getStyle()
            .set("background", "#667eea")
            .set("border-radius", "10px")
            .set("margin-bottom", "0.5rem");
        
        downloadBtn.addClickListener(e -> {
            // Trigger download
            UI.getCurrent().getPage().open(downloadUrl, "_blank");
            Notification.show("📥 Download started for " + os + "!", 3000, Notification.Position.TOP_CENTER)
                .addThemeVariants(NotificationVariant.LUMO_SUCCESS);
        });
        
        // Note
        Span noteSpan = new Span(note);
        noteSpan.getStyle()
            .set("color", "#10b981")
            .set("font-size", "0.8rem")
            .set("font-weight", "500");
        
        card.add(iconSpan, osName, versionSpan, downloadBtn, noteSpan);
        return card;
    }
    
    private Component createInstallationInstructions() {
        VerticalLayout instructions = new VerticalLayout();
        instructions.setPadding(true);
        instructions.setSpacing(true);
        instructions.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("box-shadow", "0 4px 15px rgba(0,0,0,0.1)")
            .set("margin-bottom", "2rem");
        
        H2 instructionsTitle = new H2("📋 Installation Instructions");
        instructionsTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1.5rem 0")
            .set("text-align", "center");
        
        // Windows instructions
        VerticalLayout windowsInstructions = createOSInstructions("🪟 Windows Installation", new String[]{
            "1. Download the Windows installer (lapso-windows-installer.exe)",
            "2. Right-click the installer and select 'Run as administrator'",
            "3. Follow the installation wizard",
            "4. Enter your LAPSO email and password when prompted",
            "5. The agent will start automatically and appear in your system tray",
            "6. Your device will show up on the dashboard within 30 seconds"
        });
        
        // macOS instructions
        VerticalLayout macInstructions = createOSInstructions("🍎 macOS Installation", new String[]{
            "1. Download the macOS installer (lapso-macos-installer.pkg)",
            "2. Double-click the installer package",
            "3. Follow the installation wizard (you may need to allow in Security & Privacy)",
            "4. Open Terminal and run: sudo lapso-agent --setup",
            "5. Enter your LAPSO credentials",
            "6. The agent will start and your device will appear on the dashboard"
        });
        
        // Linux instructions
        VerticalLayout linuxInstructions = createOSInstructions("🐧 Linux Installation", new String[]{
            "1. Download the Linux installer (lapso-linux-installer.deb)",
            "2. Install: sudo dpkg -i lapso-linux-installer.deb",
            "3. Configure: sudo lapso-agent --configure",
            "4. Enter your LAPSO credentials",
            "5. Start service: sudo systemctl start lapso-agent",
            "6. Enable auto-start: sudo systemctl enable lapso-agent"
        });
        
        instructions.add(instructionsTitle, windowsInstructions, macInstructions, linuxInstructions);
        return instructions;
    }
    
    private VerticalLayout createOSInstructions(String title, String[] steps) {
        VerticalLayout osInstructions = new VerticalLayout();
        osInstructions.setPadding(true);
        osInstructions.setSpacing(true);
        osInstructions.getStyle()
            .set("background", "#f9fafb")
            .set("border-radius", "10px")
            .set("border", "1px solid #e5e7eb")
            .set("margin-bottom", "1rem");
        
        H4 osTitle = new H4(title);
        osTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1rem 0");
        
        VerticalLayout stepsList = new VerticalLayout();
        stepsList.setPadding(false);
        stepsList.setSpacing(false);
        
        for (String step : steps) {
            Paragraph stepP = new Paragraph(step);
            stepP.getStyle()
                .set("color", "#374151")
                .set("margin", "0.25rem 0")
                .set("font-size", "0.95rem")
                .set("line-height", "1.5");
            stepsList.add(stepP);
        }
        
        osInstructions.add(osTitle, stepsList);
        return osInstructions;
    }
    
    private Component createTroubleshooting() {
        VerticalLayout troubleshooting = new VerticalLayout();
        troubleshooting.setPadding(true);
        troubleshooting.setSpacing(true);
        troubleshooting.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "15px")
            .set("box-shadow", "0 4px 15px rgba(0,0,0,0.1)");
        
        H2 troubleshootingTitle = new H2("🛠️ Troubleshooting");
        troubleshootingTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1.5rem 0")
            .set("text-align", "center");
        
        HorizontalLayout troubleshootingCards = new HorizontalLayout();
        troubleshootingCards.setWidthFull();
        troubleshootingCards.setSpacing(true);
        
        troubleshootingCards.add(
            createTroubleshootingCard("🔒", "Permission Issues", 
                "Run installer as administrator (Windows) or use sudo (Mac/Linux)"),
            createTroubleshootingCard("🌐", "Connection Problems", 
                "Check firewall settings and ensure port 8080 is accessible"),
            createTroubleshootingCard("📍", "Location Not Working", 
                "Enable location services in your system settings"),
            createTroubleshootingCard("🆘", "Need Help?", 
                "Contact support or check the documentation for more help")
        );
        
        troubleshooting.add(troubleshootingTitle, troubleshootingCards);
        return troubleshooting;
    }
    
    private Component createTroubleshootingCard(String icon, String title, String description) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#fef3c7")
            .set("border-radius", "10px")
            .set("border", "1px solid #fbbf24")
            .set("text-align", "center")
            .set("flex", "1")
            .set("min-width", "200px");
        
        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "2rem")
            .set("margin-bottom", "0.5rem");
        
        H5 titleH5 = new H5(title);
        titleH5.getStyle()
            .set("color", "#92400e")
            .set("margin", "0 0 0.5rem 0")
            .set("font-size", "1rem");
        
        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#78350f")
            .set("font-size", "0.85rem")
            .set("margin", "0")
            .set("line-height", "1.4");
        
        card.add(iconSpan, titleH5, desc);
        return card;
    }
}