package org.xi.lt.server.web.interfaces.http.diag;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;

@Controller
public class DiagApiAliasController {
    @RequestMapping("/diag-api/**")
    public String forward(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return "forward:/";
        if (!uri.startsWith("/diag-api")) return "forward:" + uri;
        String target = uri.substring("/diag-api".length());
        if (target.isEmpty()) target = "/";
        return "forward:" + target;
    }
}

