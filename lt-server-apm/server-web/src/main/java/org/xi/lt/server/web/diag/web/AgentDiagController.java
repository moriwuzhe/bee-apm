package org.xi.lt.server.web.diag.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.web.diag.netty.AgentCommandService;
import org.xi.lt.server.web.diag.netty.AgentConnection;
import org.xi.lt.server.web.diag.netty.AgentConnectionStore;

import java.util.Map;

@RestController
public class AgentDiagController {
    @Autowired
    private AgentConnectionStore store;

    @Autowired
    private AgentCommandService commandService;

    @GetMapping("/diag/agent/version/detail")
    public ApiResult<Map<String, AgentConnection>> detail() {
        return ApiResult.ok(store.list());
    }

    @GetMapping("/diag/agent/version/search")
    public ApiResult<Map<String, AgentConnection>> search(@RequestParam("agentId") String agentId) {
        return ApiResult.ok(store.search(agentId));
    }

    @GetMapping("/diag/agent/threadDump")
    public ApiResult<String> threadDump(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.threadDump(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jvmInfo")
    public ApiResult<String> jvmInfo(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.jvmInfo(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/gc")
    public ApiResult<String> gc(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.gc(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/sysProps")
    public ApiResult<String> sysProps(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.sysProps(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/env")
    public ApiResult<String> env(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.env(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/inputArgs")
    public ApiResult<String> inputArgs(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.inputArgs(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/classLoading")
    public ApiResult<String> classLoading(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.classLoading(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/memory")
    public ApiResult<String> memory(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.memory(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/gcStats")
    public ApiResult<String> gcStats(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.gcStats(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/threadsSummary")
    public ApiResult<String> threadsSummary(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.threadsSummary(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/deadlocks")
    public ApiResult<String> deadlocks(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.deadlocks(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/topThreadsCpu")
    public ApiResult<String> topThreadsCpu(@RequestParam("agentId") String agentId,
                                          @RequestParam(value = "limit", required = false) Integer limit,
                                          @RequestParam(value = "runnableOnly", required = false) Boolean runnableOnly) {
        try {
            int n = limit == null ? 10 : limit;
            boolean ro = runnableOnly != null && runnableOnly;
            return ApiResult.ok(commandService.topThreadsCpu(agentId, n, ro, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jdwpEnable")
    public ApiResult<String> jdwpEnable(@RequestParam("agentId") String agentId, @RequestParam(value = "port", required = false) Integer port) {
        try {
            int p = port == null ? 5005 : port;
            return ApiResult.ok(commandService.jdwpEnable(agentId, p, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jdwpStatus")
    public ApiResult<String> jdwpStatus(@RequestParam("agentId") String agentId, @RequestParam(value = "port", required = false) Integer port) {
        try {
            int p = port == null ? 5005 : port;
            return ApiResult.ok(commandService.jdwpStatus(agentId, p, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchAdd")
    public ApiResult<String> watchAdd(@RequestParam("agentId") String agentId,
                                      @RequestParam("className") String className,
                                      @RequestParam("methodName") String methodName,
                                      @RequestParam(value = "limit", required = false) Integer limit) {
        try {
            int n = limit == null ? 50 : limit;
            return ApiResult.ok(commandService.watchAdd(agentId, className, methodName, n, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchDump")
    public ApiResult<String> watchDump(@RequestParam("agentId") String agentId,
                                       @RequestParam("id") String id,
                                       @RequestParam(value = "maxLines", required = false) Integer maxLines) {
        try {
            int n = maxLines == null ? 200 : maxLines;
            return ApiResult.ok(commandService.watchDump(agentId, id, n, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchClear")
    public ApiResult<String> watchClear(@RequestParam("agentId") String agentId, @RequestParam("id") String id) {
        try {
            return ApiResult.ok(commandService.watchClear(agentId, id, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchList")
    public ApiResult<String> watchList(@RequestParam("agentId") String agentId) {
        try {
            return ApiResult.ok(commandService.watchList(agentId, 8000));
        } catch (Exception e) {
            return ApiResult.fail(e.getMessage());
        }
    }
}
