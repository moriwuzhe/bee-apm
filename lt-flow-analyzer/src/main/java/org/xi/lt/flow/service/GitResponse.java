package org.xi.lt.flow.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Git 响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitResponse {
    private boolean success;
    private String message;
    private String repoId;
    private String repoPath;
    private String defaultBranch;
    @Builder.Default
    private List<String> branches = new ArrayList<>();
    @Builder.Default
    private List<CommitInfo> commits = new ArrayList<>();
    private String currentBranch;

    public static GitResponse success(String message) {
        return GitResponse.builder()
                .success(true)
                .message(message)
                .build();
    }

    public static GitResponse error(String message) {
        return GitResponse.builder()
                .success(false)
                .message(message)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommitInfo {
        private String id;
        private String shortId;
        private String message;
        private String fullMessage;
        private String author;
        private String authorEmail;
        private long time;
    }
}
