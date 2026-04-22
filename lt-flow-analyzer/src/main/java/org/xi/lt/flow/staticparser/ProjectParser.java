package org.xi.lt.flow.staticparser;

import lombok.extern.slf4j.Slf4j;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;
import org.xi.lt.flow.staticfilter.StaticFilterConfig;

import java.io.*;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * 项目/文件夹/JAR/ZIP 文件解析器
 * 支持解析整个项目文件夹、JAR文件或ZIP文件中的所有Java代码
 */
@Slf4j
public class ProjectParser {

    private final EnhancedJavaCodeParser enhancedParser;
    private final StaticFilterConfig filterConfig;

    public ProjectParser() {
        this(StaticFilterConfig.defaultConfig());
    }

    public ProjectParser(StaticFilterConfig filterConfig) {
        this.filterConfig = filterConfig;
        this.enhancedParser = new EnhancedJavaCodeParser(filterConfig);
    }

    /**
     * 解析项目文件夹
     */
    public FlowGraph parseProjectFolder(File projectFolder) throws IOException {
        log.info("开始解析项目文件夹: {}", projectFolder.getAbsolutePath());

        if (!projectFolder.exists() || !projectFolder.isDirectory()) {
            throw new IllegalArgumentException("不是有效的文件夹: " + projectFolder.getAbsolutePath());
        }

        // 收集所有Java文件
        List<File> javaFiles = collectJavaFiles(projectFolder);
        log.info("找到 {} 个Java文件", javaFiles.size());

        if (javaFiles.isEmpty()) {
            throw new RuntimeException("文件夹中没有找到Java文件");
        }

        // 解析所有Java文件并合并结果
        return parseAndMergeFiles(javaFiles, projectFolder.getName());
    }

    /**
     * 解析ZIP文件
     */
    public FlowGraph parseZipFile(File zipFile) throws IOException {
        log.info("开始解析ZIP文件: {}", zipFile.getAbsolutePath());

        // 解压到临时目录
        Path tempDir = Files.createTempDirectory("project_parse_");
        List<File> javaFiles = new ArrayList<>();

        try {
            unzipFile(zipFile, tempDir.toFile(), javaFiles);
            log.info("从ZIP中找到 {} 个Java文件", javaFiles.size());

            if (javaFiles.isEmpty()) {
                throw new RuntimeException("ZIP文件中没有找到Java文件");
            }

            String projectName = zipFile.getName();
            if (projectName.toLowerCase().endsWith(".zip")) {
                projectName = projectName.substring(0, projectName.length() - 4);
            }

            return parseAndMergeFiles(javaFiles, projectName);
        } finally {
            // 清理临时文件
            deleteDirectory(tempDir.toFile());
        }
    }

    /**
     * 解析JAR文件
     */
    public FlowGraph parseJarFile(File jarFile) throws IOException {
        log.info("开始解析JAR文件: {}", jarFile.getAbsolutePath());

        // 解压到临时目录
        Path tempDir = Files.createTempDirectory("jar_parse_");
        List<File> javaFiles = new ArrayList<>();

        try {
            extractJarSourceFiles(jarFile, tempDir.toFile(), javaFiles);
            log.info("从JAR中找到 {} 个Java源文件", javaFiles.size());

            if (javaFiles.isEmpty()) {
                throw new RuntimeException("JAR文件中没有找到Java源文件（注意：JAR通常只包含编译后的.class文件）");
            }

            String projectName = jarFile.getName();
            if (projectName.toLowerCase().endsWith(".jar")) {
                projectName = projectName.substring(0, projectName.length() - 4);
            }

            return parseAndMergeFiles(javaFiles, projectName);
        } finally {
            // 清理临时文件
            deleteDirectory(tempDir.toFile());
        }
    }

    /**
     * 自动检测文件类型并解析
     */
    public FlowGraph parseFileOrFolder(File file) throws IOException {
        if (file.isDirectory()) {
            return parseProjectFolder(file);
        }

        String fileName = file.getName().toLowerCase();
        if (fileName.endsWith(".zip")) {
            return parseZipFile(file);
        } else if (fileName.endsWith(".jar")) {
            return parseJarFile(file);
        } else if (fileName.endsWith(".java")) {
            return enhancedParser.parseFile(file);
        }

        throw new IllegalArgumentException("不支持的文件类型: " + file.getName());
    }

