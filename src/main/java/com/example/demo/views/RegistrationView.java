package com.example.demo.views;

import com.example.demo.service.UserService;
import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.formlayout.FormLayout;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.EmailField;
import com.vaadin.flow.component.textfield.PasswordField;
import com.vaadin.flow.component.textfield.TextField;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import org.springframework.beans.factory.annotation.Autowired;

@Route("register")
@PageTitle("Register | Laptop Tracker")
@AnonymousAllowed
public class RegistrationView extends VerticalLayout {

    private final UserService userService;

    @Autowired
    public RegistrationView(UserService userService) {
        this.userService = userService;

        setSizeFull();
        setAlignItems(Alignment.CENTER);
        setJustifyContentMode(JustifyContentMode.CENTER);

        H1 title = new H1("Create an Account");

        TextField nameField = new TextField("Name");
        EmailField emailField = new EmailField("Email");
        PasswordField passwordField = new PasswordField("Password");
        PasswordField confirmPasswordField = new PasswordField("Confirm Password");

        Button registerButton = new Button("Register", event -> {
            if (!passwordField.getValue().equals(confirmPasswordField.getValue())) {
                Notification.show("Passwords do not match.", 3000, Notification.Position.MIDDLE);
                return;
            }

            try {
                userService.registerManualUser(emailField.getValue(), nameField.getValue(), passwordField.getValue());
                Notification.show("Registration successful! You can now log in.", 5000, Notification.Position.MIDDLE);
                UI.getCurrent().navigate("login");
            } catch (Exception e) {
                Notification.show("Registration failed: " + e.getMessage(), 5000, Notification.Position.MIDDLE);
            }
        });
        registerButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY);

        FormLayout formLayout = new FormLayout(title, nameField, emailField, passwordField, confirmPasswordField, registerButton);
        formLayout.setMaxWidth("500px");
        formLayout.getStyle().set("margin", "0 auto");

        add(formLayout);
    }
}
