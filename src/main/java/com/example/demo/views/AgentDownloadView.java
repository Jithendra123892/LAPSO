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
        mainContent.setSizeFull();
        mainContent.setPadding(true);
        mainContent.setSpacing(true);
        mainContent.getStyle()
            .set("background", "rgba(255, 255, 255, 0.95)")
            .set("border-radius", "20px 20px 0 0")
            .set("margin", "0")
            .set("flex", "1");

        // Download options
        createDownloadOptions(mainContent);
        
        add(mainContent);
    }

    private Component createHeader() {
        HorizontalLayout header = new HorizontalLayout();
        header.setWidthFull();
        header.setPadding(true);
        header.setSpacing(true);
        header.setAlignItems(FlexComponent.Alignment.CENTER);
        header.getStyle()
            .set("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
            .set("color", "#ffffff")
            .set("padding", "1rem 2rem");

        // Back button
        Button backBtn = new Button("← Dashboard", VaadinIcon.ARROW_LEFT.create());
        backBtn.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        backBtn.getStyle()
            .set("color", "#ffffff")
            .set("border", "1px solid rgba(255, 255, 255, 0.3)")
            .set("border-radius", "20px");
        backBtn.addClickListener(e -> UI.getCurrent().navigate("dashboard"));

        // Title
        H1 title = new H1("📱 Protect Your Device");
        title.getStyle()
            .set("color", "#ffffff")
            .set("font-size", "1.5rem")
            .set("font-weight", "600")
            .set("margin", "0")
            .set("flex", "1");

        header.add(backBtn, title);
        return header;
    }

    private void createDownloadOptions(VerticalLayout container) {
        // Welcome message
        H2 welcomeTitle = new H2("🛡️ Choose Your Device Type");
        welcomeTitle.getStyle()
            .set("color", "#1f2937")
            .set("text-align", "center")
            .set("margin", "0 0 1rem 0");

        Paragraph welcomeDesc = new Paragraph("Download the LAPSO agent to start protecting your device");
        welcomeDesc.getStyle()
            .set("color", "#6b7280")
            .set("text-align", "center")
            .set("margin", "0 0 3rem 0")
            .set("font-size", "1.1rem");

        // Download cards
        HorizontalLayout downloadCards = new HorizontalLayout();
        downloadCards.setWidthFull();
        downloadCards.setSpacing(true);
        downloadCards.setJustifyContentMode(FlexComponent.JustifyContentMode.CENTER);

        downloadCards.add(
            createDownloadCard("💻", "Windows", "For Windows 10/11 laptops", "/agents/windows/lapso-installer.ps1", "#0078d4"),
            createDownloadCard("🍎", "macOS", "For MacBook and iMac", "/agents/macos/lapso-installer.sh", "#007aff"),
            createDownloadCard("🐧", "Linux", "For Ubuntu, Debian, etc.", "/agents/linux/lapso-installer.sh", "#ff6b35")
        );

        // Instructions
        VerticalLayout instructions = new VerticalLayout();
        instructions.setPadding(true);
        instructions.setSpacing(true);
        instructions.getStyle()
            .set("background", "#f8fafc")
            .set("border-radius", "15px")
            .set("border", "1px solid #e2e8f0")
            .set("margin-top", "2rem");

        H3 instructionsTitle = new H3("📋 Quick Setup Instructions");
        instructionsTitle.getStyle()
            .set("color", "#1f2937")
            .set("margin", "0 0 1rem 0");

        VerticalLayout stepsList = new VerticalLayout();
        stepsList.setPadding(false);
        stepsList.setSpacing(true);

        stepsList.add(
            createInstructionStep("1️⃣", "Download", "Click your device type above to download the installer"),
            createInstructionStep("2️⃣", "Install", "Run the downloaded file and follow the prompts"),
            createInstructionStep("3️⃣", "Activate", "The agent will automatically connect to your account"),
            createInstructionStep("4️⃣", "Done!", "Your device is now protected and trackable")
        );

        instructions.add(instructionsTitle, stepsList);

        container.add(welcomeTitle, welcomeDesc, downloadCards, instructions);
    }

    private Component createDownloadCard(String icon, String platform, String description, String downloadUrl, String color) {
        VerticalLayout card = new VerticalLayout();
        card.setPadding(true);
        card.setSpacing(false);
        card.setAlignItems(FlexComponent.Alignment.CENTER);
        card.getStyle()
            .set("background", "#ffffff")
            .set("border-radius", "20px")
            .set("border", "2px solid " + color)
            .set("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.1)")
            .set("flex", "1")
            .set("text-align", "center")
            .set("cursor", "pointer")
            .set("transition", "all 0.3s ease")
            .set("min-height", "200px")
            .set("max-width", "250px")
            .set("justify-content", "center");

        // Hover effect
        card.getElement().addEventListener("mouseenter", e -> {
            card.getStyle()
                .set("box-shadow", "0 8px 25px rgba(0, 0, 0, 0.15)")
                .set("transform", "translateY(-5px)");
        });
        
        card.getElement().addEventListener("mouseleave", e -> {
            card.getStyle()
                .set("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.1)")
                .set("transform", "translateY(0)");
        });

        card.addClickListener(e -> downloadAgent(platform, downloadUrl));

        Span iconSpan = new Span(icon);
        iconSpan.getStyle()
            .set("font-size", "3rem")
            .set("margin-bottom", "1rem");

        H3 titleH3 = new H3(platform);
        titleH3.getStyle()
            .set("color", color)
            .set("font-size", "1.3rem")
            .set("font-weight", "700")
            .set("margin", "0 0 0.5rem 0");

        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.9rem")
            .set("margin", "0 0 1.5rem 0")
            .set("line-height", "1.4");

        Button downloadBtn = new Button("Download", VaadinIcon.DOWNLOAD.create());
        downloadBtn.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
        downloadBtn.getStyle()
            .set("background", color)
            .set("border-radius", "20px")
            .set("font-weight", "600");

        card.add(iconSpan, titleH3, desc, downloadBtn);
        return card;
    }

    private Component createInstructionStep(String number, String title, String description) {
        HorizontalLayout step = new HorizontalLayout();
        step.setAlignItems(FlexComponent.Alignment.CENTER);
        step.setSpacing(true);
        step.getStyle().set("margin-bottom", "0.5rem");

        Span numberSpan = new Span(number);
        numberSpan.getStyle()
            .set("font-size", "1.5rem")
            .set("min-width", "2rem");

        VerticalLayout content = new VerticalLayout();
        content.setPadding(false);
        content.setSpacing(false);

        H4 titleH4 = new H4(title);
        titleH4.getStyle()
            .set("color", "#1f2937")
            .set("font-weight", "600")
            .set("margin", "0 0 0.25rem 0")
            .set("font-size", "1rem");

        Paragraph desc = new Paragraph(description);
        desc.getStyle()
            .set("color", "#6b7280")
            .set("font-size", "0.875rem")
            .set("margin", "0");

        content.add(titleH4, desc);
        step.add(numberSpan, content);
        return step;
    }

    private void downloadAgent(String platform, String downloadUrl) {
        // Trigger download
        UI.getCurrent().getPage().executeJs(
            "const link = document.createElement('a');" +
            "link.href = '" + downloadUrl + "';" +
            "link.download = 'lapso-agent-" + platform.toLowerCase() + "';" +
            "document.body.appendChild(link);" +
            "link.click();" +
            "document.body.removeChild(link);"
        );

        Notification.show(
            "📥 Downloading LAPSO agent for " + platform + "...", 
            3000, 
            Notification.Position.TOP_CENTER
        ).addThemeVariants(NotificationVariant.LUMO_SUCCESS);
    }
}