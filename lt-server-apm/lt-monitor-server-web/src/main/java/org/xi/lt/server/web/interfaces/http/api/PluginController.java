package org.xi.lt.server.web.interfaces.http.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.server.domain.model.plugin.PluginInfo;
import org.xi.lt.server.domain.model.plugin.PluginListResult;
import org.xi.lt.server.web.application.plugin.PluginRegistryService;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

import java.util.List;

/**
 * 插件管理控制器
 * 
 * @author system
 * @date 2026/04/16
 */
@RestController
@RequestMapping("/api/plugin")
public class PluginController {

    @Autowired
    private PluginRegistryService pluginRegistryService;

    /**
     * 获取所有启用的插件列表（Agent 拉取用）
     */
    @GetMapping("/list")
    public ApiResult<PluginListResult> listEnabledPlugins() {
        List<PluginInfo> plugins = pluginRegistryService.getAllEnabledPlugins();
        PluginListResult result = new PluginListResult();
        result.setPlugins(plugins);
        result.setLastUpdateTime(System.currentTimeMillis());
        return ResultHelper.success("success", result);
    }

    /**
     * 获取所有插件列表（管理后台用）
     */
    @GetMapping("/admin/list")
    public ApiResult<List<PluginInfo>> listAllPlugins() {
        List<PluginInfo> plugins = pluginRegistryService.getAllPlugins();
        return ResultHelper.success("success", plugins);
    }

    /**
     * 根据插件编码获取插件详情
     */
    @GetMapping("/info")
    public ApiResult<PluginInfo> getPluginInfo(@RequestParam("pluginCode") String pluginCode) {
        PluginInfo plugin = pluginRegistryService.getPluginByCode(pluginCode);
        return ResultHelper.success("success", plugin);
    }

    /**
     * 注册或更新插件（管理后台用）
     */
    @PostMapping("/admin/register")
    public ApiResult<Void> registerPlugin(@RequestBody PluginInfo pluginInfo) {
        pluginRegistryService.registerPlugin(pluginInfo);
        return ResultHelper.success("success", null);
    }

    /**
     * 更新插件信息（管理后台用）
     */
    @PostMapping("/admin/update")
    public ApiResult<Void> updatePlugin(@RequestBody PluginInfo pluginInfo) {
        pluginRegistryService.updatePlugin(pluginInfo);
        return ResultHelper.success("success", null);
    }
}
