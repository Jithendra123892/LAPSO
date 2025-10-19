package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class LoginController {
    
    @PostMapping("/perform_login")
    public String performLogin() {
        // Redirect any form submissions to the main dashboard
        return "redirect:/";
    }
    
    @RequestMapping("/perform_login")
    public String handleLoginRequest() {
        // Handle any login requests
        return "redirect:/";
    }
}