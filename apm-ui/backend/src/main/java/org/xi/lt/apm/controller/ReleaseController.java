package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.ReleaseDTO;
import org.xi.lt.apm.entity.Release;
import org.xi.lt.apm.service.ReleaseService;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/releases")
@CrossOrigin(origins = "*")
public class ReleaseController {

    @Autowired
    private ReleaseService releaseService;

    @GetMapping
    public Result<List<ReleaseDTO>> getAll() {
        return Result.success(releaseService.findAllDTO());
    }

    @GetMapping("/{id}")
    public Result<ReleaseDTO> getById(@PathVariable Long id) {
        Optional<ReleaseDTO> release = releaseService.findByIdDTO(id);
        return release.map(Result::success).orElseGet(() -> Result.error("Release not found"));
    }

    @GetMapping("/app/{appName}")
    public Result<List<ReleaseDTO>> getByAppName(@PathVariable String appName) {
        return Result.success(releaseService.findByAppNameDTO(appName));
    }

    @PostMapping
    public Result<ReleaseDTO> create(@RequestBody ReleaseDTO releaseDTO) {
        Release release = toEntity(releaseDTO);
        Release saved = releaseService.save(release);
        return Result.success(toDTO(saved));
    }

    @PutMapping("/{id}")
    public Result<ReleaseDTO> update(@PathVariable Long id, @RequestBody ReleaseDTO releaseDTO) {
        Optional<Release> existing = releaseService.findById(id);
        if (!existing.isPresent()) {
            return Result.error("Release not found");
        }
        
        Release release = existing.get();
        updateEntity(release, releaseDTO);
        release.setId(id);
        Release saved = releaseService.save(release);
        return Result.success(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        releaseService.deleteById(id);
        return Result.success();
    }

    private Release toEntity(ReleaseDTO dto) {
        Release release = new Release();
        updateEntity(release, dto);
        return release;
    }

    private void updateEntity(Release release, ReleaseDTO dto) {
        if (dto.getAppName() != null) {
            release.setAppName(dto.getAppName());
        }
        if (dto.getVersion() != null) {
            release.setVersion(dto.getVersion());
        }
        if (dto.getPrevVersion() != null) {
            release.setPrevVersion(dto.getPrevVersion());
        }
        if (dto.getEnv() != null) {
            release.setEnv(dto.getEnv());
        }
        if (dto.getStatus() != null) {
            release.setStatus(dto.getStatus());
        }
        if (dto.getOperator() != null) {
            release.setOperator(dto.getOperator());
        }
        if (dto.getChanges() != null) {
            release.setChanges(String.join("\n", dto.getChanges()));
        }
        if (dto.getImpact() != null) {
            if (dto.getImpact().getServices() != null) {
                release.setImpactServices(dto.getImpact().getServices());
            }
            if (dto.getImpact().getApis() != null) {
                release.setImpactApis(dto.getImpact().getApis());
            }
            if (dto.getImpact().getInstances() != null) {
                release.setImpactInstances(dto.getImpact().getInstances());
            }
        }
        if (dto.getAlerts() != null) {
            release.setAlertsCount(dto.getAlerts());
        }
    }

    private ReleaseDTO toDTO(Release release) {
        List<String> changes = Arrays.asList("");
        if (release.getChanges() != null && !release.getChanges().isEmpty()) {
            changes = Arrays.asList(release.getChanges().split("\n"));
        }

        return new ReleaseDTO(
            release.getId(),
            release.getAppName(),
            release.getVersion(),
            release.getPrevVersion(),
            release.getEnv(),
            release.getStatus(),
            release.getOperator(),
            changes,
            release.getImpactServices() != null ? release.getImpactServices() : 0,
            release.getImpactApis() != null ? release.getImpactApis() : 0,
            release.getImpactInstances() != null ? release.getImpactInstances() : 0,
            release.getAlertsCount() != null ? release.getAlertsCount() : 0,
            release.getCreatedAt() != null ? release.getCreatedAt().toString() : ""
        );
    }
}
