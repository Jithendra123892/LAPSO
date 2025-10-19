package com.example.demo.config;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;

@PWA(
    name = "LaptopTracker Pro",
    shortName = "LaptopTracker",
    description = "Professional laptop tracking and management system"
)
public class AppShell implements AppShellConfigurator {
    // This class configures the app shell for Vaadin
    // Theme temporarily disabled to resolve build issues
}
