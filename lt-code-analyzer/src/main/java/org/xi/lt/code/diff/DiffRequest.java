package org.xi.lt.code.diff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 差异分析请求对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiffRequest {
    /**
     * 旧版本的来源类型: file, git, trace
     */
    private String oldSourceType;

    /**
     * 旧版本的来源标识
     */
    private String oldSourceId;

    /**
     * 旧版本图ID
     */
    private String oldGraphId;

    /**
     * 新版本的来源类型
     */
    private String newSourceType;

    /**
     * 新版本的来源标识
     */
    private String newSourceId;

    /**
     * 新版本图ID
     */
    private String newGraphId;

    /**
     * 是否生成高亮差异图
     */
    private boolean generateHighlightedGraph;
}
