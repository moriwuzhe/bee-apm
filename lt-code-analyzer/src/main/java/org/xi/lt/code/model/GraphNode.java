package org.xi.lt.code.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图节点 - 代表代码中的实体（类、方法、字段等）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphNode {
    private String id;           // 唯一标识
    private String type;         // 类型：FILE, CLASS, METHOD, FIELD, INTERFACE, ENUM
    private String name;         // 名称
    private String qualifiedName; // 全限定名
    private String filePath;     // 文件路径
    private String parentId;     // 父节点 ID（比如类的父节点是文件）
    private String metadata;     // 其他元数据（JSON）
}
