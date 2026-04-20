package org.xi.lt.flow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 本地源码服务
 * 支持 Agent 扫描和拉取本地项目源码
 */
@Slf4j
@Service
public class LocalSourceService {

    @Value("${flow.local.source.dir:./local-sources}")
    private String localSourceDir;

    @Value("${flow.work.dir:.}")
    private String workDir;

    /**
     * 获取工作目录下的项目列表
     */
    public List<ProjectInfo> listProjects() throws IOException {
        Path workPath = Paths.get(workDir).toAbsolutePath().normalize();
        List<ProjectInfo> projects = new ArrayList<>();

        if (!Files.exists(workPath)) {
            return projects;
        }

        File[] dirs = workPath.toFile().listFiles(File::isDirectory);
        if (dirs == null) {
            return projects;
        }

        for (File dir : dirs) {
            // 跳过隐藏目录和系统目录
            if (dir.getName().startsWith(".") || dir.getName().equals("target") || dir.getName().equals("node_modules")) {
                continue;
            }

            ProjectInfo project = scanProject(dir);
            if (project != null) {
                projects.add(project);
            }
        }

        // 检查当前目录本身是否是一个项目
        ProjectInfo currentProject = scanProject(workPath.toFile());
        if (currentProject != null) {
            boolean alreadyExists = projects.stream()
                    .anyMatch(p -> p.getPath().equals(currentProject.getPath()));
            if (!alreadyExists) {
                projects.add(0, currentProject);
            }
        }

        return projects;
    }

    /**
     * 扫描单个目录是否是项目
     */
    private ProjectInfo scanProject(File dir) {
        // 检查是否是 Java 项目（有 pom.xml, build.gradle, src 目录等）
        boolean isJavaProject = hasJavaProjectStructure(dir);
        if (!isJavaProject) {
            return null;
        }

        // 统计 Java 文件数量
        int javaFileCount = countJavaFiles(dir);

        return ProjectInfo.builder()
                .id(UUID.nameUUIDFromBytes(dir.getAbsolutePath().getBytes()).toString())
                .name(dir.getName())
                .path(dir.getAbsolutePath())
                .isJavaProject(true)
                .javaFileCount(javaFileCount)
                .hasPomXml(new File(dir, "pom.xml").exists())
                .hasGradle(new File(dir, "build.gradle").exists() || new File(dir, "build.gradle.kts").exists())
                .hasGit(new File(dir, ".git").exists())
                .build();
    }

    /**
     * 检查目录是否有 Java 项目结构
     */
    private boolean hasJavaProjectStructure(File dir) {
        // 有 pom.xml 或 build.gradle
        if (new File(dir, "pom.xml").exists()) {
            return true;
        }
        if (new File(dir, "build.gradle").exists() || new File(dir, "build.gradle.kts").exists()) {
            return true;
        }

        // 有 src/main/java 目录
        if (new File(dir, "src/main/java").exists()) {
            return true;
        }

        // 或者有 src 目录且包含 Java 文件
        File srcDir = new File(dir, "src");
        if (srcDir.exists() && srcDir.isDirectory()) {
            return countJavaFiles(srcDir) > 0;
        }

        // 或者目录本身包含 Java 文件
        return countJavaFiles(dir, 1) > 0;
    }

    /**
     * 统计 Java 文件数量
     */
    private int countJavaFiles(File dir) {
        return countJavaFiles(dir, Integer.MAX_VALUE);
    }