    /**
     * 收集文件夹中的所有Java文件
     */
    private List<File> collectJavaFiles(File folder) throws IOException {
        List<File> javaFiles = new ArrayList<>();

        Files.walkFileTree(folder.toPath(), new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (file.toString().endsWith(".java")) {
                    javaFiles.add(file.toFile());
                }
                return FileVisitResult.CONTINUE;
            }
        });

        return javaFiles;
    }

    /**
     * 解压ZIP文件并收集Java文件
     */
    private void unzipFile(File zipFile, File destDir, List<File> javaFiles) throws IOException {
        byte[] buffer = new byte[8192];

        try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFile))) {
            ZipEntry entry = zis.getNextEntry();
            while (entry != null) {
                File newFile = newFile(destDir, entry);

                if (entry.isDirectory()) {
                    newFile.mkdirs();
                } else {
                    // 确保父目录存在
                    newFile.getParentFile().mkdirs();

                    try (FileOutputStream fos = new FileOutputStream(newFile)) {
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }

                    if (newFile.getName().endsWith(".java")) {
                        javaFiles.add(newFile);
                    }
                }

                zis.closeEntry();
                entry = zis.getNextEntry();
            }
        }
    }

    /**
     * 从JAR中提取Java源文件
     * 注意：JAR通常只包含.class文件，这里尝试寻找可能的源文件
     */
    private void extractJarSourceFiles(File jarFile, File destDir, List<File> javaFiles) throws IOException {
        byte[] buffer = new byte[8192];

        try (JarFile jar = new JarFile(jarFile)) {
            Enumeration<JarEntry> entries = jar.entries();
            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                String entryName = entry.getName();

                // 只处理Java源文件
                if (!entryName.endsWith(".java") || entry.isDirectory()) {
                    continue;
                }

                // 跳过一些常见的非源代码路径
                if (entryName.startsWith("META-INF/") ||
                    entryName.startsWith("BOOT-INF/") ||
                    entryName.startsWith("WEB-INF/")) {
                    continue;
                }

                File newFile = new File(destDir, entryName);
                newFile.getParentFile().mkdirs();

                try (InputStream is = jar.getInputStream(entry);
                     FileOutputStream fos = new FileOutputStream(newFile)) {
                    int len;
                    while ((len = is.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                }

                javaFiles.add(newFile);
            }
        }
    }

    /**
     * 解析多个Java文件并合并结果
     */
    private FlowGraph parseAndMergeFiles(List<File> javaFiles, String projectName) {
        FlowGraph mergedGraph = FlowGraph.builder()
                .name(projectName)
                .description("从项目 " + projectName + " 生成的流程图，包含 " + javaFiles.size() + " 个文件")
                .build();

        Map<String, FlowNode> nodeMap = new HashMap<>();
        int fileCount = 0;

        for (File javaFile : javaFiles) {
            try {
                FlowGraph graph = enhancedParser.parseFile(javaFile);

                // 合并节点
                for (FlowNode node : graph.getAllNodes()) {
                    if (!nodeMap.containsKey(node.getId())) {
                        nodeMap.put(node.getId(), node);
                        mergedGraph.addNode(node);
                    }
                }

                // 合并边
                for (FlowEdge edge : graph.getEdges()) {
                    // 确保源节点和目标节点都在合并图中
                    FlowNode source = nodeMap.get(edge.getSource().getId());
                    FlowNode target = nodeMap.get(edge.getTarget().getId());
                    if (source != null && target != null) {
                        // 检查边是否已存在
                        boolean edgeExists = mergedGraph.getEdges().stream()
                                .anyMatch(e -> e.getSource().getId().equals(source.getId()) &&
                                             e.getTarget().getId().equals(target.getId()));
                        if (!edgeExists) {
                            FlowEdge newEdge = new FlowEdge();
                            newEdge.setSource(source);
                            newEdge.setTarget(target);
                            newEdge.setCallType(edge.getCallType());
                            newEdge.setCallCount(edge.getCallCount());
                            newEdge.setCondition(edge.getCondition());
                            mergedGraph.addEdge(newEdge);
                        }
                    }
                }

                fileCount++;
                if (fileCount % 10 == 0) {
                    log.info("已解析 {}/{} 个文件", fileCount, javaFiles.size());
                }

            } catch (Exception e) {
                log.warn("解析文件失败: {}, 跳过", javaFile.getName(), e);
            }
        }

        log.info("项目解析完成！总节点数: {}, 总边数: {}, 成功解析文件数: {}/{}",
                mergedGraph.getNodeCount(), mergedGraph.getEdgeCount(), fileCount, javaFiles.size());

        return mergedGraph;
    }

    /**
     * 创建解压文件（安全处理路径遍历）
     */
    private File newFile(File destinationDir, ZipEntry zipEntry) throws IOException {
        File destFile = new File(destinationDir, zipEntry.getName());

        String destDirPath = destinationDir.getCanonicalPath();
        String destFilePath = destFile.getCanonicalPath();

        if (!destFilePath.startsWith(destDirPath + File.separator)) {
            throw new IOException("无效的ZIP条目: " + zipEntry.getName());
        }

        return destFile;
    }

    /**
     * 递归删除目录
     */
    private void deleteDirectory(File directory) {
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
}
