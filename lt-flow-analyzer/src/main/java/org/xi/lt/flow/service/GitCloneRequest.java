package org.xi.lt.flow.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Git 克隆请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitCloneRequest {
    private String repoUrl;
    private String localPath;
    private String username;
    private String password;
    private String branch;
}
