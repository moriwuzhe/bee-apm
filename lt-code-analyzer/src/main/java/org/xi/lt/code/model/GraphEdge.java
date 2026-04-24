package org.xi.lt.code.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图边 - 代表节点之间的关系（调用、继承、导入等）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphEdge {
    private String id;           // 唯一标识
    private String sourceId;     // 源节点 ID
    private String targetId;     // 目标节点 ID
    private String type;         // 类型：CALLS, EXTENDS, IMPLEMENTS, IMPORTS, CONTAINS
    private String metadata;     // 其他元数据（JSON）
}
