package org.xi.lt.flow.generator;

import org.junit.jupiter.api.Test;
import org.xi.lt.flow.model.FlowEdge;
import org.xi.lt.flow.model.FlowGraph;
import org.xi.lt.flow.model.FlowNode;

/**
 * 测试：确保含 "-->" 和 "->" 的节点被正确过滤！
 */
public class PlantUmlArrowNodeTest {

    public static void main(String[] args) {
        new PlantUmlArrowNodeTest().testArrowNodeFiltering();
    }

    @Test
    public void testArrowNodeFiltering() {
        System.out.println("\n========== 测试：含箭头节点过滤 ==========");

        // 创建测试图
        FlowGraph graph = FlowGraph.builder()
                .name("测试过滤箭头节点")
                .build();

        // 正常节点
        FlowNode normalNode1 = FlowNode.builder()
                .id("com.example.Test#normalMethod1")
                .type(FlowNode.NodeType.METHOD)
                .className("com.example.Test")
                .methodName("normalMethod1")
                .displayName("normalMethod1")
                .build();

        FlowNode normalNode2 = FlowNode.builder()
                .id("com.example.Test#normalMethod2")
                .type(FlowNode.NodeType.METHOD)
                .className("com.example.Test")
                .methodName("normalMethod2")
                .displayName("normalMethod2")
                .build();

        // 含 "-->" 的节点1 - 方法名就是 "-->"
        FlowNode arrowNode1 = FlowNode.builder()
                .id("com.example.Test#-->")
                .type(FlowNode.NodeType.METHOD)
                .className("com.example.Test")
                .methodName("-->")
                .displayName("-->")
                .build();

        // 添加所有节点
        graph.addNode(normalNode1);
        graph.addNode(normalNode2);
        graph.addNode(arrowNode1);

        // 添加边
        FlowEdge edge1 = FlowEdge.builder().source(normalNode1).target(normalNode2).build();
        FlowEdge edge2 = FlowEdge.builder().source(normalNode1).target(arrowNode1).build();
        graph.addEdge(edge1);
        graph.addEdge(edge2);

        System.out.println("📊 原始图节点数: " + graph.getNodeCount());

        // 创建生成器
        PlantUmlCallChainGenerator generator = new PlantUmlCallChainGenerator();

        // 生成活动图
        String plantUml = generator.generatePlantUml(graph, PlantUmlCallChainGenerator.DiagramStyle.ACTIVITY);

        System.out.println("\n📄 生成的 PlantUML:\n" + plantUml);

        // 验证结果
        System.out.println("\n========== 验证 ==========");

        // 1. 检查是否包含正常节点
        if (plantUml.contains("normalMethod1")) {
            System.out.println("✅ 正常节点 normalMethod1 保留");
        } else {
            System.out.println("❌ 正常节点 normalMethod1 丢失！");
        }

        if (plantUml.contains("normalMethod2")) {
            System.out.println("✅ 正常节点 normalMethod2 保留");
        } else {
            System.out.println("❌ 正常节点 normalMethod2 丢失！");
        }

        // 2. 检查 "-->" 节点是否被删除
        if (!plantUml.contains("-->;") && !plantUml.contains(":->")) {
            System.out.println("✅ 作为节点内容的 \"-->\" 已删除");
        } else {
            System.out.println("❌ 发现未过滤的 \"-->\" 节点！");
        }

        // 3. 检查是否还有正常的连接箭头
        if (plantUml.contains("-->\n")) {
            System.out.println("✅ 正常的连接箭头保留");
        } else {
            System.out.println("⚠️  警告：没有发现连接箭头");
        }

        System.out.println("\n========== 测试完成！ ==========");
    }
}
