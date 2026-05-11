package org.xi.lt.apm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.apm.common.Result;
import org.xi.lt.apm.entity.AgentPlugin;
import org.xi.lt.apm.entity.AgentConfig;
import org.xi.lt.apm.entity.AgentCommand;
import org.xi.lt.apm.service.AgentPluginService;
import org.xi.lt.apm.service.AgentConfigService;
import org.xi.lt.apm.service.AgentCommandService;

import java.util.*;

@RestController
@RequestMapping("/api/agent-management")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class AgentManagementController {

    private static final Logger logger = LoggerFactory.getLogger(AgentManagementController.class);

    @Autowired
    private AgentPluginService pluginService;

    @Autowired
    private AgentConfigService configService;

    @Autowired
    private AgentCommandService commandService;

    // ==================== 插件管理 API ====================

    @GetMapping("/{agentId}/plugins")
    public Result<List<AgentPlugin>> getPlugins(@PathVariable Long agentId) {
        try {
            return Result.success(pluginService.getPluginsByAgentId(agentId));
        } catch (Exception e) {
            logger.error("Failed to get plugins for agent: " + agentId, e);
            return Result.error("Failed to get plugins");
        }
    }

    @PostMapping("/{agentId}/plugins")
    public Result<AgentPlugin> addPlugin(@PathVariable Long agentId, @RequestBody AgentPlugin plugin) {
        try {
            plugin.setAgentId(agentId);
            return Result.success(pluginService.savePlugin(plugin));
        } catch (Exception e) {
            logger.error("Failed to add plugin", e);
            return Result.error("Failed to add plugin");
        }
    }

    @PutMapping("/plugins/{id}")
    public Result<AgentPlugin> updatePlugin(@PathVariable Long id, @RequestBody AgentPlugin plugin) {
        try {
            plugin.setId(id);
            return Result.success(pluginService.savePlugin(plugin));
        } catch (Exception e) {
            logger.error("Failed to update plugin", e);
            return Result.error("Failed to update plugin");
        }
    }

    @PutMapping("/plugins/{id}/enable")
    public Result<AgentPlugin> enablePlugin(@PathVariable Long id) {
        try {
            return Result.success(pluginService.enablePlugin(id));
        } catch (Exception e) {
            logger.error("Failed to enable plugin", e);
            return Result.error("Failed to enable plugin");
        }
    }

    @PutMapping("/plugins/{id}/disable")
    public Result<AgentPlugin> disablePlugin(@PathVariable Long id) {
        try {
            return Result.success(pluginService.disablePlugin(id));
        } catch (Exception e) {
            logger.error("Failed to disable plugin", e);
            return Result.error("Failed to disable plugin");
        }
    }

    @DeleteMapping("/plugins/{id}")
    public Result<Void> deletePlugin(@PathVariable Long id) {
        try {
            pluginService.deletePlugin(id);
            return Result.success();
        } catch (Exception e) {
            logger.error("Failed to delete plugin", e);
            return Result.error("Failed to delete plugin");
        }
    }

    // ==================== 配置管理 API ====================

    @GetMapping("/{agentId}/configs")
    public Result<List<AgentConfig>> getConfigs(@PathVariable Long agentId) {
        try {
            return Result.success(configService.getConfigsByAgentId(agentId));
        } catch (Exception e) {
            logger.error("Failed to get configs for agent: " + agentId, e);
            return Result.error("Failed to get configs");
        }
    }

    @PostMapping("/{agentId}/configs")
    public Result<AgentConfig> addConfig(@PathVariable Long agentId, @RequestBody AgentConfig config) {
        try {
            config.setAgentId(agentId);
            return Result.success(configService.saveConfig(config));
        } catch (Exception e) {
            logger.error("Failed to add config", e);
            return Result.error("Failed to add config");
        }
    }

    @PutMapping("/configs/{id}")
    public Result<AgentConfig> updateConfig(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String value = request.get("value");
            return Result.success(configService.updateConfig(id, value));
        } catch (Exception e) {
            logger.error("Failed to update config", e);
            return Result.error("Failed to update config");
        }
    }

    @PutMapping("/configs/{id}/reset")
    public Result<AgentConfig> resetConfig(@PathVariable Long id) {
        try {
            return Result.success(configService.resetConfig(id));
        } catch (Exception e) {
            logger.error("Failed to reset config", e);
            return Result.error("Failed to reset config");
        }
    }

    @DeleteMapping("/configs/{id}")
    public Result<Void> deleteConfig(@PathVariable Long id) {
        try {
            configService.deleteConfig(id);
            return Result.success();
        } catch (Exception e) {
            logger.error("Failed to delete config", e);
            return Result.error("Failed to delete config");
        }
    }

    // ==================== 命令/控制 API ====================

    @GetMapping("/{agentId}/commands")
    public Result<List<AgentCommand>> getCommands(@PathVariable Long agentId) {
        try {
            return Result.success(commandService.getCommandsByAgentId(agentId));
        } catch (Exception e) {
            logger.error("Failed to get commands for agent: " + agentId, e);
            return Result.error("Failed to get commands");
        }
    }

    @PostMapping("/{agentId}/commands")
    public Result<AgentCommand> sendCommand(@PathVariable Long agentId, @RequestBody Map<String, String> request) {
        try {
            String commandType = request.get("type");
            String commandData = request.get("data");
            return Result.success(commandService.sendCommand(agentId, commandType, commandData));
        } catch (Exception e) {
            logger.error("Failed to send command", e);
            return Result.error("Failed to send command");
        }
    }

    @PostMapping("/{agentId}/restart")
    public Result<AgentCommand> restartAgent(@PathVariable Long agentId) {
        try {
            return Result.success(commandService.sendCommand(agentId, "RESTART", "{}"));
        } catch (Exception e) {
            logger.error("Failed to send restart command", e);
            return Result.error("Failed to send restart command");
        }
    }

    @PostMapping("/{agentId}/hot-reload")
    public Result<AgentCommand> hotReloadAgent(@PathVariable Long agentId) {
        try {
            return Result.success(commandService.sendCommand(agentId, "HOT_RELOAD", "{}"));
        } catch (Exception e) {
            logger.error("Failed to send hot reload command", e);
            return Result.error("Failed to send hot reload command");
        }
    }

    @PostMapping("/{agentId}/upgrade")
    public Result<AgentCommand> upgradeAgent(@PathVariable Long agentId) {
        try {
            return Result.success(commandService.sendCommand(agentId, "UPGRADE", "{}"));
        } catch (Exception e) {
            logger.error("Failed to send upgrade command", e);
            return Result.error("Failed to send upgrade command");
        }
    }

    @PostMapping("/{agentId}/update-config")
    public Result<AgentCommand> updateAgentConfig(@PathVariable Long agentId, @RequestBody Map<String, Object> config) {
        try {
            String configJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(config);
            return Result.success(commandService.sendCommand(agentId, "UPDATE_CONFIG", configJson));
        } catch (Exception e) {
            logger.error("Failed to send update config command", e);
            return Result.error("Failed to send update config command");
        }
    }

    // ==================== 批量操作 API ====================

    @PostMapping("/batch-upgrade")
    public Result<List<AgentCommand>> batchUpgrade(@RequestBody List<Long> agentIds) {
        try {
            List<AgentCommand> commands = new ArrayList<>();
            for (Long agentId : agentIds) {
                commands.add(commandService.sendCommand(agentId, "UPGRADE", "{}"));
            }
            return Result.success(commands);
        } catch (Exception e) {
            logger.error("Failed to perform batch upgrade", e);
            return Result.error("Failed to perform batch upgrade");
        }
    }

    @PostMapping("/batch-reload")
    public Result<List<AgentCommand>> batchHotReload(@RequestBody List<Long> agentIds) {
        try {
            List<AgentCommand> commands = new ArrayList<>();
            for (Long agentId : agentIds) {
                commands.add(commandService.sendCommand(agentId, "HOT_RELOAD", "{}"));
            }
            return Result.success(commands);
        } catch (Exception e) {
            logger.error("Failed to perform batch hot reload", e);
            return Result.error("Failed to perform batch hot reload");
        }
    }

    // ==================== 市场插件 API ====================

    @GetMapping("/market/plugins")
    public Result<List<Map<String, Object>>> getMarketPlugins() {
        try {
            List<Map<String, Object>> plugins = new ArrayList<>();
            
            Map<String, Object> servletPlugin = new HashMap<>();
            servletPlugin.put("name", "servlet");
            servletPlugin.put("desc", "HTTP Servlet 插件，用于监控 HTTP 请求");
            servletPlugin.put("hot", true);
            plugins.add(servletPlugin);
            
            Map<String, Object> jdbcPlugin = new HashMap<>();
            jdbcPlugin.put("name", "jdbc");
            jdbcPlugin.put("desc", "JDBC 插件，用于监控数据库操作");
            jdbcPlugin.put("hot", true);
            plugins.add(jdbcPlugin);
            
            Map<String, Object> processPlugin = new HashMap<>();
            processPlugin.put("name", "process");
            processPlugin.put("desc", "方法调用插件，用于监控方法性能");
            processPlugin.put("hot", false);
            plugins.add(processPlugin);
            
            Map<String, Object> loggerPlugin = new HashMap<>();
            loggerPlugin.put("name", "logger");
            loggerPlugin.put("desc", "日志插件，用于监控日志输出");
            loggerPlugin.put("hot", false);
            plugins.add(loggerPlugin);
            
            Map<String, Object> springTxPlugin = new HashMap<>();
            springTxPlugin.put("name", "spring-tx");
            springTxPlugin.put("desc", "Spring 事务插件，用于监控事务");
            springTxPlugin.put("hot", true);
            plugins.add(springTxPlugin);
            
            return Result.success(plugins);
        } catch (Exception e) {
            logger.error("Failed to get market plugins", e);
            return Result.error("Failed to get market plugins");
        }
    }
}
