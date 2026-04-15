package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.web.bind.annotation.*;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.xi.lt.server.web.application.agent.AgentRegistryService;
import org.xi.lt.server.domain.model.agent.AgentHeartbeatResult;
import org.xi.lt.server.domain.model.agent.AgentInstanceInfo;
import org.xi.lt.server.domain.model.agent.AgentPullConfigResult;
import org.xi.lt.server.web.interfaces.http.api.dto.AgentConfigUpdateRequest;
import org.xi.lt.server.web.interfaces.http.api.dto.AgentInstanceConfigUpdateRequest;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

@RestController
@RequestMapping("/api/agent")
public class AgentControlController {
    @Autowired
    private AgentRegistryService registryService;

    @PostMapping("/register")
    public ApiResult<Void> register(@RequestBody AgentInstanceInfo info) {
        registryService.register(info);
        return ResultHelper.success("success", null);
    }

    @PostMapping("/heartbeat")
    public ApiResult<AgentHeartbeatResult> heartbeat(@RequestBody AgentInstanceInfo info) {
        return ResultHelper.success("success", registryService.heartbeat(info));
    }

    @GetMapping("/config/pull")
    public ApiResult<AgentPullConfigResult> pullConfig(@RequestParam("app") String app, @RequestParam(value = "inst", required = false) String inst) {
        return ResultHelper.success("success", registryService.pullConfig(app, inst));
    }

    @GetMapping("/instances")
    public ApiResult<java.util.List<AgentInstanceInfo>> getInstances() {
        return ResultHelper.success("success", registryService.getInstances());
    }
    
    // For UI to update config
    @PostMapping("/config/update")
    public ApiResult<Void> updateConfig(@RequestBody AgentConfigUpdateRequest payload) {
        registryService.updateConfig(payload);
        return ResultHelper.success("success", null);
    }
    
    // For UI to update instance-level config
    @PostMapping("/config/instance/update")
    public ApiResult<Void> updateInstanceConfig(@RequestBody AgentInstanceConfigUpdateRequest payload) {
        registryService.updateInstanceConfig(payload);
        return ResultHelper.success("success", null);
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadAgentZip() {
        // Assume packages dir is in the working directory root (usually where server is run)
        // Adjust this path logic according to actual deployment structure if needed.
        java.io.File file = new java.io.File("packages/lt-agent.zip");
        if (!file.exists()) {
            // fallback for IDE or different running dir
            file = new java.io.File("../../packages/lt-agent.zip"); 
            if(!file.exists()) {
                file = new java.io.File("/workspace/packages/lt-agent.zip");
            }
        }
        
        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"lt-agent.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
    
    @GetMapping(value = "/install.sh", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<Resource> downloadInstallScript() {
        java.io.File file = new java.io.File("packages/install.sh");
        if (!file.exists()) {
            file = new java.io.File("../../packages/install.sh"); 
            if(!file.exists()) {
                file = new java.io.File("/workspace/packages/install.sh");
            }
        }
        
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok().body(resource);
    }

}
