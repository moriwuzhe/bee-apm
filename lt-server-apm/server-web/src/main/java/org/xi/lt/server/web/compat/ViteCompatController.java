package org.xi.lt.server.web.compat;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViteCompatController {
    @GetMapping(value = "/@vite/client", produces = "text/javascript")
    public ResponseEntity<String> viteClient() {
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/javascript"))
                .header("Cache-Control", "no-store")
                .body("");
    }
}

