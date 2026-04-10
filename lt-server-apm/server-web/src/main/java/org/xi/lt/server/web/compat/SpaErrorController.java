package org.xi.lt.server.web.compat;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Controller
public class SpaErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, HttpServletResponse response) {
        String uri = (String) request.getAttribute("javax.servlet.error.request_uri");
        if (uri != null && (uri.startsWith("/api/") || uri.startsWith("/diag/") || uri.startsWith("/assets/") || uri.startsWith("/diag-api/"))) {
            // Let APIs and missing static assets fail
            return null; // Return default error page / JSON for API
        }
        
        Object status = request.getAttribute("javax.servlet.error.status_code");
        if (status != null && Integer.valueOf(status.toString()) == 404) {
            // Forward to index.html for SPA routes and reset status to 200
            response.setStatus(200);
            return "forward:/index.html";
        }
        return null;
    }

}
