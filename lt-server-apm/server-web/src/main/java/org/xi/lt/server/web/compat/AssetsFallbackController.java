package org.xi.lt.server.web.compat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
public class AssetsFallbackController {
    @Value("${spring.web.resources.static-locations:}")
    private String staticLocations;

    @GetMapping("/assets/{fileName:.+}")
    public ResponseEntity<byte[]> assets(@PathVariable("fileName") String fileName) {
        try {
            Path assetsDir = resolveAssetsDir();
            if (assetsDir == null) return ResponseEntity.notFound().build();

            Path requested = assetsDir.resolve(fileName).normalize();
            if (Files.exists(requested) && Files.isRegularFile(requested)) {
                return okFile(requested, fileName);
            }

            String lower = fileName.toLowerCase();
            if (lower.startsWith("index-") && lower.endsWith(".js")) {
                Path pick = pickLatest(assetsDir, "index-", ".js");
                if (pick != null) return okFile(pick, pick.getFileName().toString());
            }
            if (lower.startsWith("index-") && lower.endsWith(".css")) {
                Path pick = pickLatest(assetsDir, "index-", ".css");
                if (pick != null) return okFile(pick, pick.getFileName().toString());
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private ResponseEntity<byte[]> okFile(Path p, String name) throws Exception {
        byte[] data = Files.readAllBytes(p);
        MediaType mt = mediaType(name);
        return ResponseEntity.ok()
                .contentType(mt)
                .header("Cache-Control", "no-store")
                .body(data);
    }

    private MediaType mediaType(String name) {
        String lower = name == null ? "" : name.toLowerCase();
        if (lower.endsWith(".css")) return MediaType.valueOf("text/css");
        if (lower.endsWith(".js")) return MediaType.valueOf("text/javascript");
        if (lower.endsWith(".svg")) return MediaType.valueOf("image/svg+xml");
        if (lower.endsWith(".png")) return MediaType.valueOf("image/png");
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.valueOf("image/jpeg");
        if (lower.endsWith(".gif")) return MediaType.valueOf("image/gif");
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private Path pickLatest(Path assetsDir, String prefix, String suffix) {
        try (Stream<Path> s = Files.list(assetsDir)) {
            List<Path> list = s
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String n = p.getFileName().toString().toLowerCase();
                        return n.startsWith(prefix) && n.endsWith(suffix);
                    })
                    .sorted(Comparator.comparingLong((Path p) -> p.toFile().lastModified()).reversed())
                    .collect(Collectors.toList());
            if (list.isEmpty()) return null;
            return list.get(0);
        } catch (Exception e) {
            return null;
        }
    }

    private Path resolveAssetsDir() {
        if (staticLocations == null || staticLocations.trim().isEmpty()) return null;
        String[] parts = staticLocations.split(",");
        for (String raw : parts) {
            String loc = raw == null ? "" : raw.trim();
            if (!loc.startsWith("file:")) continue;
            String p = loc.substring("file:".length());
            if (p.startsWith("//")) p = p.substring(2);
            p = p.replace("/", "\\");
            if (!p.endsWith("\\") && !p.endsWith("/")) p = p + "\\";
            Path base = Paths.get(p).normalize();
            Path assets = base.resolve("assets");
            if (Files.exists(assets) && Files.isDirectory(assets)) return assets;
        }
        return null;
    }
}

