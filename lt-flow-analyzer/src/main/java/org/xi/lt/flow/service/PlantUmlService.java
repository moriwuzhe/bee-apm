package org.xi.lt.flow.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Base64;

/**
 * PlantUML 服务
 * 支持所有 PlantUML 图表类型的生成和渲染
 */
@Slf4j
@Service
public class PlantUmlService {

    /**
     * 将 PlantUML 源码渲染为 PNG 图片
     */
    public byte[] renderToPng(String plantUmlSource) throws IOException {
        SourceStringReader reader = new SourceStringReader(plantUmlSource);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        reader.outputImage(outputStream, new FileFormatOption(FileFormat.PNG));

        return outputStream.toByteArray();
    }

    /**
     * 将 PlantUML 源码渲染为 SVG
     */
    public byte[] renderToSvg(String plantUmlSource) throws IOException {
        SourceStringReader reader = new SourceStringReader(plantUmlSource);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

        reader.outputImage(outputStream, new FileFormatOption(FileFormat.SVG));

        return outputStream.toByteArray();
    }

    /**
     * 将 PlantUML 源码渲染为 Base64 编码的 PNG
     */
    public String renderToBase64Png(String plantUmlSource) throws IOException {
        byte[] pngData = renderToPng(plantUmlSource);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
    }

    /**
     * 将 PlantUML 源码渲染为 Base64 编码的 SVG
     */
    public String renderToBase64Svg(String plantUmlSource) throws IOException {
        byte[] svgData = renderToSvg(plantUmlSource);
        return "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svgData);
    }

    /**
     * 渲染并保存为文件
     */
    public File renderToFile(String plantUmlSource, File outputFile, FileFormat format) throws IOException {
        SourceStringReader reader = new SourceStringReader(plantUmlSource);

        try (FileOutputStream fos = new FileOutputStream(outputFile)) {
            reader.outputImage(fos, new FileFormatOption(format));
        }

        log.info("PlantUML 图表已渲染到: {}", outputFile.getAbsolutePath());
        return outputFile;
    }

