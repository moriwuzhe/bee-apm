package org.xi.lt.apm.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.xi.lt.apm.entity.*;
import org.xi.lt.apm.repository.*;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private AlertRuleRepository alertRuleRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private TraceSpanRepository traceSpanRepository;

    @Autowired
    private MetricRepository metricRepository;

    @Override
    public void run(String... args) throws Exception {
        // 初始化权限、角色、用户
        initPermissions();
        initRoles();
        initUsers();
        
        // 初始化测试数据（项目、应用、告警、发布、追踪、指标）
        // initProjects();
        // initApplications();
        // initAlertRules();
        // initReleases();
        // initAlerts();
        // initTraceSpans();
        // initMetrics();
    }

    private void initPermissions() {
        String[][] permData = {
                {"project:view", "查看项目", "项目管理"},
                {"project:create", "创建项目", "项目管理"},
                {"project:edit", "编辑项目", "项目管理"},
                {"project:delete", "删除项目", "项目管理"},
                {"app:view", "查看应用", "应用管理"},
                {"app:create", "创建应用", "应用管理"},
                {"app:edit", "编辑应用", "应用管理"},
                {"app:deploy", "部署应用", "应用管理"},
                {"monitor:view", "查看监控", "监控运维"},
                {"monitor:alert", "告警配置", "监控运维"},
                {"agent:manage", "Agent管控", "监控运维"},
                {"jvm:view", "JVM监控", "监控运维"},
                {"release:view", "查看发布", "版本发布"},
                {"release:create", "创建发布", "版本发布"},
                {"release:rollback", "回滚版本", "版本发布"},
                {"user:manage", "用户管理", "系统设置"},
                {"role:manage", "角色管理", "系统设置"},
                {"perm:manage", "权限管理", "系统设置"},
                {"system:config", "系统配置", "系统设置"}
        };

        for (String[] data : permData) {
            Permission perm = new Permission();
            perm.setCode(data[0]);
            perm.setName(data[1]);
            perm.setModule(data[2]);
            permissionRepository.save(perm);
        }
    }

    private void initRoles() {
        Role superAdmin = new Role();
        superAdmin.setName("超级管理员");
        superAdmin.setDescription("拥有全部系统权限，不可删除");
        superAdmin.setColor("#FF4D4F");
        superAdmin.setIsSystem(true);
        superAdmin.setPermissions(new HashSet<>(permissionRepository.findAll()));
        roleRepository.save(superAdmin);

        Role opsAdmin = new Role();
        opsAdmin.setName("运维管理员");
        opsAdmin.setDescription("管理基础设施、监控、Agent等运维功能");
        opsAdmin.setColor("#165DFF");
        opsAdmin.setIsSystem(false);
        roleRepository.save(opsAdmin);

        Role projectOwner = new Role();
        projectOwner.setName("项目负责人");
        projectOwner.setDescription("管理所属项目及应用，可查看监控数据");
        projectOwner.setColor("#A855F7");
        projectOwner.setIsSystem(false);
        roleRepository.save(projectOwner);

        Role opsEngineer = new Role();
        opsEngineer.setName("运维工程师");
        opsEngineer.setDescription("执行运维操作，查看系统监控");
        opsEngineer.setColor("#00D68F");
        opsEngineer.setIsSystem(false);
        roleRepository.save(opsEngineer);

        Role devEngineer = new Role();
        devEngineer.setName("开发工程师");
        devEngineer.setDescription("查看应用信息、发布版本、基本监控");
        devEngineer.setColor("#94A3B8");
        devEngineer.setIsSystem(false);
        roleRepository.save(devEngineer);
    }

    private void initUsers() {
        Role superAdmin = roleRepository.findById(1L).orElse(null);
        Role opsAdmin = roleRepository.findById(2L).orElse(null);
        Role projectOwner = roleRepository.findById(3L).orElse(null);
        Role devEngineer = roleRepository.findById(5L).orElse(null);

        User user1 = new User();
        user1.setName("张伟");
        user1.setAccount("zhangwei");
        user1.setPassword("123456");
        user1.setEmail("zhangwei@opswatch.com");
        user1.setStatus("online");
        if (superAdmin != null) {
            user1.setRoles(new HashSet<>(Arrays.asList(superAdmin)));
        }
        user1.setLastLoginAt(LocalDateTime.now());
        user1.setLastLoginIp("192.168.1.100");
        user1.setLoginCount(248);
        userRepository.save(user1);

        User user2 = new User();
        user2.setName("李明");
        user2.setAccount("liming");
        user2.setPassword("123456");
        user2.setEmail("liming@opswatch.com");
        user2.setStatus("online");
        if (opsAdmin != null) {
            user2.setRoles(new HashSet<>(Arrays.asList(opsAdmin)));
        }
        user2.setLastLoginAt(LocalDateTime.now());
        user2.setLastLoginIp("192.168.1.101");
        user2.setLoginCount(186);
        userRepository.save(user2);

        User user3 = new User();
        user3.setName("王芳");
        user3.setAccount("wangfang");
        user3.setPassword("123456");
        user3.setEmail("wangfang@opswatch.com");
        user3.setStatus("offline");
        if (projectOwner != null) {
            user3.setRoles(new HashSet<>(Arrays.asList(projectOwner)));
        }
        user3.setLastLoginAt(LocalDateTime.now().minusDays(1));
        user3.setLastLoginIp("10.0.2.15");
        user3.setLoginCount(132);
        userRepository.save(user3);

        User user4 = new User();
        user4.setName("刘强");
        user4.setAccount("liuqiang");
        user4.setPassword("123456");
        user4.setEmail("liuqiang@opswatch.com");
        user4.setStatus("online");
        if (devEngineer != null) {
            user4.setRoles(new HashSet<>(Arrays.asList(devEngineer)));
        }
        user4.setLastLoginAt(LocalDateTime.now().minusDays(3));
        user4.setLastLoginIp("192.168.2.50");
        user4.setLoginCount(95);
        userRepository.save(user4);

        User user5 = new User();
        user5.setName("陈静");
        user5.setAccount("chenjing");
        user5.setPassword("123456");
        user5.setEmail("chenjing@opswatch.com");
        user5.setStatus("online");
        if (opsAdmin != null) {
            user5.setRoles(new HashSet<>(Arrays.asList(opsAdmin)));
        }
        user5.setLastLoginAt(LocalDateTime.now());
        user5.setLastLoginIp("192.168.1.105");
        user5.setLoginCount(204);
        userRepository.save(user5);
        
        User user6 = new User();
        user6.setName("赵磊");
        user6.setAccount("zhaolei");
        user6.setPassword("123456");
        user6.setEmail("zhaolei@opswatch.com");
        user6.setStatus("online");
        if (devEngineer != null) {
            user6.setRoles(new HashSet<>(Arrays.asList(devEngineer)));
        }
        user6.setLastLoginAt(LocalDateTime.now());
        user6.setLastLoginIp("192.168.1.106");
        user6.setLoginCount(156);
        userRepository.save(user6);
    }

    private void initProjects() {
        Project p1 = new Project();
        p1.setName("电商平台");
        p1.setGroupName("交易中心");
        p1.setEnv("production");
        p1.setDescription("核心电商交易平台");
        p1.setOwner("张伟");
        p1.setStatus("online");
        projectRepository.save(p1);

        Project p2 = new Project();
        p2.setName("会员系统");
        p2.setGroupName("用户中心");
        p2.setEnv("staging");
        p2.setDescription("会员管理系统");
        p2.setOwner("李明");
        p2.setStatus("online");
        projectRepository.save(p2);

        Project p3 = new Project();
        p3.setName("数据分析");
        p3.setGroupName("数据中心");
        p3.setEnv("production");
        p3.setDescription("大数据分析平台");
        p3.setOwner("王芳");
        p3.setStatus("warning");
        projectRepository.save(p3);

        Project p4 = new Project();
        p4.setName("营销系统");
        p4.setGroupName("营销中心");
        p4.setEnv("dev");
        p4.setDescription("营销活动管理系统");
        p4.setOwner("刘强");
        p4.setStatus("online");
        projectRepository.save(p4);

        Project p5 = new Project();
        p5.setName("供应链");
        p5.setGroupName("供应链中心");
        p5.setEnv("production");
        p5.setDescription("供应链管理系统");
        p5.setOwner("陈静");
        p5.setStatus("offline");
        projectRepository.save(p5);
    }

    private void initApplications() {
        List<Project> projects = projectRepository.findAll();
        Project p1 = projects.get(0);
        Project p2 = projects.size() > 1 ? projects.get(1) : p1;
        Project p3 = projects.size() > 2 ? projects.get(2) : p1;

        Application app1 = new Application();
        app1.setName("order-service");
        app1.setProject(p1);
        app1.setProjectId(p1.getId());
        app1.setStatus("online");
        app1.setIp("192.168.1.10");
        app1.setAgentVersion("v2.4.1");
        app1.setJvmVersion("17");
        app1.setHeapUsage(68.0);
        app1.setUptime("2d 15h");
        app1.setInstanceCount(3);
        app1.setEnv("production");
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setName("payment-gateway");
        app2.setProject(p1);
        app2.setProjectId(p1.getId());
        app2.setStatus("online");
        app2.setIp("192.168.1.11");
        app2.setAgentVersion("v2.4.0");
        app2.setJvmVersion("17");
        app2.setHeapUsage(45.0);
        app2.setUptime("1d 8h");
        app2.setInstanceCount(2);
        app2.setEnv("production");
        applicationRepository.save(app2);

        Application app3 = new Application();
        app3.setName("user-service");
        app3.setProject(p2);
        app3.setProjectId(p2.getId());
        app3.setStatus("warning");
        app3.setIp("192.168.1.12");
        app3.setAgentVersion("v2.3.9");
        app3.setJvmVersion("11");
        app3.setHeapUsage(82.0);
        app3.setUptime("5d 2h");
        app3.setInstanceCount(4);
        app3.setEnv("production");
        applicationRepository.save(app3);

        Application app4 = new Application();
        app4.setName("inventory-service");
        app4.setProject(p1);
        app4.setProjectId(p1.getId());
        app4.setStatus("online");
        app4.setIp("192.168.1.13");
        app4.setAgentVersion("v2.4.1");
        app4.setJvmVersion("17");
        app4.setHeapUsage(55.0);
        app4.setUptime("3d 10h");
        app4.setInstanceCount(2);
        app4.setEnv("production");
        applicationRepository.save(app4);

        Application app5 = new Application();
        app5.setName("notification-service");
        app5.setProject(p1);
        app5.setProjectId(p1.getId());
        app5.setStatus("error");
        app5.setIp("192.168.1.14");
        app5.setAgentVersion("v2.4.0");
        app5.setJvmVersion("17");
        app5.setHeapUsage(95.0);
        app5.setUptime("30m");
        app5.setInstanceCount(1);
        app5.setEnv("production");
        applicationRepository.save(app5);

        Application app6 = new Application();
        app6.setName("recommendation-engine");
        app6.setProject(p3);
        app6.setProjectId(p3.getId());
        app6.setStatus("online");
        app6.setIp("192.168.1.15");
        app6.setAgentVersion("v2.4.1");
        app6.setJvmVersion("17");
        app6.setHeapUsage(72.0);
        app6.setUptime("4d 6h");
        app6.setInstanceCount(3);
        app6.setEnv("production");
        applicationRepository.save(app6);
    }

    private void initAlertRules() {
        AlertRule rule1 = new AlertRule();
        rule1.setName("CPU使用率告警");
        rule1.setAppName("order-service");
        rule1.setMetric("cpu_usage");
        rule1.setCondition(">");
        rule1.setThreshold(85.0);
        rule1.setLevel("error");
        rule1.setStatus("online");
        rule1.setChannels("email,sms");
        alertRuleRepository.save(rule1);

        AlertRule rule2 = new AlertRule();
        rule2.setName("内存使用率告警");
        rule2.setAppName("user-service");
        rule2.setMetric("memory_usage");
        rule2.setCondition(">");
        rule2.setThreshold(90.0);
        rule2.setLevel("warning");
        rule2.setStatus("online");
        rule2.setChannels("email");
        alertRuleRepository.save(rule2);

        AlertRule rule3 = new AlertRule();
        rule3.setName("磁盘使用率告警");
        rule3.setAppName("payment-gateway");
        rule3.setMetric("disk_usage");
        rule3.setCondition(">");
        rule3.setThreshold(80.0);
        rule3.setLevel("info");
        rule3.setStatus("online");
        rule3.setChannels("email,webhook");
        alertRuleRepository.save(rule3);

        AlertRule rule4 = new AlertRule();
        rule4.setName("响应时间告警");
        rule4.setAppName("notification-service");
        rule4.setMetric("response_time");
        rule4.setCondition(">");
        rule4.setThreshold(500.0);
        rule4.setLevel("error");
        rule4.setStatus("disabled");
        rule4.setChannels("sms");
        alertRuleRepository.save(rule4);

        AlertRule rule5 = new AlertRule();
        rule5.setName("错误率告警");
        rule5.setAppName("inventory-service");
        rule5.setMetric("error_rate");
        rule5.setCondition(">");
        rule5.setThreshold(5.0);
        rule5.setLevel("error");
        rule5.setStatus("online");
        rule5.setChannels("email,sms");
        alertRuleRepository.save(rule5);

        AlertRule rule6 = new AlertRule();
        rule6.setName("线程池告警");
        rule6.setAppName("recommendation-engine");
        rule6.setMetric("thread_pool");
        rule6.setCondition(">");
        rule6.setThreshold(95.0);
        rule6.setLevel("warning");
        rule6.setStatus("online");
        rule6.setChannels("email");
        alertRuleRepository.save(rule6);
    }

    private void initReleases() {
        Release r1 = new Release();
        r1.setAppName("order-service");
        r1.setVersion("v3.2.1");
        r1.setPrevVersion("v3.2.0");
        r1.setEnv("production");
        r1.setStatus("online");
        r1.setOperator("张伟");
        r1.setChanges("修复订单创建失败问题,优化支付回调逻辑,添加日志监控");
        releaseRepository.save(r1);

        Release r2 = new Release();
        r2.setAppName("payment-gateway");
        r2.setVersion("v2.5.0");
        r2.setPrevVersion("v2.4.1");
        r2.setEnv("staging");
        r2.setStatus("online");
        r2.setOperator("李明");
        r2.setChanges("支持新支付渠道,优化退款流程");
        releaseRepository.save(r2);

        Release r3 = new Release();
        r3.setAppName("user-service");
        r3.setVersion("v4.0.0");
        r3.setPrevVersion("v3.8.2");
        r3.setEnv("production");
        r3.setStatus("error");
        r3.setOperator("王芳");
        r3.setChanges("重构用户认证模块,添加OAuth2支持,优化数据库查询");
        releaseRepository.save(r3);

        Release r4 = new Release();
        r4.setAppName("inventory-service");
        r4.setVersion("v1.8.0");
        r4.setPrevVersion("v1.7.5");
        r4.setEnv("dev");
        r4.setStatus("online");
        r4.setOperator("刘强");
        r4.setChanges("添加库存预警功能,优化库存同步");
        releaseRepository.save(r4);
    }

    private void initAlerts() {
        Alert alert1 = new Alert();
        alert1.setAppName("order-service");
        alert1.setEnv("production");
        alert1.setType("error");
        alert1.setLevel("critical");
        alert1.setStatus("active");
        alertRepository.save(alert1);

        Alert alert2 = new Alert();
        alert2.setAppName("user-service");
        alert2.setEnv("production");
        alert2.setType("warning");
        alert2.setLevel("warning");
        alert2.setStatus("active");
        alertRepository.save(alert2);

        Alert alert3 = new Alert();
        alert3.setAppName("payment-gateway");
        alert3.setEnv("production");
        alert3.setType("info");
        alert3.setLevel("info");
        alert3.setStatus("active");
        alertRepository.save(alert3);
    }

    private void initTraceSpans() {
        String[] appNames = {"order-service", "payment-gateway", "user-service", "inventory-service"};
        String[] spanTypes = {"HTTP", "SQL", "REDIS", "RPC", "LOCAL"};
        Random random = new Random();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 50; i++) {
            TraceSpan span = new TraceSpan();
            String traceId = "trace-" + (random.nextInt(10) + 1);
            span.setTraceId(traceId);
            span.setSpanType(spanTypes[random.nextInt(spanTypes.length)]);
            String appName = appNames[random.nextInt(appNames.length)];
            span.setAppName(appName);
            span.setServiceName(appName + ".service");
            span.setMethodName(i % 2 == 0 ? "getOrder" : "createPayment");
            span.setDuration((long) (random.nextInt(500) + 50));
            span.setTimestamp(now.minusMinutes(random.nextInt(60 * 24)));
            span.setSuccess(random.nextBoolean());
            if (!span.getSuccess()) {
                span.setErrorMsg("Connection timeout");
            }
            span.setTags("{\"env\": \"production\", \"version\": \"v1.2.3\"}");
            traceSpanRepository.save(span);
        }
    }

    private void initMetrics() {
        String[] metricTypes = {"cpu_usage", "memory_usage", "heap_usage", "thread_count"};
        String[] appNames = {"order-service", "payment-gateway", "user-service"};
        Random random = new Random();

        for (String appName : appNames) {
            for (int i = 0; i < 24; i++) {
                Metric metric = new Metric();
                metric.setAppName(appName);
                metric.setMetricType(metricTypes[random.nextInt(metricTypes.length)]);
                metric.setValue(30.0 + random.nextDouble() * 70.0);
                metric.setTimePoint(System.currentTimeMillis() - (long) i * 3600 * 1000);
                metricRepository.save(metric);
            }
        }
    }
}
