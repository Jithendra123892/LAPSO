package com.example.demo.config;

import com.example.demo.model.User;
import com.example.demo.repository.DeviceRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// @Component - Disabled for Clean UI
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository, DeviceRepository deviceRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Initialize database if needed
        long userCount = userRepository.count();
        if (userCount == 0) {
            // Create initial admin user
            User adminUser = new User();
            adminUser.setEmail("admin@laptoptracker.com");
            adminUser.setName("Administrator");
            adminUser.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(adminUser);
            
            // Create demo user for testing
            User demoUser = new User();
            demoUser.setEmail("demo@laptoptracker.com");
            demoUser.setName("Demo User");
            demoUser.setPassword(passwordEncoder.encode("demo123"));
            userRepository.save(demoUser);
            
            System.out.println("🔐 Demo Login Credentials Created:");
            System.out.println("📧 Email: demo@laptoptracker.com");
            System.out.println("🔑 Password: demo123");
            System.out.println("👤 Admin Email: admin@laptoptracker.com");
            System.out.println("🔑 Admin Password: admin123");
        }
    }
}