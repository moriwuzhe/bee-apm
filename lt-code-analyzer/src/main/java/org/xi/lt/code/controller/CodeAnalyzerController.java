package org.xi.lt.code.controller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.xi.lt.code.analyzer.SpringBootProjectAnalyzer;
import org.xi.lt.code.model.GraphEdge;
import org.xi.lt.code.model.GraphNode;
import org.xi.lt.code.model.KnowledgeGraph;
import org.xi.lt.code.parser.JavaCodeIndexer;
import org.xi.lt.code.parser.CodeIndexer;

import java.io.File;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * 代码分析器 REST API
 */
@RestController
@RequestMapping("/api/code")
@CrossOrigin(origins = "*")
public class CodeAnalyzerController {

    // 项目级别的缓存管理
    private Map<String, KnowledgeGraph> projectGraphCache = new HashMap<>();
    private Map<String, SpringBootProjectAnalyzer.ProjectAnalysisResult> projectAnalysisCache = new HashMap<>();
    private Map<String, Map<String, SpringBootProjectAnalyzer.ComponentDetail>> projectComponentCache = new HashMap<>();
    private Map<String, Long> projectLastAnalysisTime = new HashMap<>();
    private static final long CACHE_EXPIRY_TIME = 3600000; // 1小时

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("service", "Code Analyzer");
        result.put("version", "0.1");
        return result;
    }

    @PostMapping("/index")
    public IndexResponse indexRepository(@RequestBody IndexRequest request) {
        if (request.getProjectCode() == null || request.getProjectCode().isEmpty()) {
            return IndexResponse.builder()
                    .success(false)
                    .error("项目代码不能为空")
                    .build();
        }
        if (request.getRepoPath() == null || request.getRepoPath().isEmpty()) {
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不能为空")
                    .build();
        }

        File repoDir = new File(request.getRepoPath());
        if (!repoDir.exists()) {
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不存在")
                    .build();
        }

        if (!repoDir.isDirectory()) {
            return IndexResponse.builder()
                    .success(false)
                    .error("代码库路径不是目录")
                    .build();
        }

        try {
            CodeIndexer javaIndexer = new JavaCodeIndexer();
            KnowledgeGraph graph = javaIndexer.indexRepository(request.getRepoPath());

            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer(request.getRepoPath());
            SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = analyzer.analyze();

            // 缓存项目分析结果
            projectGraphCache.put(request.getProjectCode(), graph);
            projectAnalysisCache.put(request.getProjectCode(), analysis);
            projectComponentCache.put(request.getProjectCode(), new HashMap<>());
            projectLastAnalysisTime.put(request.getProjectCode(), System.currentTimeMillis());

            return IndexResponse.builder()
                    .success(true)
                    .nodeCount(graph.getNodes().size())
                    .edgeCount(graph.getEdges().size())
                    .build();
        } catch (Exception e) {
            return IndexResponse.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    @GetMapping("/graph")
    public KnowledgeGraph getGraph(@RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            try {
                CodeIndexer javaIndexer = new JavaCodeIndexer();
                graph = javaIndexer.indexRepository("./src");
                projectGraphCache.put(projectCode, graph);
            } catch (Exception e) {
                graph = KnowledgeGraph.builder().repoPath("./src").build();
                projectGraphCache.put(projectCode, graph);
            }
        }
        return graph;
    }

    @GetMapping("/projectAnalysis")
    public ProjectAnalysisResponse getProjectAnalysis(@RequestParam(value = "projectCode") String projectCode) {
        // 检查缓存是否过期
        long currentTime = System.currentTimeMillis();
        SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = projectAnalysisCache.get(projectCode);
        Long lastTime = projectLastAnalysisTime.get(projectCode);
        if (analysis == null || lastTime == null || currentTime - lastTime > CACHE_EXPIRY_TIME) {
            try {
                SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
                analysis = analyzer.analyze();
                projectAnalysisCache.put(projectCode, analysis);
                projectLastAnalysisTime.put(projectCode, currentTime);
                // 清空组件缓存，因为项目分析结果可能已更新
                projectComponentCache.put(projectCode, new HashMap<>());
            } catch (Exception e) {
                return ProjectAnalysisResponse.builder().error("分析失败: " + e.getMessage()).build();
            }
        }
        return ProjectAnalysisResponse.builder()
                .analysis(analysis)
                .build();
    }

    @GetMapping("/component/{qualifiedName}")
    public ComponentDetailResponse getComponentDetail(@PathVariable String qualifiedName, @RequestParam(value = "projectCode") String projectCode) {
        try {
            // 检查缓存是否过期
            long currentTime = System.currentTimeMillis();
            Long lastTime = projectLastAnalysisTime.get(projectCode);
            if (lastTime == null || currentTime - lastTime > CACHE_EXPIRY_TIME) {
                // 缓存过期，清空组件缓存
                projectComponentCache.put(projectCode, new HashMap<>());
                projectLastAnalysisTime.put(projectCode, currentTime);
            }
            
            // 检查组件缓存
            Map<String, SpringBootProjectAnalyzer.ComponentDetail> componentCache = projectComponentCache.getOrDefault(projectCode, new HashMap<>());
            if (componentCache.containsKey(qualifiedName)) {
                return ComponentDetailResponse.builder().detail(componentCache.get(qualifiedName)).build();
            }
            
            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
            SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = projectAnalysisCache.get(projectCode);
            if (analysis == null) {
                analysis = analyzer.analyze();
                projectAnalysisCache.put(projectCode, analysis);
                projectLastAnalysisTime.put(projectCode, currentTime);
            }
            SpringBootProjectAnalyzer.ComponentDetail detail = analyzer.getComponentDetail(qualifiedName);
            
            // 缓存组件详情
            componentCache.put(qualifiedName, detail);
            projectComponentCache.put(projectCode, componentCache);
            
            return ComponentDetailResponse.builder().detail(detail).build();
        } catch (Exception e) {
            return ComponentDetailResponse.builder().error("获取组件详情失败: " + e.getMessage()).build();
        }
    }

    @GetMapping("/documentation")
    public DocumentationResponse getDocumentation(@RequestParam(value = "projectCode") String projectCode) {
        try {
            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
            SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = projectAnalysisCache.get(projectCode);
            if (analysis == null) {
                analysis = analyzer.analyze();
                projectAnalysisCache.put(projectCode, analysis);
                projectLastAnalysisTime.put(projectCode, System.currentTimeMillis());
            }
            String documentation = analyzer.generateBusinessDocumentation();
            return DocumentationResponse.builder().documentation(documentation).build();
        } catch (Exception e) {
            return DocumentationResponse.builder().error("生成文档失败: " + e.getMessage()).build();
        }
    }

    @GetMapping("/usageGuide")
    public UsageGuideResponse getUsageGuide(@RequestParam(value = "projectCode") String projectCode) {
        try {
            System.out.println("开始生成使用向导");
            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
            System.out.println("创建analyzer实例成功");
            // 始终调用analyze()来确保result字段被初始化
            System.out.println("开始分析项目");
            analyzer.analyze();
            System.out.println("项目分析完成");
            System.out.println("开始生成使用向导");
            SpringBootProjectAnalyzer.UsageGuide guide = analyzer.generateUsageGuide();
            System.out.println("使用向导生成完成");
            System.out.println("guide: " + guide);
            System.out.println("guide.getSteps(): " + guide.getSteps());
            return UsageGuideResponse.builder().guide(guide).build();
        } catch (Exception e) {
            System.err.println("生成使用向导失败:");
            e.printStackTrace();
            return UsageGuideResponse.builder().error("生成使用向导失败: " + (e.getMessage() != null ? e.getMessage() : "未知错误")).build();
        }
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(@RequestParam(value = "projectCode") String projectCode) {
        try {
            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
            SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = projectAnalysisCache.get(projectCode);
            if (analysis == null) {
                analysis = analyzer.analyze();
                projectAnalysisCache.put(projectCode, analysis);
                projectLastAnalysisTime.put(projectCode, System.currentTimeMillis());
            }
            byte[] pdfBytes = analyzer.generatePDFReport();
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "code-analysis-report.pdf");
            headers.setContentLength(pdfBytes.length);
            
            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/context/{nodeId}")
    public ContextResponse getContext(@PathVariable String nodeId, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return ContextResponse.builder().error("No index found, please index first").build();
        }

        GraphNode node = graph.getNode(nodeId);
        if (node == null) {
            return ContextResponse.builder().error("Node not found").build();
        }

        List<GraphEdge> incomingEdges = graph.getEdges().stream()
                .filter(e -> nodeId.equals(e.getTargetId()))
                .collect(Collectors.toList());

        List<GraphEdge> outgoingEdges = graph.getEdges().stream()
                .filter(e -> nodeId.equals(e.getSourceId()))
                .collect(Collectors.toList());

        return ContextResponse.builder()
                .node(node)
                .incomingEdges(incomingEdges)
                .outgoingEdges(outgoingEdges)
                .build();
    }

    @GetMapping("/impact/{nodeId}")
    public ImpactResponse getImpact(@PathVariable String nodeId, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return ImpactResponse.builder().error("No index found, please index first").build();
        }

        GraphNode node = graph.getNode(nodeId);
        if (node == null) {
            return ImpactResponse.builder().error("Node not found").build();
        }

        Set<String> visited = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(nodeId);
        visited.add(nodeId);

        List<GraphNode> upstream = new ArrayList<>();
        List<GraphNode> downstream = new ArrayList<>();

        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            List<GraphEdge> edges = graph.getEdges().stream()
                    .filter(e -> "CALLS".equals(e.getType()) && currentId.equals(e.getTargetId()))
                    .collect(Collectors.toList());
            for (GraphEdge edge : edges) {
                if (!visited.contains(edge.getSourceId())) {
                    visited.add(edge.getSourceId());
                    GraphNode upstreamNode = graph.getNode(edge.getSourceId());
                    if (upstreamNode != null) {
                        upstream.add(upstreamNode);
                        queue.add(edge.getSourceId());
                    }
                }
            }
        }

        visited.clear();
        queue.add(nodeId);
        visited.add(nodeId);
        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            List<GraphEdge> edges = graph.getEdges().stream()
                    .filter(e -> "CALLS".equals(e.getType()) && currentId.equals(e.getSourceId()))
                    .collect(Collectors.toList());
            for (GraphEdge edge : edges) {
                if (!visited.contains(edge.getTargetId())) {
                    visited.add(edge.getTargetId());
                    GraphNode downstreamNode = graph.getNode(edge.getTargetId());
                    if (downstreamNode != null) {
                        downstream.add(downstreamNode);
                        queue.add(edge.getTargetId());
                    }
                }
            }
        }

        String riskLevel = "LOW";
        if (upstream.size() + downstream.size() > 10) {
            riskLevel = "HIGH";
        } else if (upstream.size() + downstream.size() > 3) {
            riskLevel = "MEDIUM";
        }

        return ImpactResponse.builder()
                .node(node)
                .upstreamImpact(upstream)
                .downstreamImpact(downstream)
                .totalImpactCount(upstream.size() + downstream.size())
                .riskLevel(riskLevel)
                .build();
    }

    @PostMapping("/detectChanges")
    public DetectChangesResponse detectChanges(@RequestBody DetectChangesRequest request, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return DetectChangesResponse.builder().error("No index found, please index first").build();
        }
        List<GraphNode> changedNodes = graph.getNodes().values().stream()
                .filter(n -> request.getChangedFiles().stream().anyMatch(f -> n.getFilePath() != null && n.getFilePath().contains(f)))
                .collect(Collectors.toList());
        List<GraphNode> allImpacted = new ArrayList<>();
        for (GraphNode node : changedNodes) {
            ImpactResponse impact = getImpact(node.getId(), projectCode);
            if (impact.getUpstreamImpact() != null) allImpacted.addAll(impact.getUpstreamImpact());
            if (impact.getDownstreamImpact() != null) allImpacted.addAll(impact.getDownstreamImpact());
        }
        Set<String> seenIds = new HashSet<>();
        List<GraphNode> uniqueImpacted = new ArrayList<>();
        for (GraphNode n : allImpacted) {
            if (!seenIds.contains(n.getId())) {
                seenIds.add(n.getId());
                uniqueImpacted.add(n);
            }
        }
        String riskLevel = "LOW";
        if (uniqueImpacted.size() > 10) riskLevel = "HIGH";
        else if (uniqueImpacted.size() > 3) riskLevel = "MEDIUM";
        return DetectChangesResponse.builder()
                .changedNodes(changedNodes)
                .impactedNodes(uniqueImpacted)
                .totalImpactCount(uniqueImpacted.size())
                .riskLevel(riskLevel)
                .build();
    }

    @PostMapping("/query")
    public QueryResponse query(@RequestBody QueryRequest request, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return QueryResponse.builder().error("No index found, please index first").build();
        }
        List<GraphNode> results = graph.getNodes().values().stream()
                .filter(n -> {
                    boolean match = true;
                    if (request.getNodeType() != null && request.getNodeType().length() > 0) {
                        match = match && request.getNodeType().equals(n.getType());
                    }
                    if (request.getNameContains() != null && request.getNameContains().length() > 0) {
                        match = match && (n.getName() != null && n.getName().contains(request.getNameContains()));
                    }
                    return match;
                })
                .collect(Collectors.toList());
        return QueryResponse.builder().nodes(results).nodeCount(results.size()).build();
    }

    @GetMapping("/apiRouteMap")
    public ApiRouteMapResponse getApiRouteMap(@RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return ApiRouteMapResponse.builder().error("No index found, please index first").build();
        }

        List<GraphNode> controllerClasses = graph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName() != null && n.getName().contains("Controller"))
                .collect(Collectors.toList());

        List<ApiRoute> apiRoutes = new ArrayList<>();
        for (GraphNode controllerClass : controllerClasses) {
            List<GraphNode> methods = graph.getNodes().values().stream()
                    .filter(n -> "METHOD".equals(n.getType()) && controllerClass.getId().equals(n.getParentId()))
                    .collect(Collectors.toList());

            for (GraphNode method : methods) {
                String route = "/api/" + controllerClass.getName().replace("Controller", "").toLowerCase() + "/" + method.getName().toLowerCase();
                ApiRoute apiRoute = ApiRoute.builder()
                        .route(route)
                        .controllerClass(controllerClass.getName())
                        .methodName(method.getName())
                        .build();
                apiRoutes.add(apiRoute);
            }
        }

        return ApiRouteMapResponse.builder()
                .apiRoutes(apiRoutes)
                .routeCount(apiRoutes.size())
                .build();
    }

    @PostMapping("/mcp/query")
    public MCPQueryResponse mcpQuery(@RequestBody MCPQueryRequest request, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return MCPQueryResponse.builder().error("No index found, please index first").build();
        }

        switch (request.getQueryType()) {
            case "findClass":
                return findClass(request.getQuery(), projectCode);
            case "findMethod":
                return findMethod(request.getQuery(), projectCode);
            case "findField":
                return findField(request.getQuery(), projectCode);
            case "findUsage":
                return findUsage(request.getQuery(), projectCode);
            default:
                return MCPQueryResponse.builder().error("Unknown query type").build();
        }
    }

    private MCPQueryResponse findClass(String query, String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphNode> classes = graph.getNodes().values().stream()
                .filter(n -> "CLASS".equals(n.getType()) && n.getName() != null && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(classes)
                .resultCount(classes.size())
                .build();
    }

    private MCPQueryResponse findMethod(String query, String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphNode> methods = graph.getNodes().values().stream()
                .filter(n -> "METHOD".equals(n.getType()) && n.getName() != null && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(methods)
                .resultCount(methods.size())
                .build();
    }

    private MCPQueryResponse findField(String query, String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphNode> fields = graph.getNodes().values().stream()
                .filter(n -> "FIELD".equals(n.getType()) && n.getName() != null && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(fields)
                .resultCount(fields.size())
                .build();
    }

    private MCPQueryResponse findUsage(String query, String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphNode> results = graph.getNodes().values().stream()
                .filter(n -> n.getName() != null && n.getName().contains(query))
                .collect(Collectors.toList());
        return MCPQueryResponse.builder()
                .results(results)
                .resultCount(results.size())
                .build();
    }

    @GetMapping("/callChain/{nodeId}")
    public CallChainResponse getCallChain(@PathVariable String nodeId, @RequestParam(value = "projectCode") String projectCode) {
        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        if (graph == null) {
            return CallChainResponse.builder().error("No index found, please index first").build();
        }

        GraphNode startNode = graph.getNode(nodeId);
        if (startNode == null) {
            return CallChainResponse.builder().error("Node not found").build();
        }

        List<CallChainItem> upstreamChain = new ArrayList<>();
        List<CallChainItem> downstreamChain = new ArrayList<>();

        Set<String> visitedUp = new HashSet<>();
        traceUpstream(nodeId, startNode.getName(), 0, 5, upstreamChain, visitedUp, projectCode);

        Set<String> visitedDown = new HashSet<>();
        traceDownstream(nodeId, startNode.getName(), 0, 5, downstreamChain, visitedDown, projectCode);

        return CallChainResponse.builder()
                .startNode(startNode)
                .upstreamChain(upstreamChain)
                .downstreamChain(downstreamChain)
                .build();
    }

    private void traceUpstream(String nodeId, String path, int depth, int maxDepth,
                               List<CallChainItem> chain, Set<String> visited, String projectCode) {
        if (depth >= maxDepth) return;

        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphEdge> incomingCalls = graph.getEdges().stream()
                .filter(e -> "CALLS".equals(e.getType()) && nodeId.equals(e.getTargetId()))
                .collect(Collectors.toList());

        for (GraphEdge edge : incomingCalls) {
            if (!visited.contains(edge.getSourceId())) {
                visited.add(edge.getSourceId());
                GraphNode caller = graph.getNode(edge.getSourceId());
                if (caller != null) {
                    chain.add(CallChainItem.builder()
                            .node(caller)
                            .depth(depth)
                            .relationship("调用")
                            .path(path + " <- " + caller.getName())
                            .build());
                    traceUpstream(edge.getSourceId(), path + " <- " + caller.getName(),
                            depth + 1, maxDepth, chain, visited, projectCode);
                }
            }
        }
    }

    private void traceDownstream(String nodeId, String path, int depth, int maxDepth,
                                 List<CallChainItem> chain, Set<String> visited, String projectCode) {
        if (depth >= maxDepth) return;

        KnowledgeGraph graph = projectGraphCache.get(projectCode);
        List<GraphEdge> outgoingCalls = graph.getEdges().stream()
                .filter(e -> "CALLS".equals(e.getType()) && nodeId.equals(e.getSourceId()))
                .collect(Collectors.toList());

        for (GraphEdge edge : outgoingCalls) {
            if (!visited.contains(edge.getTargetId())) {
                visited.add(edge.getTargetId());
                GraphNode callee = graph.getNode(edge.getTargetId());
                if (callee != null) {
                    chain.add(CallChainItem.builder()
                            .node(callee)
                            .depth(depth)
                            .relationship("被调用")
                            .path(path + " -> " + callee.getName())
                            .build());
                    traceDownstream(edge.getTargetId(), path + " -> " + callee.getName(),
                            depth + 1, maxDepth, chain, visited, projectCode);
                }
            }
        }
    }

    @GetMapping("/exampleQueries")
    public ExampleQueriesResponse getExampleQueries() {
        List<ExampleQuery> examples = new ArrayList<>();

        examples.add(ExampleQuery.builder()
                .name("查找所有控制器")
                .description("找到项目中所有的 Controller 类")
                .queryType("findClass")
                .queryKeyword("Controller")
                .build());

        examples.add(ExampleQuery.builder()
                .name("查找所有服务类")
                .description("找到项目中所有的 Service 类")
                .queryType("findClass")
                .queryKeyword("Service")
                .build());

        examples.add(ExampleQuery.builder()
                .name("查找 REST API 端点")
                .description("找到所有包含 @GetMapping/@PostMapping 等注解的方法")
                .queryType("findMethod")
                .queryKeyword("Mapping")
                .build());

        examples.add(ExampleQuery.builder()
                .name("查找数据库操作")
                .description("找到所有与数据库相关的方法")
                .queryType("findMethod")
                .queryKeyword("Repository")
                .build());

        examples.add(ExampleQuery.builder()
                .name("查找配置类")
                .description("找到所有配置相关的类")
                .queryType("findClass")
                .queryKeyword("Config")
                .build());

        examples.add(ExampleQuery.builder()
                .name("查找实体类")
                .description("找到所有实体/模型类")
                .queryType("findClass")
                .queryKeyword("Entity")
                .build());

        return ExampleQueriesResponse.builder()
                .examples(examples)
                .build();
    }

    @GetMapping("/generateArchitectureDiagram")
    public ArchitectureDiagramResponse generateArchitectureDiagram(@RequestParam(value = "style", defaultValue = "detailed") String style, @RequestParam(value = "projectCode") String projectCode) {
        try {
            SpringBootProjectAnalyzer analyzer = new SpringBootProjectAnalyzer("./src");
            SpringBootProjectAnalyzer.ProjectAnalysisResult analysis = projectAnalysisCache.get(projectCode);
            if (analysis == null) {
                analysis = analyzer.analyze();
                projectAnalysisCache.put(projectCode, analysis);
                projectLastAnalysisTime.put(projectCode, System.currentTimeMillis());
            }
            
            String plantUml = generatePlantUmlDiagram(analysis);
            String svg = convertPlantUmlToSvg(plantUml, analysis, style);
            // 使用 UTF-8 编码来避免乱码
            String base64 = java.util.Base64.getEncoder().encodeToString(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            
            return ArchitectureDiagramResponse.builder()
                    .diagram(base64)
                    .build();
        } catch (Exception e) {
            return ArchitectureDiagramResponse.builder()
                    .error("生成架构图失败: " + e.getMessage())
                    .build();
        }
    }

    private String generatePlantUmlDiagram(SpringBootProjectAnalyzer.ProjectAnalysisResult analysis) {
        StringBuilder plantUml = new StringBuilder();
        plantUml.append("@startuml\n");
        plantUml.append("!define RECTANGLE class\n");
        plantUml.append("!define COMPONENT component\n");
        plantUml.append("!define DATABASE database\n");
        plantUml.append("!define NOTE note\n");
        plantUml.append("\n");
        plantUml.append("skinparam backgroundColor white\n");
        plantUml.append("skinparam componentStyle rectangle\n");
        plantUml.append("skinparam classFontName \"Arial\"\n");
        plantUml.append("skinparam componentFontName \"Arial\"\n");
        plantUml.append("skinparam nodeFontName \"Arial\"\n");
        plantUml.append("skinparam noteFontName \"Arial\"\n");
        plantUml.append("skinparam titleFontName \"Arial\"\n");
        plantUml.append("\n");
        plantUml.append("skinparam component {\n");
        plantUml.append("  BackgroundColor white\n");
        plantUml.append("  BorderColor #667eea\n");
        plantUml.append("  FontColor #333333\n");
        plantUml.append("  FontSize 12\n");
        plantUml.append("  BorderWidth 2\n");
        plantUml.append("}\n");
        plantUml.append("\n");
        plantUml.append("skinparam class {\n");
        plantUml.append("  BackgroundColor white\n");
        plantUml.append("  BorderColor #764ba2\n");
        plantUml.append("  FontColor #333333\n");
        plantUml.append("  FontSize 12\n");
        plantUml.append("  BorderWidth 2\n");
        plantUml.append("}\n");
        plantUml.append("\n");
        plantUml.append("skinparam note {\n");
        plantUml.append("  BackgroundColor #f0f0f0\n");
        plantUml.append("  BorderColor #cccccc\n");
        plantUml.append("  FontColor #333333\n");
        plantUml.append("  FontSize 10\n");
        plantUml.append("}\n");
        plantUml.append("\n");
        plantUml.append("skinparam arrow {\n");
        plantUml.append("  Color #888888\n");
        plantUml.append("  Thickness 2\n");
        plantUml.append("  FontColor #666666\n");
        plantUml.append("  FontSize 10\n");
        plantUml.append("}\n");
        plantUml.append("\n");
        plantUml.append("title 项目架构图\n");
        plantUml.append("\n");
        
        // 分层架构
        plantUml.append("package \"控制器层\" as ControllerLayer {\n");
        if (analysis.getControllers() != null && !analysis.getControllers().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo controller : analysis.getControllers()) {
                plantUml.append("  COMPONENT \"").append(controller.getClassName()).append("\" as C_").append(controller.getClassName()).append("\n");
            }
        } else {
            plantUml.append("  COMPONENT \"无控制器\" as C_None\n");
        }
        plantUml.append("}\n\n");
        
        plantUml.append("package \"服务层\" as ServiceLayer {\n");
        if (analysis.getServices() != null && !analysis.getServices().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo service : analysis.getServices()) {
                plantUml.append("  COMPONENT \"").append(service.getClassName()).append("\" as S_").append(service.getClassName()).append("\n");
            }
        } else {
            plantUml.append("  COMPONENT \"无服务类\" as S_None\n");
        }
        plantUml.append("}\n\n");
        
        plantUml.append("package \"数据访问层\" as RepositoryLayer {\n");
        if (analysis.getRepositories() != null && !analysis.getRepositories().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo repo : analysis.getRepositories()) {
                plantUml.append("  COMPONENT \"").append(repo.getClassName()).append("\" as R_").append(repo.getClassName()).append("\n");
            }
        } else {
            plantUml.append("  COMPONENT \"无仓库\" as R_None\n");
        }
        plantUml.append("}\n\n");
        
        plantUml.append("package \"数据模型层\" as EntityLayer {\n");
        if (analysis.getEntities() != null && !analysis.getEntities().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo entity : analysis.getEntities()) {
                plantUml.append("  COMPONENT \"").append(entity.getClassName()).append("\" as E_").append(entity.getClassName()).append("\n");
            }
        } else {
            plantUml.append("  COMPONENT \"无实体\" as E_None\n");
        }
        plantUml.append("}\n\n");
        
        // 依赖关系
        plantUml.append("' 依赖关系\n");
        
        // 控制器到服务
        if (analysis.getControllers() != null && !analysis.getControllers().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo controller : analysis.getControllers()) {
                if (analysis.getServices() != null && !analysis.getServices().isEmpty()) {
                    for (SpringBootProjectAnalyzer.ComponentInfo service : analysis.getServices()) {
                        plantUml.append("C_").append(controller.getClassName()).append(" --> S_").append(service.getClassName()).append(" : 调用\n");
                    }
                } else {
                    plantUml.append("C_").append(controller.getClassName()).append(" --> S_None : 无服务\n");
                }
            }
        }
        
        // 服务到仓库
        if (analysis.getServices() != null && !analysis.getServices().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo service : analysis.getServices()) {
                if (analysis.getRepositories() != null && !analysis.getRepositories().isEmpty()) {
                    for (SpringBootProjectAnalyzer.ComponentInfo repo : analysis.getRepositories()) {
                        plantUml.append("S_").append(service.getClassName()).append(" --> R_").append(repo.getClassName()).append(" : 调用\n");
                    }
                } else {
                    plantUml.append("S_").append(service.getClassName()).append(" --> R_None : 无仓库\n");
                }
            }
        }
        
        // 仓库到实体
        if (analysis.getRepositories() != null && !analysis.getRepositories().isEmpty()) {
            for (SpringBootProjectAnalyzer.ComponentInfo repo : analysis.getRepositories()) {
                if (analysis.getEntities() != null && !analysis.getEntities().isEmpty()) {
                    for (SpringBootProjectAnalyzer.ComponentInfo entity : analysis.getEntities()) {
                        plantUml.append("R_").append(repo.getClassName()).append(" --> E_").append(entity.getClassName()).append(" : 操作\n");
                    }
                } else {
                    plantUml.append("R_").append(repo.getClassName()).append(" --> E_None : 无实体\n");
                }
            }
        }
        
        // 包结构说明
        if (analysis.getPackages() != null && !analysis.getPackages().isEmpty()) {
            plantUml.append("\nnote right of ControllerLayer\n");
            plantUml.append("  包结构:\n");
            for (SpringBootProjectAnalyzer.PackageInfo pkg : analysis.getPackages()) {
                if (pkg.getJavaFileCount() > 0) {
                    plantUml.append("  - " + pkg.getName() + " (" + pkg.getJavaFileCount() + " 个文件)\n");
                }
            }
            plantUml.append("end note\n");
        }
        
        plantUml.append("\n@enduml");
        return plantUml.toString();
    }

    private String convertPlantUmlToSvg(String plantUml, SpringBootProjectAnalyzer.ProjectAnalysisResult analysis, String style) throws Exception {
        // 这里使用简单的 SVG 生成，实际项目中可以使用 PlantUML 库
        StringBuilder svg = new StringBuilder();
        
        if ("simple".equals(style)) {
            // 简单风格：只显示核心层次
            svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"1000\" height=\"800\" viewBox=\"0 0 1000 800\">");
            svg.append("<text x=\"500\" y=\"50\" font-family=\"Arial\" font-size=\"24\" font-weight=\"bold\" text-anchor=\"middle\">项目架构图</text>");
            
            // 分层架构
            int layerWidth = 250;
            int layerHeight = 120;
            int layerX = 100;
            int layerY = 120;
            int layerSpacing = 50;
            
            // 控制器层
            svg.append("<rect x=\"").append(layerX).append("\" y=\"").append(layerY).append("\" width=\"").append(layerWidth).append("\" height=\"").append(layerHeight).append("\" rx=\"8\" fill=\"#f0f4ff\" stroke=\"#667eea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(layerX + layerWidth/2).append("\" y=\"").append(layerY + 60).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">控制器层</text>");
            
            // 服务层
            layerY += layerHeight + layerSpacing;
            svg.append("<rect x=\"").append(layerX).append("\" y=\"").append(layerY).append("\" width=\"").append(layerWidth).append("\" height=\"").append(layerHeight).append("\" rx=\"8\" fill=\"#f0fff4\" stroke=\"#48bb78\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(layerX + layerWidth/2).append("\" y=\"").append(layerY + 60).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">服务层</text>");
            
            // 数据访问层
            layerY += layerHeight + layerSpacing;
            svg.append("<rect x=\"").append(layerX).append("\" y=\"").append(layerY).append("\" width=\"").append(layerWidth).append("\" height=\"").append(layerHeight).append("\" rx=\"8\" fill=\"#fff7e6\" stroke=\"#ed8936\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(layerX + layerWidth/2).append("\" y=\"").append(layerY + 60).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">数据访问层</text>");
            
            // 数据模型层
            layerY += layerHeight + layerSpacing;
            svg.append("<rect x=\"").append(layerX).append("\" y=\"").append(layerY).append("\" width=\"").append(layerWidth).append("\" height=\"").append(layerHeight).append("\" rx=\"8\" fill=\"#faf5ff\" stroke=\"#9f7aea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(layerX + layerWidth/2).append("\" y=\"").append(layerY + 60).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">数据模型层</text>");
            
            // 箭头
            svg.append("<path d=\"M225 240 L225 290\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"225,290 220,280 230,280\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M225 390 L225 440\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"225,440 220,430 230,430\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M225 540 L225 590\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"225,590 220,580 230,580\" fill=\"#888888\"/>");
            
            // 技术栈
            int techStackX = 400;
            int techStackY = 120;
            int techStackWidth = 450;
            int techStackHeight = 300;
            
            svg.append("<rect x=\"").append(techStackX).append("\" y=\"").append(techStackY).append("\" width=\"").append(techStackWidth).append("\" height=\"").append(techStackHeight).append("\" rx=\"8\" fill=\"#f8fafc\" stroke=\"#4a5568\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(techStackX + techStackWidth/2).append("\" y=\"").append(techStackY + 30).append("\" font-family=\"Arial\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">技术栈</text>");
            
            // 添加技术栈信息
            if (analysis != null && analysis.getMavenInfo() != null) {
                svg.append("<text x=\"").append(techStackX + 20).append("\" y=\"").append(techStackY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 项目名称: " + analysis.getMavenInfo().getArtifactId() + "</text>");
                svg.append("<text x=\"").append(techStackX + 20).append("\" y=\"").append(techStackY + 85).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Group ID: " + analysis.getMavenInfo().getGroupId() + "</text>");
                svg.append("<text x=\"").append(techStackX + 20).append("\" y=\"").append(techStackY + 110).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 版本: " + analysis.getMavenInfo().getVersion() + "</text>");
            }
            
        } else if ("component".equals(style)) {
            // 组件风格：重点显示组件关系
            svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"1200\" height=\"900\" viewBox=\"0 0 1200 900\">");
            svg.append("<text x=\"600\" y=\"50\" font-family=\"Arial\" font-size=\"24\" font-weight=\"bold\" text-anchor=\"middle\">项目架构图</text>");
            
            // 组件
            int componentWidth = 200;
            int componentHeight = 100;
            int spacing = 80;
            
            // 控制器
            int controllerX = 100;
            int controllerY = 150;
            svg.append("<rect x=\"").append(controllerX).append("\" y=\"").append(controllerY).append("\" width=\"").append(componentWidth).append("\" height=\"").append(componentHeight).append("\" rx=\"8\" fill=\"#f0f4ff\" stroke=\"#667eea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(controllerX + componentWidth/2).append("\" y=\"").append(controllerY + 30).append("\" font-family=\"Arial\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">控制器</text>");
            if (analysis != null && analysis.getControllers() != null && !analysis.getControllers().isEmpty()) {
                int controllerCount = Math.min(analysis.getControllers().size(), 3);
                for (int i = 0; i < controllerCount; i++) {
                    SpringBootProjectAnalyzer.ComponentInfo controller = analysis.getControllers().get(i);
                    svg.append("<text x=\"").append(controllerX + 10).append("\" y=\"").append(controllerY + 55 + i*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• " + controller.getClassName() + "</text>");
                }
                if (analysis.getControllers().size() > 3) {
                    svg.append("<text x=\"").append(controllerX + 10).append("\" y=\"").append(controllerY + 55 + 3*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• ...</text>");
                }
            }
            
            // 服务
            int serviceX = 400;
            int serviceY = 150;
            svg.append("<rect x=\"").append(serviceX).append("\" y=\"").append(serviceY).append("\" width=\"").append(componentWidth).append("\" height=\"").append(componentHeight).append("\" rx=\"8\" fill=\"#f0fff4\" stroke=\"#48bb78\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(serviceX + componentWidth/2).append("\" y=\"").append(serviceY + 30).append("\" font-family=\"Arial\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">服务</text>");
            if (analysis != null && analysis.getServices() != null && !analysis.getServices().isEmpty()) {
                int serviceCount = Math.min(analysis.getServices().size(), 3);
                for (int i = 0; i < serviceCount; i++) {
                    SpringBootProjectAnalyzer.ComponentInfo service = analysis.getServices().get(i);
                    svg.append("<text x=\"").append(serviceX + 10).append("\" y=\"").append(serviceY + 55 + i*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• " + service.getClassName() + "</text>");
                }
                if (analysis.getServices().size() > 3) {
                    svg.append("<text x=\"").append(serviceX + 10).append("\" y=\"").append(serviceY + 55 + 3*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• ...</text>");
                }
            }
            
            // 仓库
            int repoX = 400;
            int repoY = 350;
            svg.append("<rect x=\"").append(repoX).append("\" y=\"").append(repoY).append("\" width=\"").append(componentWidth).append("\" height=\"").append(componentHeight).append("\" rx=\"8\" fill=\"#fff7e6\" stroke=\"#ed8936\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(repoX + componentWidth/2).append("\" y=\"").append(repoY + 30).append("\" font-family=\"Arial\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">仓库</text>");
            if (analysis != null && analysis.getRepositories() != null && !analysis.getRepositories().isEmpty()) {
                int repoCount = Math.min(analysis.getRepositories().size(), 3);
                for (int i = 0; i < repoCount; i++) {
                    SpringBootProjectAnalyzer.ComponentInfo repo = analysis.getRepositories().get(i);
                    svg.append("<text x=\"").append(repoX + 10).append("\" y=\"").append(repoY + 55 + i*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• " + repo.getClassName() + "</text>");
                }
                if (analysis.getRepositories().size() > 3) {
                    svg.append("<text x=\"").append(repoX + 10).append("\" y=\"").append(repoY + 55 + 3*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• ...</text>");
                }
            }
            
            // 实体
            int entityX = 700;
            int entityY = 250;
            svg.append("<rect x=\"").append(entityX).append("\" y=\"").append(entityY).append("\" width=\"").append(componentWidth).append("\" height=\"").append(componentHeight).append("\" rx=\"8\" fill=\"#faf5ff\" stroke=\"#9f7aea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(entityX + componentWidth/2).append("\" y=\"").append(entityY + 30).append("\" font-family=\"Arial\" font-size=\"14\" font-weight=\"bold\" text-anchor=\"middle\">实体</text>");
            if (analysis != null && analysis.getEntities() != null && !analysis.getEntities().isEmpty()) {
                int entityCount = Math.min(analysis.getEntities().size(), 3);
                for (int i = 0; i < entityCount; i++) {
                    SpringBootProjectAnalyzer.ComponentInfo entity = analysis.getEntities().get(i);
                    svg.append("<text x=\"").append(entityX + 10).append("\" y=\"").append(entityY + 55 + i*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• " + entity.getClassName() + "</text>");
                }
                if (analysis.getEntities().size() > 3) {
                    svg.append("<text x=\"").append(entityX + 10).append("\" y=\"").append(entityY + 55 + 3*15).append("\" font-family=\"Arial\" font-size=\"11\" text-anchor=\"start\" fill=\"#666666\">• ...</text>");
                }
            }
            
            // 箭头
            svg.append("<path d=\"M300 200 L400 200\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"400,200 390,195 390,205\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M500 250 L500 350\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"500,350 495,340 505,340\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M600 400 L700 300\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"700,300 690,305 695,295\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M500 350 L600 350\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"600,350 590,345 590,355\" fill=\"#888888\"/>");
            
        } else {
            // 详细风格：包含所有信息，专为新人设计
            svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"1600\" height=\"1200\" viewBox=\"0 0 1600 1200\">");
            svg.append("<text x=\"800\" y=\"50\" font-family=\"Arial\" font-size=\"28\" font-weight=\"bold\" text-anchor=\"middle\">Code Analyzer 架构图</text>");
            
            // 系统架构概览
            int overviewX = 100;
            int overviewY = 100;
            int overviewWidth = 1400;
            int overviewHeight = 400;
            svg.append("<rect x=\"").append(overviewX).append("\" y=\"").append(overviewY).append("\" width=\"").append(overviewWidth).append("\" height=\"").append(overviewHeight).append("\" rx=\"10\" fill=\"#f8fafc\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(overviewX + overviewWidth/2).append("\" y=\"").append(overviewY + 40).append("\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" text-anchor=\"middle\">系统架构概览</text>");
            
            // 前端层
            int frontX = 150;
            int frontY = 150;
            int moduleWidth = 200;
            int moduleHeight = 120;
            svg.append("<rect x=\"").append(frontX).append("\" y=\"").append(frontY).append("\" width=\"").append(moduleWidth).append("\" height=\"").append(moduleHeight).append("\" rx=\"8\" fill=\"#f0f4ff\" stroke=\"#667eea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(frontX + moduleWidth/2).append("\" y=\"").append(frontY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">前端层</text>");
            svg.append("<text x=\"").append(frontX + 10).append("\" y=\"").append(frontY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• HTML 页面</text>");
            svg.append("<text x=\"").append(frontX + 10).append("\" y=\"").append(frontY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• JavaScript</text>");
            svg.append("<text x=\"").append(frontX + 10).append("\" y=\"").append(frontY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• CSS 样式</text>");
            
            // 后端层
            int backX = 400;
            int backY = 150;
            svg.append("<rect x=\"").append(backX).append("\" y=\"").append(backY).append("\" width=\"").append(moduleWidth).append("\" height=\"").append(moduleHeight).append("\" rx=\"8\" fill=\"#f0fff4\" stroke=\"#48bb78\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(backX + moduleWidth/2).append("\" y=\"").append(backY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">后端层</text>");
            svg.append("<text x=\"").append(backX + 10).append("\" y=\"").append(backY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Spring Boot 应用</text>");
            svg.append("<text x=\"").append(backX + 10).append("\" y=\"").append(backY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• API 控制器</text>");
            svg.append("<text x=\"").append(backX + 10).append("\" y=\"").append(backY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• RESTful API</text>");
            
            // 分析层
            int analysisX = 650;
            int analysisY = 150;
            svg.append("<rect x=\"").append(analysisX).append("\" y=\"").append(analysisY).append("\" width=\"").append(moduleWidth).append("\" height=\"").append(moduleHeight).append("\" rx=\"8\" fill=\"#fff7e6\" stroke=\"#ed8936\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(analysisX + moduleWidth/2).append("\" y=\"").append(analysisY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">分析层</text>");
            svg.append("<text x=\"").append(analysisX + 10).append("\" y=\"").append(analysisY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• SpringBootProjectAnalyzer</text>");
            svg.append("<text x=\"").append(analysisX + 10).append("\" y=\"").append(analysisY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• JavaCodeIndexer</text>");
            svg.append("<text x=\"").append(analysisX + 10).append("\" y=\"").append(analysisY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• CodeIndexerFactory</text>");
            
            // 模型层
            int modelX = 900;
            int modelY = 150;
            svg.append("<rect x=\"").append(modelX).append("\" y=\"").append(modelY).append("\" width=\"").append(moduleWidth).append("\" height=\"").append(moduleHeight).append("\" rx=\"8\" fill=\"#faf5ff\" stroke=\"#9f7aea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(modelX + moduleWidth/2).append("\" y=\"").append(modelY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">模型层</text>");
            svg.append("<text x=\"").append(modelX + 10).append("\" y=\"").append(modelY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• KnowledgeGraph</text>");
            svg.append("<text x=\"").append(modelX + 10).append("\" y=\"").append(modelY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• GraphNode</text>");
            svg.append("<text x=\"").append(modelX + 10).append("\" y=\"").append(modelY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• GraphEdge</text>");
            
            // 数据源
            int dataX = 1150;
            int dataY = 150;
            svg.append("<rect x=\"").append(dataX).append("\" y=\"").append(dataY).append("\" width=\"").append(moduleWidth).append("\" height=\"").append(moduleHeight).append("\" rx=\"8\" fill=\"#e0f2fe\" stroke=\"#0ea5e9\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(dataX + moduleWidth/2).append("\" y=\"").append(dataY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">数据源</text>");
            svg.append("<text x=\"").append(dataX + 10).append("\" y=\"").append(dataY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 项目代码</text>");
            svg.append("<text x=\"").append(dataX + 10).append("\" y=\"").append(dataY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Maven 配置</text>");
            svg.append("<text x=\"").append(dataX + 10).append("\" y=\"").append(dataY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 应用配置</text>");
            
            // 箭头
            svg.append("<path d=\"M350 210 L400 210\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"400,210 390,205 390,215\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M600 210 L650 210\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"650,210 640,205 640,215\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M850 210 L900 210\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"900,210 890,205 890,215\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M1100 210 L1150 210\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"1150,210 1140,205 1140,215\" fill=\"#888888\"/>");
            
            // 反向箭头
            svg.append("<path d=\"M1350 270 L1150 370\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"1150,370 1160,365 1155,355\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M1100 370 L900 370\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"900,370 910,365 905,355\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M850 370 L650 370\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"650,370 660,365 655,355\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M600 370 L400 370\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"400,370 410,365 405,355\" fill=\"#888888\"/>");
            
            svg.append("<path d=\"M350 370 L150 270\" stroke=\"#888888\" stroke-width=\"2\" fill=\"none\"/>");
            svg.append("<polygon points=\"150,270 140,275 145,285\" fill=\"#888888\"/>");
            
            // 功能模块
            int featureX = 100;
            int featureY = 550;
            int featureWidth = 1400;
            int featureHeight = 500;
            svg.append("<rect x=\"").append(featureX).append("\" y=\"").append(featureY).append("\" width=\"").append(featureWidth).append("\" height=\"").append(featureHeight).append("\" rx=\"10\" fill=\"#f8fafc\" stroke=\"#e2e8f0\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(featureX + featureWidth/2).append("\" y=\"").append(featureY + 40).append("\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" text-anchor=\"middle\">功能模块</text>");
            
            // 前端功能
            int frontFeatureX = 150;
            int frontFeatureY = 600;
            int featureModuleWidth = 300;
            int featureModuleHeight = 180;
            svg.append("<rect x=\"").append(frontFeatureX).append("\" y=\"").append(frontFeatureY).append("\" width=\"").append(featureModuleWidth).append("\" height=\"").append(featureModuleHeight).append("\" rx=\"8\" fill=\"#f0f4ff\" stroke=\"#667eea\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(frontFeatureX + featureModuleWidth/2).append("\" y=\"").append(frontFeatureY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">前端功能</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 项目概览</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 知识图谱</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Context 查询</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 120).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Impact Analysis</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 140).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 交互导览</text>");
            svg.append("<text x=\"").append(frontFeatureX + 10).append("\" y=\"").append(frontFeatureY + 160).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 业务文档</text>");
            
            // API 接口
            int apiX = 500;
            int apiY = 600;
            svg.append("<rect x=\"").append(apiX).append("\" y=\"").append(apiY).append("\" width=\"").append(featureModuleWidth).append("\" height=\"").append(featureModuleHeight).append("\" rx=\"8\" fill=\"#f0fff4\" stroke=\"#48bb78\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(apiX + featureModuleWidth/2).append("\" y=\"").append(apiY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">API 接口</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/projectAnalysis</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/index</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/graph</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 120).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/generateArchitectureDiagram</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 140).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/context</text>");
            svg.append("<text x=\"").append(apiX + 10).append("\" y=\"").append(apiY + 160).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• /api/code/impact</text>");
            
            // 分析功能
            int analysisFeatureX = 850;
            int analysisFeatureY = 600;
            svg.append("<rect x=\"").append(analysisFeatureX).append("\" y=\"").append(analysisFeatureY).append("\" width=\"").append(featureModuleWidth).append("\" height=\"").append(featureModuleHeight).append("\" rx=\"8\" fill=\"#fff7e6\" stroke=\"#ed8936\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(analysisFeatureX + featureModuleWidth/2).append("\" y=\"").append(analysisFeatureY + 30).append("\" font-family=\"Arial\" font-size=\"16\" font-weight=\"bold\" text-anchor=\"middle\">分析功能</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 60).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 项目结构分析</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 80).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 代码索引</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 100).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 知识图谱生成</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 120).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• 架构图生成</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 140).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Context 分析</text>");
            svg.append("<text x=\"").append(analysisFeatureX + 10).append("\" y=\"").append(analysisFeatureY + 160).append("\" font-family=\"Arial\" font-size=\"12\" text-anchor=\"start\" fill=\"#666666\">• Impact 分析</text>");
            
            // 新人指南
            int guideX = 100;
            int guideY = 800;
            int guideWidth = 1400;
            int guideHeight = 250;
            svg.append("<rect x=\"").append(guideX).append("\" y=\"").append(guideY).append("\" width=\"").append(guideWidth).append("\" height=\"").append(guideHeight).append("\" rx=\"10\" fill=\"#fffbeb\" stroke=\"#fbbf24\" stroke-width=\"2\"/>");
            svg.append("<text x=\"").append(guideX + guideWidth/2).append("\" y=\"").append(guideY + 40).append("\" font-family=\"Arial\" font-size=\"18\" font-weight=\"bold\" text-anchor=\"middle\">新人上手指南</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 80).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 入口点：CodeAnalyzerController.java 中的 REST API 端点</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 110).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 核心分析：SpringBootProjectAnalyzer.java 负责项目结构分析</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 140).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 知识图谱：JavaCodeIndexer.java 负责代码索引和图谱生成</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 170).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 前端界面：index.html 提供用户交互界面</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 200).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 启动方式：运行 CodeAnalyzerApplication.java 或使用 mvn spring-boot:run</text>");
            svg.append("<text x=\"").append(guideX + 30).append("\" y=\"").append(guideY + 230).append("\" font-family=\"Arial\" font-size=\"14\" text-anchor=\"start\" fill=\"#666666\">• 访问地址：http://localhost:8083/</text>");
        }
        
        svg.append("</svg>");
        return svg.toString();
    }

    // ==================== Response Classes ====================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexRequest {
        private String projectCode;
        private String repoPath;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexResponse {
        private boolean success;
        private Integer nodeCount;
        private Integer edgeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectAnalysisResponse {
        private SpringBootProjectAnalyzer.ProjectAnalysisResult analysis;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextResponse {
        private GraphNode node;
        private List<GraphEdge> incomingEdges;
        private List<GraphEdge> outgoingEdges;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactResponse {
        private GraphNode node;
        private List<GraphNode> upstreamImpact;
        private List<GraphNode> downstreamImpact;
        private Integer totalImpactCount;
        private String riskLevel;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectChangesRequest {
        private List<String> changedFiles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectChangesResponse {
        private List<GraphNode> changedNodes;
        private List<GraphNode> impactedNodes;
        private Integer totalImpactCount;
        private String riskLevel;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueryRequest {
        private String nodeType;
        private String nameContains;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QueryResponse {
        private List<GraphNode> nodes;
        private Integer nodeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiRoute {
        private String route;
        private String controllerClass;
        private String methodName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiRouteMapResponse {
        private List<ApiRoute> apiRoutes;
        private Integer routeCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MCPQueryRequest {
        private String queryType;
        private String query;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MCPQueryResponse {
        private List<GraphNode> results;
        private Integer resultCount;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallChainItem {
        private GraphNode node;
        private Integer depth;
        private String relationship;
        private String path;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallChainResponse {
        private GraphNode startNode;
        private List<CallChainItem> upstreamChain;
        private List<CallChainItem> downstreamChain;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExampleQuery {
        private String name;
        private String description;
        private String queryType;
        private String queryKeyword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExampleQueriesResponse {
        private List<ExampleQuery> examples;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComponentDetailResponse {
        private SpringBootProjectAnalyzer.ComponentDetail detail;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentationResponse {
        private String documentation;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageGuideResponse {
        private SpringBootProjectAnalyzer.UsageGuide guide;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArchitectureDiagramResponse {
        private String diagram;
        private String error;
    }
}
