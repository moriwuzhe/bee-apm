package org.xi.lt.flow.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.CloneCommand;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.transport.CredentialsProvider;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Git 仓库服务
 * 支持克隆、拉取 Git 仓库，并提取 Java 源码
 */
@Slf4j
@Service
public class GitRepositoryService {

    @Value("${flow.git.repos.dir:./git-repos}")
    private String gitReposDir;

    /**
     * 克隆 Git 仓库
     */
    public GitRepository cloneRepository(String repoUrl, String branch, String username, String password) throws GitAPIException, IOException {
        // 确保仓库目录存在
        Path reposPath = Paths.get(gitReposDir);
        if (!Files.exists(reposPath)) {
            Files.createDirectories(reposPath);
        }

        // 生成唯一的目录名
        String repoId = UUID.randomUUID().toString();
        Path repoPath = reposPath.resolve(repoId);

        log.info("正在克隆 Git 仓库: {} 到 {}", repoUrl, repoPath);

        // 配置克隆命令
        CloneCommand cloneCommand = Git.cloneRepository()
                .setURI(repoUrl)
                .setDirectory(repoPath.toFile())
                .setCloneAllBranches(false);

        // 如果指定了分支，只克隆该分支
        if (branch != null && !branch.isEmpty()) {
            cloneCommand.setBranch(branch);
        }

        // 如果提供了认证信息
        if (username != null && !username.isEmpty() && password != null) {
            CredentialsProvider credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
            cloneCommand.setCredentialsProvider(credentialsProvider);
        }

        // 执行克隆
        try (Git git = cloneCommand.call()) {
            String currentBranch = git.getRepository().getBranch();
            log.info("Git 仓库克隆成功！当前分支: {}", currentBranch);

            // 收集 Java 文件
            List<File> javaFiles = findJavaFiles(repoPath.toFile());

            return GitRepository.builder()
                    .repoId(repoId)
                    .repoUrl(repoUrl)
                    .branch(currentBranch)
                    .localPath(repoPath.toAbsolutePath().toString())
                    .javaFiles(javaFiles)
                    .build();
        }
    }

    /**
     * 从已克隆的仓库中更新代码
     */
    public GitRepository pullRepository(String repoId) throws GitAPIException, IOException {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        if (!Files.exists(repoPath)) {
            throw new RuntimeException("仓库不存在: " + repoId);
        }

        try (Git git = Git.open(repoPath.toFile())) {
            log.info("正在拉取仓库更新: {}", repoId);
            git.pull().call();

            String currentBranch = git.getRepository().getBranch();
            List<File> javaFiles = findJavaFiles(repoPath.toFile());

            return GitRepository.builder()
                    .repoId(repoId)
                    .localPath(repoPath.toAbsolutePath().toString())
                    .branch(currentBranch)
                    .javaFiles(javaFiles)
                    .build();
        }
    }

    /**
     * 获取仓库的分支列表
     */
    public List<String> listBranches(String repoUrl, String username, String password) throws GitAPIException {
        // 创建临时目录用于 ls-remote
        Path tempDir = Paths.get(gitReposDir, "temp-" + UUID.randomUUID());
        try {
            Files.createDirectories(tempDir);

            // 使用临时目录初始化 Git
            try (Git git = Git.init().setDirectory(tempDir.toFile()).call()) {
                // 配置远程仓库并列出分支
                CredentialsProvider credentialsProvider = null;
                if (username != null && !username.isEmpty() && password != null) {
                    credentialsProvider = new UsernamePasswordCredentialsProvider(username, password);
                }

                // 使用 ls-remote 获取分支列表
                List<String> branches = new ArrayList<>();
                git.lsRemote()
                        .setRemote(repoUrl)
                        .setCredentialsProvider(credentialsProvider)
                        .call()
                        .forEach(ref -> {
                            String refName = ref.getName();
                            if (refName.startsWith("refs/heads/")) {
                                branches.add(refName.substring("refs/heads/".length()));
                            }
                        });

                return branches;
            }
        } catch (IOException e) {
            throw new RuntimeException("无法创建临时目录", e);
        } finally {
            // 清理临时目录
            deleteDirectory(tempDir.toFile());
        }
    }

    /**
     * 递归查找所有 Java 文件
     */
    private List<File> findJavaFiles(File directory) {
        List<File> javaFiles = new ArrayList<>();
        findJavaFilesRecursive(directory, javaFiles);
        return javaFiles;
    }

    private void findJavaFilesRecursive(File directory, List<File> result) {
        File[] files = directory.listFiles();
        if (files == null) {
            return;
        }

        for (File file : files) {
            if (file.isDirectory()) {
                // 跳过 .git 目录
                if (!file.getName().equals(".git")) {
                    findJavaFilesRecursive(file, result);
                }
            } else if (file.getName().endsWith(".java")) {
                result.add(file);
            }
        }
    }

    /**
     * 读取 Java 文件内容
     */
    public String readJavaFile(File file) throws IOException {
        return new String(Files.readAllBytes(file.toPath()), "UTF-8");
    }

    /**
     * 删除仓库
     */
    public void deleteRepository(String repoId) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        deleteDirectory(repoPath.toFile());
        log.info("仓库已删除: {}", repoId);
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
     * 获取仓库中的所有 Java 文件内容
     */
    public List<JavaFileContent> getAllJavaFileContents(String repoId) throws IOException {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        if (!Files.exists(repoPath)) {
            throw new RuntimeException("仓库不存在: " + repoId);
        }

        List<File> javaFiles = findJavaFiles(repoPath.toFile());
        List<JavaFileContent> contents = new ArrayList<>();

        for (File file : javaFiles) {
            String relativePath = repoPath.relativize(file.toPath()).toString();
            contents.add(JavaFileContent.builder()
                    .path(relativePath)
                    .content(readJavaFile(file))
                    .build());
        }

        return contents;
    }

    /**
     * Git 仓库信息
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GitRepository {
        private String repoId;
        private String repoUrl;
        private String branch;
        private String localPath;
        private List<File> javaFiles;

        public int getJavaFileCount() {
            return javaFiles != null ? javaFiles.size() : 0;
        }
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