    /**
     * 验证 PlantUML 源码是否有效
     */
    public boolean isValidPlantUml(String plantUmlSource) {
        try {
            SourceStringReader reader = new SourceStringReader(plantUmlSource);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            reader.outputImage(outputStream, new FileFormatOption(FileFormat.PNG));
            return outputStream.size() > 0;
        } catch (Exception e) {
            log.warn("PlantUML 源码验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 生成空的 UML 图模板
     */
    public String generateTemplate(DiagramType type) {
        switch (type) {
            case SEQUENCE:
                return generateSequenceTemplate();
            case CLASS:
                return generateClassTemplate();
            case USECASE:
                return generateUseCaseTemplate();
            case ACTIVITY:
                return generateActivityTemplate();
            case COMPONENT:
                return generateComponentTemplate();
            case STATE:
                return generateStateTemplate();
            case OBJECT:
                return generateObjectTemplate();
            case DEPLOYMENT:
                return generateDeploymentTemplate();
            case TIMING:
                return generateTimingTemplate();
            case COMMUNICATION:
                return generateCommunicationTemplate();
            case ENTITY_RELATIONSHIP:
                return generateEntityRelationshipTemplate();
            case MINDMAP:
                return generateMindmapTemplate();
            case WBS:
                return generateWbsTemplate();
            case GANTT:
                return generateGanttTemplate();
            case JSON:
                return generateJsonTemplate();
            case YAML:
                return generateYamlTemplate();
            case NETWORK:
                return generateNetworkTemplate();
            case WORK_BREAKDOWN:
                return generateWorkBreakdownTemplate();
            default:
                return generateSequenceTemplate();
        }
    }

    private String generateSequenceTemplate() {
        return "@startuml\n" +
               "Alice -> Bob: Authentication Request\n" +
               "Bob --> Alice: Authentication Response\n" +
               "\n" +
               "Alice -> Bob: Another authentication Request\n" +
               "Alice <-- Bob: Another authentication Response\n" +
               "@enduml";
    }

    private String generateClassTemplate() {
        return "@startuml\n" +
               "class Class01 {\n" +
               "  String data\n" +
               "  void methods()\n" +
               "}\n" +
               "\n" +
               "class Class02\n" +
               "Class01 <|-- Class02\n" +
               "@enduml";
    }

    private String generateUseCaseTemplate() {
        return "@startuml\n" +
               "left to right direction\n" +
               "skinparam packageStyle rectangle\n" +
               "\n" +
               "actor User\n" +
               "actor Administrator\n" +
               "\n" +
               "rectangle System {\n" +
               "  User --> (Login)\n" +
               "  User --> (View Profile)\n" +
               "  Administrator --> (Manage Users)\n" +
               "  (Manage Users) .> (Login) : <<include>>\n" +
               "}\n" +
               "@enduml";
    }

    private String generateActivityTemplate() {
        return "@startuml\n" +
               "start\n" +
               ":Click on button;\n" +
               "if (Is logged in?) then (yes)\n" +
               "  :Show dashboard;\n" +
               "else (no)\n" +
               "  :Show login form;\n" +
               "endif\n" +
               "stop\n" +
               "@enduml";
    }

    private String generateComponentTemplate() {
        return "@startuml\n" +
               "package \"Frontend\" {\n" +
               "  [Web App] as web\n" +
               "  [Mobile App] as mobile\n" +
               "}\n" +
               "\n" +
               "package \"Backend\" {\n" +
               "  [API Gateway] as gateway\n" +
               "  [User Service] as userService\n" +
               "  [Order Service] as orderService\n" +
               "}\n" +
               "\n" +
               "web --> gateway\n" +
               "mobile --> gateway\n" +
               "gateway --> userService\n" +
               "gateway --> orderService\n" +
               "@enduml";
    }

    private String generateStateTemplate() {
        return "@startuml\n" +
               "[*] --> State1\n" +
               "State1 --> [*]\n" +
               "State1 : this is a string\n" +
               "State1 : this is another string\n" +
               "State1 -> State2\n" +
               "State2 --> [*]\n" +
               "@enduml";
    }

    private String generateObjectTemplate() {
        return "@startuml\n" +
               "object user {\n" +
               "  name = \"John Doe\"\n" +
               "  age = 30\n" +
               "}\n" +
               "\n" +
               "object order {\n" +
               "  id = \"12345\"\n" +
               "  status = \"pending\"\n" +
               "}\n" +
               "\n" +
               "user -- order : places\n" +
               "@enduml";
    }

    private String generateDeploymentTemplate() {
        return "@startuml\n" +
               "node \"Load Balancer\" {\n" +
               "  [Nginx] as nginx\n" +
               "}\n" +
               "\n" +
               "node \"Web Server\" {\n" +
               "  [Tomcat] as tomcat\n" +
               "  [App] as app\n" +
               "}\n" +
               "\n" +
               "node \"Database\" {\n" +
               "  [PostgreSQL] as db\n" +
               "}\n" +
               "\n" +
               "nginx --> tomcat\n" +
               "tomcat --> app\n" +
               "app --> db\n" +
               "@enduml";
    }

    private String generateTimingTemplate() {
        return "@startuml\n" +
               "concise \"User\" as user\n" +
               "concise \"System\" as system\n" +
               "\n" +
               "@0\n" +
               "user is Idle\n" +
               "system is Idle\n" +
               "\n" +
               "@100\n" +
               "user is Active\n" +
               "user -> system : Request\n" +
               "\n" +
               "@200\n" +
               "system is Processing\n" +
               "\n" +
               "@300\n" +
               "system is Idle\n" +
               "system -> user : Response\n" +
               "\n" +
               "@400\n" +
               "user is Idle\n" +
               "@enduml";
    }

    private String generateCommunicationTemplate() {
        return "@startuml\n" +
               "actor User\n" +
               "participant \"Web App\" as web\n" +
               "participant \"API\" as api\n" +
               "participant \"Database\" as db\n" +
               "\n" +
               "User -> web : 1. Click button\n" +
               "web -> api : 2. POST /api/data\n" +
               "api -> db : 3. SELECT *\n" +
               "db --> api : 4. Result set\n" +
               "api --> web : 5. JSON response\n" +
               "web --> User : 6. Show data\n" +
               "@enduml";
    }

    private String generateEntityRelationshipTemplate() {
        return "@startuml\n" +
               "\"User\" {\n" +
               "  *id : int <<PK>>\n" +
               "  ---\n" +
               "  name : varchar\n" +
               "  email : varchar\n" +
               "}\n" +
               "\n" +
               "\"Order\" {\n" +
               "  *id : int <<PK>>\n" +
               "  ---\n" +
               "  user_id : int <<FK>>\n" +
               "  total : decimal\n" +
               "}\n" +
               "\n" +
               "User ||..o{ Order\n" +
               "@enduml";
    }

    private String generateMindmapTemplate() {
        return "@startmindmap\n" +
               "* Root\n" +
               "** Branch 1\n" +
               "*** Leaf 1.1\n" +
               "*** Leaf 1.2\n" +
               "** Branch 2\n" +
               "*** Leaf 2.1\n" +
               "*** Leaf 2.2\n" +
               "@endmindmap";
    }

    private String generateWbsTemplate() {
        return "@startwbs\n" +
               "* Project\n" +
               "** Phase 1\n" +
               "*** Task 1.1\n" +
               "*** Task 1.2\n" +
               "** Phase 2\n" +
               "*** Task 2.1\n" +
               "*** Task 2.2\n" +
               "@endwbs";
    }

    private String generateGanttTemplate() {
        return "@startgantt\n" +
               "Project starts 2024-01-01\n" +
               "skinparam backgroundColor #FEFEFE\n" +
               "\n" +
               "[Task 1] lasts 10 days\n" +
               "[Task 2] lasts 5 days\n" +
               "[Task 2] starts at [Task 1]'s end\n" +
               "[Task 3] lasts 8 days\n" +
               "[Task 3] starts at [Task 1]'s end\n" +
               "@endgantt";
    }

    private String generateJsonTemplate() {
        return "@startjson\n" +
               "{\n" +
               "  \"name\": \"John\",\n" +
               "  \"age\": 30,\n" +
               "  \"address\": {\n" +
               "    \"street\": \"123 Main St\",\n" +
               "    \"city\": \"New York\"\n" +
               "  },\n" +
               "  \"hobbies\": [\"reading\", \"coding\"]\n" +
               "}\n" +
               "@endjson";
    }

    private String generateYamlTemplate() {
        return "@startyaml\n" +
               "name: John\n" +
               "age: 30\n" +
               "address:\n" +
               "  street: 123 Main St\n" +
               "  city: New York\n" +
               "hobbies:\n" +
               "  - reading\n" +
               "  - coding\n" +
               "@endyaml";
    }

    private String generateNetworkTemplate() {
        return "@startuml\n" +
               "nwdiag {\n" +
               "  network dmz {\n" +
               "    web01; web02;\n" +
               "  }\n" +
               "  network internal {\n" +
               "    web01; web02; db01;\n" +
               "  }\n" +
               "}\n" +
               "@enduml";
    }

    private String generateWorkBreakdownTemplate() {
        return "@startwbs\n" +
               "* Project\n" +
               "** Requirements\n" +
               "*** Functional Requirements\n" +
               "*** Non-functional Requirements\n" +
               "** Design\n" +
               "*** Architecture Design\n" +
               "*** Detailed Design\n" +
               "** Implementation\n" +
               "*** Backend Development\n" +
               "*** Frontend Development\n" +
               "** Testing\n" +
               "*** Unit Tests\n" +
               "*** Integration Tests\n" +
               "@endwbs";
    }

    /**
     * 图表类型枚举
     */
    public enum DiagramType {
        SEQUENCE,        // 时序图
        CLASS,           // 类图
        USECASE,         // 用例图
        ACTIVITY,        // 活动图
        COMPONENT,       // 组件图
        STATE,           // 状态图
        OBJECT,          // 对象图
        DEPLOYMENT,      // 部署图
        TIMING,          // 时序图（时间图）
        COMMUNICATION,   // 通信图
        ENTITY_RELATIONSHIP, // ER图
        MINDMAP,         // 思维导图
        WBS,             // 工作分解结构
        GANTT,           // 甘特图
        JSON,            // JSON数据图
        YAML,            // YAML数据图
        NETWORK,         // 网络图
        WORK_BREAKDOWN   // 工作分解
    }
}
