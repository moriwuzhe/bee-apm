package org.xi.lt.server.web.interfaces.http.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.xi.lt.server.core.common.Stream;
import org.xi.lt.server.core.handler.HandlerFactory;

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

    /**
     * 接收Agent上报的数据流
     * 
     * @param body 原始数据JSON字符串
     * @return 处理结果
     */
    @PostMapping
    public String receive(@RequestBody String body) {
        logger.debug("Received stream data: {}", body.substring(0, Math.min(100, body.length())));
        
        try {
            HandlerFactory.getInstance().executeFirstHandler(new Stream(body));
            return "ok";
        } catch (Exception e) {
            logger.error("Failed to process stream data", e);
            return "fail";
        }
    }
}
