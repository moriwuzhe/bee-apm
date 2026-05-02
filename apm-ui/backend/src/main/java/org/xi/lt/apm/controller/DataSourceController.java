package org.xi.lt.apm.controller;

import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/datasource")
@CrossOrigin(origins = "*")
public class DataSourceController {

    @PostMapping("/switch/{type}")
    public Result<String> switchDataSource(@PathVariable String type) {
        return Result.success("DataSource switching temporarily disabled. Using H2.");
    }

    @GetMapping("/current")
    public Result<String> getCurrentDataSource() {
        return Result.success("h2");
    }

    @GetMapping("/list")
    public Result<Map<String, String>> listDataSources() {
        Map<String, String> datasources = new HashMap<>();
        datasources.put("h2", "H2 In-Memory Database");
        datasources.put("mysql", "MySQL Database");
        datasources.put("postgresql", "PostgreSQL Database");
        return Result.success(datasources);
    }
}
