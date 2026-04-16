package org.xi.lt.server.web.interfaces.http.controller.system;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.core.common.Stream;
import org.xi.lt.server.core.handler.HandlerFactory;
import org.xi.lt.server.domain.repository.ApplicationRepository;
import org.xi.lt.server.domain.repository.ProjectRepository;
import org.xi.lt.server.domain.model.config.Application;
import org.xi.lt.server.domain.model.config.Project;

/**
 * 数据流接收控制器
 * 用于接收Agent上报的监控数据
 * 
 * @author yuan
 * @date 2018/08/27
 */
@RestController
@RequestMapping("/api/stream")
public class StreamController {
    
    private static final Logger logger = LoggerFactory.getLogger(StreamController.class);

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ProjectRepository projectRepository;

    /**
     * 验证应用密钥或项目密钥
     * 
     * @param appCode 应用编码
     * @param secretKey 密钥（可以是应用密钥或项目密钥）
     * @return 是否验证通过
     */
    private boolean validateSecretKey(String appCode, String secretKey) {
        if (appCode == null || secretKey == null) {
            return false;
        }

        // 首先尝试用应用密钥验证
        Application application = applicationRepository.findByAppCode(appCode);
        if (application != null && secretKey.equals(application.getAppSecretKey())) {
            return true;
        }

        // 如果应用密钥验证失败，尝试用项目密钥验证
        if (application != null && application.getProjectCode() != null) {
            Project project = projectRepository.findByProjectCode(application.getProjectCode());
            if (project != null && secretKey.equals(project.getSecretKey())) {
                return true;
            }
        }

        return false;
    }

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 从数据中提取应用编码
     */
    private String extractAppCode(String body) {
        try {
            JsonNode json = objectMapper.readTree(body);
            // 尝试从不同的字段名提取 appCode
            if (json.has("app")) {
                return json.get("app").asText();
            }
            if (json.has("appCode")) {
                return json.get("appCode").asText();
            }
            if (json.has("application")) {
                return json.get("application").asText();
            }
        } catch (Exception e) {
            logger.warn("Failed to extract appCode from stream data", e);
        }
        return null;
    }

    /**
     * 接收Agent上报的数据流
     * 
     * @param body 原始数据JSON字符串
     * @param secretKey 密钥（通过请求头传递
     * @return 处理结果
     */
    @PostMapping
    public String receive(@RequestBody String body, @RequestHeader(value = "X-Secret-Key", required = false) String secretKey) {
        logger.debug("Received stream data: {}", body.substring(0, Math.min(100, body.length())));
        
        try {
            // 从数据中提取应用编码
            String appCode = extractAppCode(body);
            
            // 验证密钥（如果有密钥的话）
            if (appCode != null && secretKey != null && !secretKey.isEmpty()) {
                if (!validateSecretKey(appCode, secretKey)) {
                    logger.warn("Invalid secret key for app: {}", appCode);
                    return "fail";
                }
            }
            
            HandlerFactory.getInstance().executeFirstHandler(new Stream(body));
            return "ok";
        } catch (Exception e) {
            logger.error("Failed to process stream data", e);
            return "fail";
        }
    }
}
