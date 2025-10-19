package com.example.demo;

import com.example.demo.client.LaptopTrackerClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class LaptopTrackerApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(LaptopTrackerApplication.class, args);
        
        System.out.println("\n🆓 LAPSO - Free & Open Source Laptop Tracking");
        System.out.println("✨ Simple, Honest, Completely Free - No False Claims");
        System.out.println("🌐 Access LAPSO at: http://localhost:8080");
        System.out.println("🔐 Demo Login: demo@lapso.in / demo123");
        System.out.println("📖 Open Source - MIT License, No hidden costs");
        System.out.println("🏠 Self-hosted - Your data stays with you");
        System.out.println("🎯 Reality: Basic web app for device tracking");
        System.out.println("💡 Better than Microsoft Find My Device: More features, always free");
        
        System.setProperty("java.awt.headless", "false");
    }
    
    @Bean
    public LaptopTrackerClient laptopTrackerClient() {
        return new LaptopTrackerClient();
    }
}