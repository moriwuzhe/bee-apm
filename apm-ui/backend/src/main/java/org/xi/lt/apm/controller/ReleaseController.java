package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.Release;
import org.xi.lt.apm.service.ReleaseService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/releases")
@CrossOrigin(origins = "*")
public class ReleaseController {

    @Autowired
    private ReleaseService releaseService;

    @GetMapping
    public Result<List<Release>> getAll() {
        return Result.success(releaseService.findAll());
    }

    @GetMapping("/{id}")
    public Result<Release> getById(@PathVariable Long id) {
        Optional<Release> release = releaseService.findById(id);
        return release.map(Result::success).orElseGet(() -> Result.error("Release not found"));
    }

    @GetMapping("/app/{appName}")
    public Result<List<Release>> getByAppName(@PathVariable String appName) {
        return Result.success(releaseService.findByAppName(appName));
    }

    @PostMapping
    public Result<Release> create(@RequestBody Release release) {
        return Result.success(releaseService.save(release));
    }

    @PutMapping("/{id}")
    public Result<Release> update(@PathVariable Long id, @RequestBody Release release) {
        release.setId(id);
        return Result.success(releaseService.save(release));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        releaseService.deleteById(id);
        return Result.success();
    }
}
