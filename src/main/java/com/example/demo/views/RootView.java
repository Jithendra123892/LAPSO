package com.example.demo.views;

import com.example.demo.service.SimpleAuthService;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Paragraph;
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
        
        // Add a small delay to avoid redirect loops
        UI.getCurrent().getPage().executeJs(
            "setTimeout(function() { window.location.href = '/login'; }, 100);"
        );
        
        // Show loading message while redirecting
        add(new H1("LAPSO - Loading..."));
        add(new Paragraph("Redirecting to login..."));
    }
}