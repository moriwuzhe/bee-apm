package org.xi.lt.server.infrastructure.stream;

import org.xi.lt.server.core.common.Stream;
import org.xi.lt.server.core.handler.HandlerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * @author yuan
 * @date 2018/08/27
 */
@Controller
@RequestMapping
public class LtStreamController {
    private static final Logger logger = LoggerFactory.getLogger(LtStreamController.class);

    @RequestMapping("/stream")
    @ResponseBody
    public String stream(@RequestBody String body){
        System.out.println("LtStreamController received: " + body);
        try {
            HandlerFactory.getInstance().executeFirstHandler(new Stream(body));
            return "ok";
        }catch (Exception e){
            System.out.println("LtStreamController exception: " + e.getMessage());
            e.printStackTrace();
            logger.error("",e);
        }
        return "fail";
    }
}
