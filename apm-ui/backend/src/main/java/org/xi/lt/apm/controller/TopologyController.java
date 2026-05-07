package org.xi.lt.apm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.dto.TopologyDTO;
import org.xi.lt.apm.service.TopologyService;

@RestController
@RequestMapping("/api/topology")
@CrossOrigin(origins = "*")
public class TopologyController {

    @Autowired
    private TopologyService topologyService;

    @GetMapping
    public Result<TopologyDTO> getTopology() {
        return Result.success(topologyService.getTopologyData());
    }
}