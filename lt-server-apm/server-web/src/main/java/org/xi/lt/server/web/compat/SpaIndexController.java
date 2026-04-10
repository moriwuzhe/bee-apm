package org.xi.lt.server.web.compat;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import javax.servlet.http.HttpServletRequest;

@Controller
public class SpaIndexController {
    
    @GetMapping(value = {"/ui/{path:[^\\.]*}", "/{path:[^\\.]*}", "/**/{path:[^\\.]*}"})
    public String redirect(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri != null && (uri.startsWith("/api/") || uri.startsWith("/diag/") || uri.startsWith("/diag-api/"))) {
            return null; // Don't intercept API calls, let them 404 naturally
        }
        return "forward:/index.html";
    }
}

