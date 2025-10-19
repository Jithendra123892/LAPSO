package com.example.demo.views;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.*;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("main")
@AnonymousAllowed
public class MainView extends VerticalLayout {

    public MainView() {
        // Redirect to login page
        UI.getCurrent().getPage().executeJs("window.location.href = '/login';");
        
        // Show loading message
        add(new H1("LAPSO - Redirecting..."));
        add(new Paragraph("Taking you to the login page..."));
    }
}