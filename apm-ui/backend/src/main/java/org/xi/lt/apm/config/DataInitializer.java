package org.xi.lt.apm.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.xi.lt.apm.entity.*;
import org.xi.lt.apm.repository.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;

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
    private AlertRepository alertRepository;

    @Autowired
    private ReleaseRepository releaseRepository;

    @Autowired
    private AlertRuleRepository alertRuleRepository;

    @Override
    public void run(String... args) throws Exception {
        initPermissions();
        initRoles();
        initUsers();
        initProjects();
        initApplications();
        initAlerts();
        initReleases();
        initAlertRules();
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
        user1.setEmail("zhangwei@corp.com");
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
        user2.setEmail("liming@corp.com");
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
        user3.setEmail("wangfang@corp.com");
        user3.setStatus("warning");
        if (projectOwner != null) {
            user3.setRoles(new HashSet<>(Arrays.asList(projectOwner)));
        }
        user3.setLastLoginAt(LocalDateTime.now().minusDays(1));
        user3.setLastLoginIp("10.0.2.15");
        user3.setLoginCount(132);
        userRepository.save(user3);

        User user4 = new User();
        user4.setName("赵强");
        user4.setAccount("zhaoqiang");
        user4.setPassword("123456");
        user4.setEmail("zhaoqiang@corp.com");
        user4.setStatus("offline");
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
        user5.setEmail("chenjing@corp.com");
        user5.setStatus("online");
        if (opsAdmin != null) {
            user5.setRoles(new HashSet<>(Arrays.asList(opsAdmin)));
        }
        user5.setLastLoginAt(LocalDateTime.now());
        user5.setLastLoginIp("192.168.1.105");
        user5.setLoginCount(204);
        userRepository.save(user5);
    }

    private void initProjects() {
        Project p1 = new Project();
        p1.setName("电商核心平台");
        p1.setGroupName("生产");
        p1.setEnv("production");
        p1.setDescription("包含订单、支付、用户等核心服务");
        p1.setOwner("张伟");
        p1.setStatus("online");
        projectRepository.save(p1);

        Project p2 = new Project();
        p2.setName("物流调度系统");
        p2.setGroupName("生产");
        p2.setEnv("production");
        p2.setDescription("货物追踪与路由调度");
        p2.setOwner("李明");
        p2.setStatus("warning");
        projectRepository.save(p2);

        Project p3 = new Project();
        p3.setName("数据分析平台");
        p3.setGroupName("测试");
        p3.setEnv("staging");
        p3.setDescription("实时数据处理与分析");
        p3.setOwner("王芳");
        p3.setStatus("online");
        projectRepository.save(p3);

        Project p4 = new Project();
        p4.setName("用户增长系统");
        p4.setGroupName("开发");
        p4.setEnv("dev");
        p4.setDescription("用户拉新留存");
        p4.setOwner("赵强");
        p4.setStatus("offline");
        projectRepository.save(p4);

        Project p5 = new Project();
        p5.setName("消息通知中心");
        p5.setGroupName("生产");
        p5.setEnv("production");
        p5.setDescription("SMS/邮件/Push 统一网关");
        p5.setOwner("陈静");
        p5.setStatus("online");
        projectRepository.save(p5);
    }

    private void initApplications() {
        Project p1 = projectRepository.findById(1L).orElse(null);
        Project p2 = projectRepository.findById(2L).orElse(null);
        Project p3 = projectRepository.findById(3L).orElse(null);
        Project p5 = projectRepository.findById(5L).orElse(null);

        Application app1 = new Application();
        app1.setName("order-service");
        app1.setProject(p1);
        app1.setStatus("error");
        app1.setIp("192.168.1.10");
        app1.setAgentVersion("v2.4.1");
        app1.setJvmVersion("JDK17");
        app1.setHeapUsage(92.5);
        app1.setUptime("12d 4h");
        app1.setInstanceCount(3);
        applicationRepository.save(app1);

        Application app2 = new Application();
        app2.setName("payment-gateway");
        app2.setProject(p1);
        app2.setStatus("online");
        app2.setIp("192.168.1.11");
        app2.setAgentVersion("v2.4.1");
        app2.setJvmVersion("JDK11");
        app2.setHeapUsage(65.3);
        app2.setUptime("24d 2h");
        app2.setInstanceCount(2);
        applicationRepository.save(app2);

        Application app3 = new Application();
        app3.setName("user-service");
        app3.setProject(p1);
        app3.setStatus("warning");
        app3.setIp("192.168.1.12");
        app3.setAgentVersion("v2.3.8");
        app3.setJvmVersion("JDK17");
        app3.setHeapUsage(78.2);
        app3.setUptime("8d 16h");
        app3.setInstanceCount(4);
        applicationRepository.save(app3);

        Application app4 = new Application();
        app4.setName("inventory-service");
        app4.setProject(p1);
        app4.setStatus("online");
        app4.setIp("192.168.1.13");
        app4.setAgentVersion("v2.4.1");
        app4.setJvmVersion("JDK11");
        app4.setHeapUsage(45.8);
        app4.setUptime("30d 0h");
        app4.setInstanceCount(2);
        applicationRepository.save(app4);

        Application app5 = new Application();
        app5.setName("route-scheduler");
        app5.setProject(p2);
        app5.setStatus("warning");
        app5.setIp("192.168.2.10");
        app5.setAgentVersion("v2.4.0");
        app5.setJvmVersion("JDK17");
        app5.setHeapUsage(82.1);
        app5.setUptime("5d 8h");
        app5.setInstanceCount(3);
        applicationRepository.save(app5);

        Application app6 = new Application();
        app6.setName("analytics-core");
        app6.setProject(p3);
        app6.setStatus("online");
        app6.setIp("192.168.3.10");
        app6.setAgentVersion("v2.4.1");
        app6.setJvmVersion("JDK17");
        app6.setHeapUsage(71.5);
        app6.setUptime("20d 6h");
        app6.setInstanceCount(5);
        applicationRepository.save(app6);

        Application app7 = new Application();
        app7.setName("sms-gateway");
        app7.setProject(p5);
        app7.setStatus("online");
        app7.setIp("192.168.5.10");
        app7.setAgentVersion("v2.4.1");
        app7.setJvmVersion("JDK11");
        app7.setHeapUsage(38.7);
        app7.setUptime("60d 0h");
        app7.setInstanceCount(2);
        applicationRepository.save(app7);
    }

    private void initAlerts() {
        Alert alert1 = new Alert();
        alert1.setAppName("order-service");
        alert1.setEnv("production");
        alert1.setType("OOM");
        alert1.setLevel("error");
        alert1.setMessage("堆内存使用率过高");
        alert1.setStatus("active");
        alertRepository.save(alert1);

        Alert alert2 = new Alert();
        alert2.setAppName("192.168.1.15");
        alert2.setEnv("host");
        alert2.setType("CPU > 85%");
        alert2.setLevel("warning");
        alert2.setMessage("CPU使用率告警");
        alert2.setStatus("active");
        alertRepository.save(alert2);

        Alert alert3 = new Alert();
        alert3.setAppName("gateway-v2");
        alert3.setEnv("production");
        alert3.setType("响应延迟 > 2s");
        alert3.setLevel("warning");
        alert3.setMessage("API响应时间过长");
        alert3.setStatus("active");
        alertRepository.save(alert3);

        Alert alert4 = new Alert();
        alert4.setAppName("mysql-master");
        alert4.setEnv("production");
        alert4.setType("连接数 > 80%");
        alert4.setLevel("warning");
        alert4.setMessage("数据库连接池告警");
        alert4.setStatus("active");
        alertRepository.save(alert4);

        Alert alert5 = new Alert();
        alert5.setAppName("user-service");
        alert5.setEnv("staging");
        alert5.setType("实例宕机");
        alert5.setLevel("error");
        alert5.setMessage("一个实例离线");
        alert5.setStatus("active");
        alertRepository.save(alert5);
    }

    private void initReleases() {
        Release r1 = new Release();
        r1.setAppName("order-service");
        r1.setVersion("v3.2.1");
        r1.setPrevVersion("v3.2.0");
        r1.setEnv("production");
        r1.setStatus("error");
        r1.setOperator("张伟");
        r1.setChanges("修复订单状态同步问题,优化数据库连接池配置,升级支付SDK至v2.1.0");
        r1.setImpactServices(4);
        r1.setImpactApis(12);
        r1.setImpactInstances(3);
        r1.setAlertsCount(3);
        releaseRepository.save(r1);

        Release r2 = new Release();
        r2.setAppName("payment-gateway");
        r2.setVersion("v2.0.5");
        r2.setPrevVersion("v2.0.4");
        r2.setEnv("production");
        r2.setStatus("online");
        r2.setOperator("李明");
        r2.setChanges("升级加密算法至AES-256,新增支付渠道: 数字人民币");
        r2.setImpactServices(2);
        r2.setImpactApis(6);
        r2.setImpactInstances(2);
        r2.setAlertsCount(0);
        releaseRepository.save(r2);

        Release r3 = new Release();
        r3.setAppName("user-service");
        r3.setVersion("v1.8.2");
        r3.setPrevVersion("v1.8.1");
        r3.setEnv("staging");
        r3.setStatus("warning");
        r3.setOperator("王芳");
        r3.setChanges("优化登录接口性能,增加第三方OAuth支持");
        r3.setImpactServices(3);
        r3.setImpactApis(8);
        r3.setImpactInstances(2);
        r3.setAlertsCount(1);
        releaseRepository.save(r3);

        Release r4 = new Release();
        r4.setAppName("inventory-service");
        r4.setVersion("v2.3.0");
        r4.setPrevVersion("v2.2.9");
        r4.setEnv("production");
        r4.setStatus("online");
        r4.setOperator("赵强");
        r4.setChanges("库存扣减逻辑重构,新增库存预占接口");
        r4.setImpactServices(2);
        r4.setImpactApis(5);
        r4.setImpactInstances(3);
        r4.setAlertsCount(0);
        releaseRepository.save(r4);
    }

    private void initAlertRules() {
        AlertRule rule1 = new AlertRule();
        rule1.setName("CPU使用率告警");
        rule1.setMetric("cpu");
        rule1.setCondition(">");
        rule1.setThreshold(85.0);
        rule1.setUnit("%");
        rule1.setLevel("warning");
        rule1.setStatus("enabled");
        rule1.setChannels("email,dingtalk");
        rule1.setTriggerCount(12);
        rule1.setLastTrigger("2024-01-15 10:30:00");
        rule1.setAppName("order-service");
        alertRuleRepository.save(rule1);

        AlertRule rule2 = new AlertRule();
        rule2.setName("内存使用率告警");
        rule2.setMetric("memory");
        rule2.setCondition(">");
        rule2.setThreshold(90.0);
        rule2.setUnit("%");
        rule2.setLevel("error");
        rule2.setStatus("enabled");
        rule2.setChannels("email,sms");
        rule2.setTriggerCount(5);
        rule2.setLastTrigger("2024-01-14 15:20:00");
        rule2.setAppName("payment-gateway");
        alertRuleRepository.save(rule2);

        AlertRule rule3 = new AlertRule();
        rule3.setName("响应时间告警");
        rule3.setMetric("responseTime");
        rule3.setCondition(">");
        rule3.setThreshold(500.0);
        rule3.setUnit("ms");
        rule3.setLevel("warning");
        rule3.setStatus("enabled");
        rule3.setChannels("dingtalk");
        rule3.setTriggerCount(8);
        rule3.setLastTrigger("2024-01-15 09:45:00");
        rule3.setAppName("user-service");
        alertRuleRepository.save(rule3);

        AlertRule rule4 = new AlertRule();
        rule4.setName("错误率告警");
        rule4.setMetric("errorRate");
        rule4.setCondition(">");
        rule4.setThreshold(5.0);
        rule4.setUnit("%");
        rule4.setLevel("error");
        rule4.setStatus("disabled");
        rule4.setChannels("email");
        rule4.setTriggerCount(0);
        rule4.setLastTrigger(null);
        rule4.setAppName("inventory-service");
        alertRuleRepository.save(rule4);

        AlertRule rule5 = new AlertRule();
        rule5.setName("JVM堆内存告警");
        rule5.setMetric("heapUsed");
        rule5.setCondition(">");
        rule5.setThreshold(80.0);
        rule5.setUnit("%");
        rule5.setLevel("warning");
        rule5.setStatus("enabled");
        rule5.setChannels("email,dingtalk");
        rule5.setTriggerCount(3);
        rule5.setLastTrigger("2024-01-15 11:00:00");
        rule5.setAppName("order-service");
        alertRuleRepository.save(rule5);

        AlertRule rule6 = new AlertRule();
        rule6.setName("线程数告警");
        rule6.setMetric("threadCount");
        rule6.setCondition(">");
        rule6.setThreshold(200.0);
        rule6.setUnit("");
        rule6.setLevel("error");
        rule6.setStatus("enabled");
        rule6.setChannels("sms");
        rule6.setTriggerCount(1);
        rule6.setLastTrigger("2024-01-13 16:30:00");
        rule6.setAppName("payment-gateway");
        alertRuleRepository.save(rule6);
    }
}
