package org.xi.lt.server.web.interfaces.http.controller.system;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.xi.lt.server.domain.model.plugin.PluginInfo;
import org.xi.lt.server.domain.model.plugin.PluginListResult;
import org.xi.lt.server.web.application.plugin.PluginRegistryService;
import org.xi.lt.server.web.shared.api.ApiResult;
import org.xi.lt.server.web.shared.util.ResultHelper;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;

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

    // 插件存储目录
    private static final String PLUGIN_STORAGE_DIR = "packages/plugins/";

    static {
        // 确保插件存储目录存在
        File dir = new File(PLUGIN_STORAGE_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

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

    /**
     * 上传插件文件
     */
    @PostMapping("/admin/upload")
    public ApiResult<PluginInfo> uploadPlugin(
            @RequestParam("file") MultipartFile file,
            @RequestParam("pluginCode") String pluginCode,
            @RequestParam("pluginName") String pluginName,
            @RequestParam(value = "pluginType", required = false) String pluginType,
            @RequestParam("version") String version,
            @RequestParam(value = "description", required = false) String description) {
        try {
            // 保存文件
            String fileName = file.getOriginalFilename();
            String fileExtension = fileName != null ? fileName.substring(fileName.lastIndexOf(".")) : ".jar";
            String savedFileName = pluginCode + "-" + version + fileExtension;
            Path filePath = Paths.get(PLUGIN_STORAGE_DIR, savedFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 计算 MD5
            String md5 = calculateMD5(filePath);
            long fileSize = Files.size(filePath);

            // 创建插件信息
            PluginInfo pluginInfo = new PluginInfo();
            pluginInfo.setPluginCode(pluginCode);
            pluginInfo.setPluginName(pluginName);
            pluginInfo.setPluginType(pluginType);
            pluginInfo.setVersion(version);
            pluginInfo.setDescription(description);
            pluginInfo.setFileName(savedFileName);
            pluginInfo.setFileSize(fileSize);
            pluginInfo.setFileMd5(md5);
            pluginInfo.setDownloadUrl("/api/plugin/download?pluginCode=" + pluginCode);
            pluginInfo.setEnabled(true);

            pluginRegistryService.registerPlugin(pluginInfo);

            return ResultHelper.success("success", pluginInfo);
        } catch (IOException e) {
            throw new RuntimeException("插件上传失败", e);
        }
    }

    /**
     * 下载插件文件
     */
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadPlugin(@RequestParam("pluginCode") String pluginCode) {
        PluginInfo plugin = pluginRegistryService.getPluginByCode(pluginCode);
        if (plugin == null || plugin.getFileName() == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(PLUGIN_STORAGE_DIR, plugin.getFileName());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + plugin.getFileName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
    
    /**
     * 删除插件（管理后台用）
     */
    @PostMapping("/admin/delete")
    public ApiResult<Void> deletePlugin(@RequestParam("pluginCode") String pluginCode) {
        try {
            // 获取插件信息以删除文件
            PluginInfo plugin = pluginRegistryService.getPluginByCode(pluginCode);
            if (plugin != null && plugin.getFileName() != null) {
                File file = new File(PLUGIN_STORAGE_DIR, plugin.getFileName());
                if (file.exists()) {
                    file.delete();
                }
            }
            
            // 删除数据库记录
            pluginRegistryService.deletePlugin(pluginCode);
            
            return ResultHelper.success("success", null);
        } catch (Exception e) {
            throw new RuntimeException("插件删除失败", e);
        }
    }

    /**
     * 计算文件 MD5
     */
    private String calculateMD5(Path filePath) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] fileBytes = Files.readAllBytes(filePath);
            byte[] hash = md.digest(fileBytes);
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 计算失败", e);
        }
    }
}
