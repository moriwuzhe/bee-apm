package org.xi.lt.server.web.diagnostic.ui.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.web.diagnostic.serverside.bean.ApiResult;
import org.xi.lt.server.web.diagnostic.serverside.configuration.DynamicConfig;
import org.xi.lt.server.web.diagnostic.serverside.configuration.DynamicConfigLoader;
import org.xi.lt.server.web.diagnostic.serverside.configuration.local.LocalDynamicConfig;
import org.xi.lt.server.web.diagnostic.ui.git.GitRepositoryApi;
import org.xi.lt.server.web.diagnostic.ui.git.GithubRepositoryApiImpl;
import org.xi.lt.server.web.diagnostic.ui.git.GitlabRepositoryApiImpl;
import org.xi.lt.server.web.diagnostic.ui.service.GitPrivateTokenService;
import org.xi.lt.server.web.diagnostic.ui.service.GitRepositoryStoreService;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.IOException;

/**
 * @author leix.xie
 * @date 2019/9/6 18:48
 * @describe
 */
@Service
public class GitRepositoryStoreServiceImpl implements GitRepositoryStoreService {

    private GitRepositoryApi gitlabRepositoryApiImpl;

    private GitRepositoryApi githubRepositoryApiImpl;

    @Autowired
    private GitPrivateTokenService gitPrivateTokenService;

    private static final String GITLAB = "gitlabv3";
    private static final String GITHUB = "github";
    private static final String GIT_KEY = "git.repository";

    private String gitRepository;

    @PostConstruct
    public void init() {
        DynamicConfig<LocalDynamicConfig> dynamicConfig = DynamicConfigLoader.load("config.properties");
        gitRepository = dynamicConfig.getString(GIT_KEY, "");
        gitlabRepositoryApiImpl = new GitlabRepositoryApiImpl(gitPrivateTokenService, dynamicConfig);
        githubRepositoryApiImpl = new GithubRepositoryApiImpl(gitPrivateTokenService, dynamicConfig);
    }


    @Override
    public ApiResult file(final String projectId, final String path, final String ref) throws IOException {
        return getGitRepositoryApi().file(projectId, path, ref);
    }


    @Override
    public ApiResult fileByClass(final String projectId, final String ref, final String module, final String className) throws IOException {
        return getGitRepositoryApi().fileByClass(projectId, ref, module, className);
    }

    public final GitRepositoryApi getGitRepositoryApi() {
        if (GITHUB.equalsIgnoreCase(gitRepository)) {
            return githubRepositoryApiImpl;
        } else if (GITLAB.equalsIgnoreCase(gitRepository)) {
            return gitlabRepositoryApiImpl;
        }
        throw new RuntimeException("未知的仓库类型 " + gitRepository + "，请联系管理员");
    }

    @PreDestroy
    public void destroy() {
        githubRepositoryApiImpl.destroy();
    }
}
