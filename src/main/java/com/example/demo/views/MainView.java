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
        // Redirect to clean dashboard
        UI.getCurrent().navigate("");
    }
}