    private int countJavaFiles(File dir, int maxDepth) {
        if (!dir.exists() || !dir.isDirectory()) {
            return 0;
        }

        try (Stream<Path> paths = Files.walk(dir.toPath(), maxDepth)) {
            return (int) paths
                    .filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".java"))
                    .count();
        } catch (IOException e) {
            log.warn("统计 Java 文件失败: {}", dir, e);
            return 0;
        }
    }

    /**
     * 获取项目的目录结构
     */
    public DirectoryNode getProjectStructure(String projectPath, int maxDepth) throws IOException {
        Path path = Paths.get(projectPath).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new IOException("项目路径不存在: " + projectPath);
        }

        return buildDirectoryTree(path, path, 0, maxDepth);
    }

    /**
     * 构建目录树
     */
    private DirectoryNode buildDirectoryTree(Path rootPath, Path currentPath, int currentDepth, int maxDepth) {
        File file = currentPath.toFile();
        String relativePath = rootPath.relativize(currentPath).toString();

        DirectoryNode node = DirectoryNode.builder()
                .name(file.getName())
                .path(relativePath.isEmpty() ? "." : relativePath)
                .absolutePath(currentPath.toAbsolutePath().toString())
                .isDirectory(file.isDirectory())
                .isJavaFile(file.isFile() && file.getName().endsWith(".java"))
                .build();

        if (file.isDirectory() && currentDepth < maxDepth) {
            File[] children = file.listFiles();
            if (children != null) {
                List<DirectoryNode> childNodes = new ArrayList<>();
                for (File child : children) {
                    // 跳过隐藏文件和目录
                    if (child.getName().startsWith(".")) {
                        continue;
                    }
                    // 跳过一些已知的构建目录
                    if (child.isDirectory() && (child.getName().equals("target") || child.getName().equals("build") || child.getName().equals("node_modules") || child.getName().equals(".git"))) {
                        continue;
                    }
                    childNodes.add(buildDirectoryTree(rootPath, child.toPath(), currentDepth + 1, maxDepth));
                }

                // 排序：目录在前，文件在后；按名称排序
                childNodes.sort(Comparator.comparing(DirectoryNode::isDirectory).reversed()
                        .thenComparing(DirectoryNode::getName));
                node.setChildren(childNodes);
            }
        }

        return node;
    }

    /**
     * 导入项目源码
     */
    public SourceImportResult importProject(String projectPath, List<String> includePatterns, List<String> excludePatterns) throws IOException {
        Path sourcePath = Paths.get(projectPath).toAbsolutePath().normalize();
        if (!Files.exists(sourcePath)) {
            throw new IOException("项目路径不存在: " + projectPath);
        }

        // 生成导入 ID
        String importId = UUID.randomUUID().toString();
        Path importDir = Paths.get(localSourceDir, importId);
        if (!Files.exists(importDir)) {
            Files.createDirectories(importDir);
        }

        List<SourceFile> importedFiles = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(sourcePath)) {
            paths.forEach(path -> {
                if (Files.isRegularFile(path) && path.toString().endsWith(".java")) {
                    try {
                        String relativePath = sourcePath.relativize(path).toString();

                        // 检查是否匹配排除模式
                        if (shouldExclude(relativePath, excludePatterns)) {
                            return;
                        }

                        // 检查是否匹配包含模式
                        if (includePatterns != null && !includePatterns.isEmpty()) {
                            if (!shouldInclude(relativePath, includePatterns)) {
                                return;
                            }
                        }

                        // 复制文件
                        Path destPath = importDir.resolve(relativePath);
                        destPath.getParent().toFile().mkdirs();
                        Files.copy(path, destPath);

                        // 读取内容
                        String content = new String(Files.readAllBytes(path), "UTF-8");

                        importedFiles.add(SourceFile.builder()
                                .path(relativePath)
                                .absolutePath(destPath.toAbsolutePath().toString())
                                .content(content)
                                .size(Files.size(path))
                                .build());

                    } catch (IOException e) {
                        log.warn("导入文件失败: {}", path, e);
                    }
                }
            });
        }

        return SourceImportResult.builder()
                .importId(importId)
                .sourcePath(sourcePath.toAbsolutePath().toString())
                .importPath(importDir.toAbsolutePath().toString())
                .importedFiles(importedFiles)
                .build();
    }

    /**
     * 检查是否应该排除
     */
    private boolean shouldExclude(String path, List<String> excludePatterns) {
        if (excludePatterns == null || excludePatterns.isEmpty()) {
            return false;
        }

        for (String pattern : excludePatterns) {
            if (matchPattern(path, pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否应该包含
     */
    private boolean shouldInclude(String path, List<String> includePatterns) {
        if (includePatterns == null || includePatterns.isEmpty()) {
            return true;
        }

        for (String pattern : includePatterns) {
            if (matchPattern(path, pattern)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 简单的模式匹配
     */
    private boolean matchPattern(String path, String pattern) {
        // 简单的通配符支持
        String regex = pattern.replace(".", "\\.")
                .replace("*", ".*")
                .replace("?", ".");
        return path.matches(regex) || path.contains(pattern);
    }

    /**
     * 读取源码文件内容
     */
    public String readSourceFile(String importId, String relativePath) throws IOException {
        Path sourcePath = Paths.get(localSourceDir).resolve(importId).resolve(relativePath);
        if (!Files.exists(sourcePath)) {
            throw new IOException("文件不存在: " + relativePath);
        }
        return new String(Files.readAllBytes(sourcePath), "UTF-8");
    }

    /**
     * 删除导入的源码
     */
    public void deleteImport(String importId) {
        Path importPath = Paths.get(localSourceDir).resolve(importId);
        deleteDirectory(importPath.toFile());
        log.info("已删除导入的源码: {}", importId);
    }

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

    // ========== 数据模型 ==========

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProjectInfo {
        private String id;
        private String name;
        private String path;
        private boolean isJavaProject;
        private int javaFileCount;
        private boolean hasPomXml;
        private boolean hasGradle;
        private boolean hasGit;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DirectoryNode {
        private String name;
        private String path;
        private String absolutePath;
        private boolean isDirectory;
        private boolean isJavaFile;
        @lombok.Singular
        private List<DirectoryNode> children;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SourceFile {
        private String path;
        private String absolutePath;
        private String content;
        private long size;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SourceImportResult {
        private String importId;
        private String sourcePath;
        private String importPath;
        @lombok.Singular
        private List<SourceFile> importedFiles;

        public int getFileCount() {
            return importedFiles != null ? importedFiles.size() : 0;
        }
    }
}
