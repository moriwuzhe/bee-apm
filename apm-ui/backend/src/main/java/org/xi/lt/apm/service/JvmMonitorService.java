package org.xi.lt.apm.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class JvmMonitorService {

    public Map<String, Object> getHostMetrics(String appName) {
        Random random = new Random();
        Map<String, Object> metrics = new HashMap<>();

        metrics.put("cpuUsage", 40 + random.nextDouble() * 50);
        metrics.put("memUsage", 50 + random.nextDouble() * 30);
        metrics.put("diskIO", 20 + random.nextDouble() * 60);
        metrics.put("network", 50 + random.nextDouble() * 200);

        return metrics;
    }

    public List<Map<String, Object>> getHeapMemData() {
        List<Map<String, Object>> data = new ArrayList<>();
        String[] times = {"10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55", "11:00"};

        Random random = new Random();
        for (String time : times) {
            Map<String, Object> item = new HashMap<>();
            item.put("t", time);
            item.put("heap", 50 + random.nextDouble() * 30);
            item.put("nonheap", 20 + random.nextDouble() * 10);
            data.add(item);
        }

        return data;
    }

    public List<Map<String, Object>> getThreadData() {
        List<Map<String, Object>> data = new ArrayList<>();
        String[] times = {"10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55", "11:00"};

        Random random = new Random();
        for (String time : times) {
            Map<String, Object> item = new HashMap<>();
            item.put("t", time);
            item.put("live", 150 + random.nextInt(100));
            item.put("daemon", 100 + random.nextInt(50));
            item.put("peak", 200 + random.nextInt(50));
            data.add(item);
        }

        return data;
    }

    public List<Map<String, Object>> getGcData() {
        List<Map<String, Object>> data = new ArrayList<>();
        String[] times = {"10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55", "11:00"};

        Random random = new Random();
        for (String time : times) {
            Map<String, Object> item = new HashMap<>();
            item.put("t", time);
            item.put("ygc", random.nextInt(10));
            item.put("fgc", random.nextInt(2));
            data.add(item);
        }

        return data;
    }

    public List<Map<String, Object>> getNetworkData() {
        List<Map<String, Object>> data = new ArrayList<>();
        String[] times = {"10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55", "11:00"};

        Random random = new Random();
        for (String time : times) {
            Map<String, Object> item = new HashMap<>();
            item.put("t", time);
            item.put("rx", 50 + random.nextDouble() * 150);
            item.put("tx", 20 + random.nextDouble() * 80);
            data.add(item);
        }

        return data;
    }

    public Map<String, Object> getClassLoadingStats() {
        Random random = new Random();
        Map<String, Object> stats = new HashMap<>();

        stats.put("loaded", 12458);
        stats.put("unloaded", 234);
        stats.put("compiled", 45123);
        stats.put("compileTime", 18.4);

        return stats;
    }

    public List<String> getApplications() {
        return Arrays.asList("order-service", "payment-gateway", "user-service", "inventory-service");
    }
}
