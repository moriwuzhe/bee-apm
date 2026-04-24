package org.xi.lt.code.parser;

import org.xi.lt.code.model.KnowledgeGraph;

import java.io.IOException;

/**
 * 代码索引器接口 - 支持多种语言的代码索引
 */
public interface CodeIndexer {
    /**
     * 索引代码库
     * @param repoPath 代码库路径
     * @return 知识图谱
     * @throws IOException IO 异常
     */
    KnowledgeGraph indexRepository(String repoPath) throws IOException;

    /**
     * 获取支持的语言
     * @return 支持的语言列表
     */
    String[] getSupportedLanguages();
}