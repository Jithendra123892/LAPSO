package com.example.demo.views;

import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

@Route("home")
@AnonymousAllowed
public class HomeRedirectView implements BeforeEnterObserver {
    
    @Override
    public void beforeEnter(BeforeEnterEvent event) {
        event.forwardTo(MainView.class);
    }
}