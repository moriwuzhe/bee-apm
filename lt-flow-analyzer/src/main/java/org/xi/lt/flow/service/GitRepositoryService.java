package org.xi.lt.flow.service;

import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.api.ListBranchCommand;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Ref;
import org.eclipse.jgit.revwalk.RevCommit;
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
    public GitResponse cloneRepository(String repoUrl, String localPath, String username, String password, String branch) {
        try {
            Path repoPath;
            String repoId;
            if (localPath != null && !localPath.isEmpty()) {
                repoPath = Paths.get(localPath);
                repoId = localPath;
            } else {
                // 确保仓库目录存在
                Path reposPath = Paths.get(gitReposDir);
                if (!Files.exists(reposPath)) {
                    Files.createDirectories(reposPath);
                }

                // 生成唯一的目录名
                repoId = UUID.randomUUID().toString();
                repoPath = reposPath.resolve(repoId);
            }

            log.info("正在克隆 Git 仓库: {} 到 {}", repoUrl, repoPath);

            // 配置克隆命令
            org.eclipse.jgit.api.CloneCommand cloneCommand = Git.cloneRepository()
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
            String currentBranch;
            try (Git git = cloneCommand.call()) {
                currentBranch = git.getRepository().getBranch();
                log.info("Git 仓库克隆成功！当前分支: {}", currentBranch);
            }

            List<String> branches = listBranches(repoId);
            List<GitResponse.CommitInfo> commits = listRecentCommits(repoId, 20);

            return GitResponse.builder()
                    .success(true)
                    .message("仓库克隆成功！")
                    .repoId(repoId)
                    .repoPath(repoPath.toAbsolutePath().toString())
                    .defaultBranch(currentBranch)
                    .branches(branches)
                    .commits(commits)
                    .build();

        } catch (Exception e) {
            log.error("克隆仓库失败", e);
            return GitResponse.error("克隆仓库失败: " + e.getMessage());
        }
    }

    /**
     * 获取仓库分支列表
     */
    public List<String> listBranches(String repoId) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        if (!Files.exists(repoPath)) {
            return new ArrayList<>();
        }

        try (Git git = Git.open(repoPath.toFile())) {
            return listBranches(git);
        } catch (Exception e) {
            log.error("获取分支列表失败", e);
            return new ArrayList<>();
        }
    }

    private List<String> listBranches(Git git) throws GitAPIException {
        List<Ref> branches = git.branchList().setListMode(ListBranchCommand.ListMode.ALL).call();
        List<String> branchNames = new ArrayList<>();
        for (Ref branch : branches) {
            String name = branch.getName();
            if (name.startsWith("refs/heads/")) {
                branchNames.add(name.substring("refs/heads/".length()));
            } else if (name.startsWith("refs/remotes/")) {
                String remoteBranch = name.substring("refs/remotes/".length());
                if (!remoteBranch.contains("HEAD")) {
                    branchNames.add(remoteBranch);
                }
            }
        }
        return branchNames;
    }

    /**
     * 获取最近提交记录
     */
    public List<GitResponse.CommitInfo> listRecentCommits(String repoId, int limit) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        if (!Files.exists(repoPath)) {
            return new ArrayList<>();
        }

        try (Git git = Git.open(repoPath.toFile())) {
            return listRecentCommits(git, limit);
        } catch (Exception e) {
            log.error("获取提交记录失败", e);
            return new ArrayList<>();
        }
    }

    private List<GitResponse.CommitInfo> listRecentCommits(Git git, int limit) throws GitAPIException, IOException {
        List<GitResponse.CommitInfo> commits = new ArrayList<>();
        Iterable<RevCommit> logIterable = git.log().setMaxCount(limit).call();
        for (RevCommit commit : logIterable) {
            GitResponse.CommitInfo commitInfo = GitResponse.CommitInfo.builder()
                    .id(commit.getName())
                    .shortId(commit.getName().substring(0, 8))
                    .message(commit.getShortMessage())
                    .fullMessage(commit.getFullMessage())
                    .author(commit.getAuthorIdent().getName())
                    .authorEmail(commit.getAuthorIdent().getEmailAddress())
                    .time(commit.getAuthorIdent().getWhen().getTime())
                    .build();
            commits.add(commitInfo);
        }
        return commits;
    }

    /**
     * 切换到指定分支或提交
     */
    public GitResponse checkout(String repoId, String ref) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);

        if (!Files.exists(repoPath)) {
            return GitResponse.error("仓库不存在: " + repoId);
        }

        try (Git git = Git.open(repoPath.toFile())) {
            git.checkout().setName(ref).call();

            List<String> branches = listBranches(git);
            List<GitResponse.CommitInfo> commits = listRecentCommits(git, 20);
            String currentBranch = git.getRepository().getBranch();

            log.info("切换成功: {} -> {}", repoId, ref);

            return GitResponse.builder()
                    .success(true)
                    .message("切换成功！")
                    .currentBranch(currentBranch)
                    .branches(branches)
                    .commits(commits)
                    .build();
        } catch (Exception e) {
            log.error("切换失败", e);
            return GitResponse.error("切换失败: " + e.getMessage());
        }
    }

    /**
     * 获取仓库的本地路径
     */
    public File getRepositoryPath(String repoId) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        if (Files.exists(repoPath)) {
            return repoPath.toFile();
        }
        return null;
    }

    /**
     * 通过路径获取分支列表
     */
    public List<String> listBranchesByPath(String repoPath) {
        try (Git git = Git.open(new File(repoPath))) {
            return listBranches(git);
        } catch (Exception e) {
            log.error("获取分支列表失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 通过路径获取提交列表
     */
    public List<GitResponse.CommitInfo> listRecentCommitsByPath(String repoPath, int limit) {
        try (Git git = Git.open(new File(repoPath))) {
            return listRecentCommits(git, limit);
        } catch (Exception e) {
            log.error("获取提交记录失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 通过路径切换分支/提交
     */
    public GitResponse checkoutByPath(String repoPath, String ref) {
        try (Git git = Git.open(new File(repoPath))) {
            git.checkout().setName(ref).call();

            List<String> branches = listBranches(git);
            List<GitResponse.CommitInfo> commits = listRecentCommits(git, 20);
            String currentBranch = git.getRepository().getBranch();

            log.info("切换成功: {} -> {}", repoPath, ref);

            return GitResponse.builder()
                    .success(true)
                    .message("切换成功！")
                    .currentBranch(currentBranch)
                    .branches(branches)
                    .commits(commits)
                    .build();
        } catch (Exception e) {
            log.error("切换失败", e);
            return GitResponse.error("切换失败: " + e.getMessage());
        }
    }

    /**
     * 删除本地仓库
     */
    public boolean deleteRepository(String repoId) {
        Path repoPath = Paths.get(gitReposDir).resolve(repoId);
        deleteDirectory(repoPath.toFile());
        log.info("仓库已删除: {}", repoId);
        return true;
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
}
