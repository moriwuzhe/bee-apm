package org.xi.lt.server.web.compat;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaIndexController {
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }
}

