package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import org.springframework.beans.factory.annotation.Autowired;

@Route("")
@AnonymousAllowed
public class RootView extends VerticalLayout {

    @Autowired
    private SimpleAuthService authService;

    public RootView(SimpleAuthService authService) {
        this.authService = authService;
        
        // Check authentication and redirect accordingly
        if (authService.isAuthenticated()) {
            UI.getCurrent().navigate("dashboard");
        } else {
            UI.getCurrent().navigate("login");
        }
    }
}