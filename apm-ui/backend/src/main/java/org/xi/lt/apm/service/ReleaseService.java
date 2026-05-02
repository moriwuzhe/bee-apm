package org.xi.lt.apm.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.apm.dto.ReleaseDTO;
import org.xi.lt.apm.entity.Release;
import org.xi.lt.apm.repository.ReleaseRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReleaseService {

    @Autowired
    private ReleaseRepository releaseRepository;

    public List<Release> findAll() {
        return releaseRepository.findAll();
    }

    public List<ReleaseDTO> findAllDTO() {
        return releaseRepository.findAll().stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Optional<Release> findById(Long id) {
        return releaseRepository.findById(id);
    }

    public Optional<ReleaseDTO> findByIdDTO(Long id) {
        return releaseRepository.findById(id).map(this::toDTO);
    }

    public List<Release> findByAppName(String appName) {
        return releaseRepository.findByAppName(appName);
    }

    public List<ReleaseDTO> findByAppNameDTO(String appName) {
        return releaseRepository.findByAppName(appName).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public Release save(Release release) {
        return releaseRepository.save(release);
    }

    public void deleteById(Long id) {
        releaseRepository.deleteById(id);
    }

    private ReleaseDTO toDTO(Release release) {
        return new ReleaseDTO(
            release.getId(),
            release.getAppName(),
            release.getVersion(),
            release.getPrevVersion(),
            release.getEnv(),
            release.getStatus(),
            release.getOperator(),
            release.getChanges(),
            release.getImpactServices(),
            release.getImpactApis(),
            release.getImpactInstances(),
            release.getAlertsCount(),
            release.getCreatedAt() != null ? release.getCreatedAt().toString() : ""
        );
    }
}
