package com.example.demo.repository;

import com.example.demo.model.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationHistoryRepository extends JpaRepository<LocationHistory, Long> {
    List<LocationHistory> findByDeviceDeviceId(String deviceId);
}
