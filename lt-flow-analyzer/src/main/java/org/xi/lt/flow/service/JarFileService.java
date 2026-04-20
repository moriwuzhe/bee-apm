package org.xi.lt.flow.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.compress.archivers.jar.JarArchiveEntry;
import org.apache.commons.compress.archivers.jar.JarArchiveInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

/**
 * JAR 文件服务
 * 支持上传、解压 JAR 文件，并提取其中的源码和 class 文件
 */
@Slf4j
@Service
public class JarFileService {

    @Value("${flow.jar.dir:./jar-files}")
    private String jarDir;

    /**
     * 上传并处理 JAR 文件
     */
    public JarInfo processJarFile(MultipartFile file) throws IOException {
        // 确保 JAR 文件目录存在
        Path jarPath = Paths.get(jarDir);
        if (!Files.exists(jarPath)) {
            Files.createDirectories(jarPath);
        }

        // 生成唯一的 ID
        String jarId = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        Path savedJarPath = jarPath.resolve(jarId + "_" + originalFilename);

        // 保存 JAR 文件
        Files.copy(file.getInputStream(), savedJarPath);
        log.info("JAR 文件已保存: {}", savedJarPath);

        // 解压 JAR 文件
        Path extractDir = jarPath.resolve(jarId + "_extracted");
        if (!Files.exists(extractDir)) {
            Files.createDirectories(extractDir);
        }

        List<JarEntryInfo> entries = extractJar(savedJarPath.toFile(), extractDir.toFile());

        // 分类文件
        List<JarEntryInfo> javaSources = new ArrayList<>();
        List<JarEntryInfo> classFiles = new ArrayList<>();
        List<JarEntryInfo> otherFiles = new ArrayList<>();

        for (JarEntryInfo entry : entries) {
            if (entry.getName().endsWith(".java")) {
                javaSources.add(entry);
            } else if (entry.getName().endsWith(".class")) {
                classFiles.add(entry);
            } else {
                otherFiles.add(entry);
            }
        }

        return JarInfo.builder()
                .jarId(jarId)
                .originalFilename(originalFilename)
                .savedPath(savedJarPath.toAbsolutePath().toString())
                .extractPath(extractDir.toAbsolutePath().toString())
                .javaSources(javaSources)
                .classFiles(classFiles)
                .otherFiles(otherFiles)
                .build();
    }

    /**
     * 解压 JAR 文件
     */
    private List<JarEntryInfo> extractJar(File jarFile, File extractDir) throws IOException {
        List<JarEntryInfo> entries = new ArrayList<>();

        try (JarFile jar = new JarFile(jarFile)) {
            Enumeration<JarEntry> enumEntries = jar.entries();

            while (enumEntries.hasMoreElements()) {
                JarEntry entry = enumEntries.nextElement();
                File destFile = new File(extractDir, entry.getName());

                if (entry.isDirectory()) {
                    destFile.mkdirs();
                } else {
                    // 确保父目录存在
                    destFile.getParentFile().mkdirs();

                    // 复制文件
                    try (InputStream is = jar.getInputStream(entry);
                         FileOutputStream fos = new FileOutputStream(destFile)) {
                        byte[] buffer = new byte[4096];
                        int bytesRead;
                        while ((bytesRead = is.read(buffer)) != -1) {
                            fos.write(buffer, 0, bytesRead);
                        }
                    }

                    entries.add(JarEntryInfo.builder()
                            .name(entry.getName())
                            .size(entry.getSize())
                            .compressedSize(entry.getCompressedSize())
                            .isDirectory(entry.isDirectory())
                            .lastModifiedTime(entry.getLastModifiedTime() != null ? entry.getLastModifiedTime().toMillis() : 0)
                            .absolutePath(destFile.getAbsolutePath())
                            .build());
                }
            }
        }

        log.info("JAR 文件解压完成，共 {} 个条目", entries.size());
        return entries;
    }

    /**
     * 读取 JAR 中的 Java 源码文件内容
     */
    public String readJavaSource(String jarId, String entryPath) throws IOException {
        Path extractPath = Paths.get(jarDir).resolve(jarId + "_extracted");
        Path sourcePath = extractPath.resolve(entryPath);

        if (!Files.exists(sourcePath)) {
            throw new FileNotFoundException("源码文件不存在: " + entryPath);
        }

        return new String(Files.readAllBytes(sourcePath), "UTF-8");
    }

    /**
     * 获取 JAR 中的所有 Java 源码
     */
    public List<JavaFileContent> getAllJavaSources(String jarId) throws IOException {
        Path extractPath = Paths.get(jarDir).resolve(jarId + "_extracted");
        if (!Files.exists(extractPath)) {
            throw new FileNotFoundException("JAR 解压目录不存在: " + jarId);
        }

        List<JavaFileContent> sources = new ArrayList<>();
        collectJavaSources(extractPath.toFile(), extractPath.toFile(), sources);
        return sources;
    }

    private void collectJavaSources(File rootDir, File currentDir, List<JavaFileContent> result) throws IOException {
        File[] files = currentDir.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                collectJavaSources(rootDir, file, result);
            } else if (file.getName().endsWith(".java")) {
                String relativePath = rootDir.toPath().relativize(file.toPath()).toString();
                String content = new String(Files.readAllBytes(file.toPath()), "UTF-8");
                result.add(JavaFileContent.builder()
                        .path(relativePath)
                        .content(content)
                        .build());
            }
        }
    }

    /**
     * 删除 JAR 文件及解压内容
     */
    public void deleteJar(String jarId) {
        Path jarPath = Paths.get(jarDir);
        Path extractDir = jarPath.resolve(jarId + "_extracted");
        Path savedJar = jarPath.resolve(jarId + "_");

        // 删除解压目录
        deleteDirectory(extractDir.toFile());

        // 查找并删除 JAR 文件
        try {
            Files.list(jarPath)
                    .filter(p -> p.getFileName().toString().startsWith(jarId + "_"))
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException e) {
                            log.warn("删除文件失败: {}", p, e);
                        }
                    });
        } catch (IOException e) {
            log.warn("删除 JAR 文件失败", e);
        }

        log.info("JAR 文件已删除: {}", jarId);
    }

    /**
     * 递归删除目录
     */
    private void deleteDirectory(File directory) {
        if (!directory.exists()) {
            return;
        }

        File[] files = directory.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        directory.delete();
    }

    /**
     * JAR 文件信息
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class JarInfo {
        private String jarId;
        private String originalFilename;
        private String savedPath;
        private String extractPath;
        private List<JarEntryInfo> javaSources;
        private List<JarEntryInfo> classFiles;
        private List<JarEntryInfo> otherFiles;

        public int getJavaSourceCount() {
            return javaSources != null ? javaSources.size() : 0;
        }

        public int getClassFileCount() {
            return classFiles != null ? classFiles.size() : 0;
        }
    }

    /**
     * JAR 条目信息
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class JarEntryInfo {
        private String name;
        private long size;
        private long compressedSize;
        private boolean isDirectory;
        private long lastModifiedTime;
        private String absolutePath;
    }

    /**
     * Java 文件内容
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class JavaFileContent {
        private String path;
        private String content;
    }
}
