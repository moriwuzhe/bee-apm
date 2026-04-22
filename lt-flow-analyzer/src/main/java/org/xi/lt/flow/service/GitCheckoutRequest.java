package org.xi.lt.flow.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Git 切换分支请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GitCheckoutRequest {
    private String repositoryPath;
    private String ref;
}
