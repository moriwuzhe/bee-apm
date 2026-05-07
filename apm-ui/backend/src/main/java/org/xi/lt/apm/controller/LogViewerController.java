package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.LogEntryDTO;
import org.xi.lt.apm.service.LogViewerService;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
public class LogViewerController {

    @Autowired
    private LogViewerService logViewerService;

    @GetMapping
    public Result<List<LogEntryDTO>> getLogs(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String level,
        @RequestParam(required = false) String service) {
        return Result.success(logViewerService.getLogs(keyword, level, service));
    }
}