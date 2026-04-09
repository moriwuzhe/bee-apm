package org.xi.lt.server.web.compat;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;

@Controller
public class SpaErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request) {
        String uri = (String) request.getAttribute("javax.servlet.error.request_uri");
        if (uri != null && (uri.startsWith("/api/") || uri.startsWith("/diag/") || uri.startsWith("/assets/"))) {
            // Let APIs and missing static assets fail
            return "forward:/index.html"; // We could return 404, but just in case, forward to index.html
        }
        // Forward to index.html for SPA routes
        return "forward:/index.html";
    }

}
