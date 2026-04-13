package org.xi.lt.server.web.interfaces.http.diag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.infrastructure.diag.netty.AgentCommandService;
import org.xi.lt.server.infrastructure.diag.netty.AgentConnection;
import org.xi.lt.server.infrastructure.diag.netty.AgentConnectionStore;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

import java.util.List;

@RestController
public class AgentDiagController {
    @Autowired
    private AgentConnectionStore store;

    @Autowired
    private AgentCommandService commandService;

    @GetMapping("/diag/agent/version/detail")
    public ApiResult<List<AgentConnection>> detail() {
        return ResultHelper.success(store.list());
    }

    @GetMapping("/diag/agent/version/search")
    public ApiResult<List<AgentConnection>> search(@RequestParam("agentId") String agentId) {
        return ResultHelper.success(store.search(agentId));
    }

    @GetMapping("/diag/agent/threadDump")
    public ApiResult<String> threadDump(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.threadDump(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jvmInfo")
    public ApiResult<String> jvmInfo(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.jvmInfo(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/gc")
    public ApiResult<String> gc(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.gc(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/sysProps")
    public ApiResult<String> sysProps(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.sysProps(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/env")
    public ApiResult<String> env(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.env(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/inputArgs")
    public ApiResult<String> inputArgs(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.inputArgs(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/classLoading")
    public ApiResult<String> classLoading(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.classLoading(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/memory")
    public ApiResult<String> memory(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.memory(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/gcStats")
    public ApiResult<String> gcStats(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.gcStats(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/threadsSummary")
    public ApiResult<String> threadsSummary(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.threadsSummary(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/deadlocks")
    public ApiResult<String> deadlocks(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.deadlocks(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/topThreadsCpu")
    public ApiResult<String> topThreadsCpu(@RequestParam("agentId") String agentId,
                                          @RequestParam(value = "limit", required = false) Integer limit,
                                          @RequestParam(value = "runnableOnly", required = false) Boolean runnableOnly) {
        try {
            int n = limit == null ? 10 : limit;
            boolean ro = runnableOnly != null && runnableOnly;
            return ResultHelper.success(commandService.topThreadsCpu(agentId, n, ro, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jdwpEnable")
    public ApiResult<String> jdwpEnable(@RequestParam("agentId") String agentId, @RequestParam(value = "port", required = false) Integer port) {
        try {
            int p = port == null ? 5005 : port;
            return ResultHelper.success(commandService.jdwpEnable(agentId, p, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/jdwpStatus")
    public ApiResult<String> jdwpStatus(@RequestParam("agentId") String agentId, @RequestParam(value = "port", required = false) Integer port) {
        try {
            int p = port == null ? 5005 : port;
            return ResultHelper.success(commandService.jdwpStatus(agentId, p, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchAdd")
    public ApiResult<String> watchAdd(@RequestParam("agentId") String agentId,
                                      @RequestParam("className") String className,
                                      @RequestParam("methodName") String methodName,
                                      @RequestParam(value = "paramTypes", required = false) String paramTypes,
                                      @RequestParam(value = "limit", required = false) Integer limit) {
        try {
            int n = limit == null ? 50 : limit;
            if (paramTypes != null && !paramTypes.trim().isEmpty()) {
                return ResultHelper.success(commandService.watchAdd(agentId, className, methodName, paramTypes, n, 8000));
            }
            return ResultHelper.success(commandService.watchAdd(agentId, className, methodName, n, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchDump")
    public ApiResult<String> watchDump(@RequestParam("agentId") String agentId,
                                       @RequestParam("id") String id,
                                       @RequestParam(value = "maxLines", required = false) Integer maxLines) {
        try {
            int n = maxLines == null ? 200 : maxLines;
            return ResultHelper.success(commandService.watchDump(agentId, id, n, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchClear")
    public ApiResult<String> watchClear(@RequestParam("agentId") String agentId, @RequestParam("id") String id) {
        try {
            return ResultHelper.success(commandService.watchClear(agentId, id, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/watchList")
    public ApiResult<String> watchList(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.watchList(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/debugAdd")
    public ApiResult<String> debugAdd(@RequestParam("agentId") String agentId,
                                      @RequestParam("className") String className,
                                      @RequestParam("methodName") String methodName,
                                      @RequestParam("when") String when,
                                      @RequestParam(value = "paramTypes", required = false) String paramTypes,
                                      @RequestParam(value = "limit", required = false) Integer limit,
                                      @RequestParam(value = "stackDepth", required = false) Integer stackDepth,
                                      @RequestParam(value = "contains", required = false) String contains) {
        try {
            int n = limit == null ? 20 : limit;
            int sd = stackDepth == null ? 0 : stackDepth;
            return ResultHelper.success(commandService.debugAdd(agentId, className, methodName, when, paramTypes, n, sd, contains, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/debugDump")
    public ApiResult<String> debugDump(@RequestParam("agentId") String agentId,
                                       @RequestParam("id") String id,
                                       @RequestParam(value = "maxLines", required = false) Integer maxLines) {
        try {
            int n = maxLines == null ? 200 : maxLines;
            return ResultHelper.success(commandService.debugDump(agentId, id, n, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/debugClear")
    public ApiResult<String> debugClear(@RequestParam("agentId") String agentId, @RequestParam("id") String id) {
        try {
            return ResultHelper.success(commandService.debugClear(agentId, id, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/debugList")
    public ApiResult<String> debugList(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.debugList(agentId, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/startProfiler")
    public ApiResult<String> startProfiler(@RequestParam("agentId") String agentId,
                                           @RequestParam(value = "event", defaultValue = "cpu") String event,
                                           @RequestParam(value = "duration", defaultValue = "30") Integer duration) {
        try {
            return ResultHelper.success(commandService.startProfiler(agentId, event, duration, 8000));
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }

    @GetMapping("/diag/agent/stopProfiler")
    public ApiResult<String> stopProfiler(@RequestParam("agentId") String agentId) {
        try {
            return ResultHelper.success(commandService.stopProfiler(agentId, 30000)); // stop might take longer to dump file
        } catch (Exception e) {
            return ResultHelper.fail(e.getMessage());
        }
    }
}
