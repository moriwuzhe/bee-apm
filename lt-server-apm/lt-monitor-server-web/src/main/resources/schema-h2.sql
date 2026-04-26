CREATE TABLE IF NOT EXISTS bistoury_project (
                                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                project_code VARCHAR(64) NOT NULL UNIQUE,
                                                project_name VARCHAR(128) NOT NULL,
                                                secret_key VARCHAR(128) NOT NULL,
                                                description VARCHAR(255),
                                                team_id VARCHAR(64),
                                                team_name VARCHAR(128),
                                                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bistoury_application (
                                                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                    project_code VARCHAR(64) NOT NULL,
                                                    app_code VARCHAR(64) NOT NULL UNIQUE,
                                                    app_name VARCHAR(128) NOT NULL,
                                                    description VARCHAR(255),
                                                    app_type VARCHAR(32),
                                                    app_secret_key VARCHAR(128),
                                                    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bistoury_user (
                                             user_code VARCHAR(64) PRIMARY KEY,
                                             password VARCHAR(128) NOT NULL
);

CREATE TABLE IF NOT EXISTS bistoury_profiler (
                                                 profiler_id VARCHAR(64) PRIMARY KEY,
                                                 operator VARCHAR(64),
                                                 app_code VARCHAR(64),
                                                 agent_id VARCHAR(64),
                                                 pid INT,
                                                 start_time TIMESTAMP,
                                                 duration INT,
                                                 interval_ms INT,
                                                 mode INT,
                                                 state INT,
                                                 update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bistoury_agent_instance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  project_code VARCHAR(64),
  app_code VARCHAR(64) NOT NULL,
  inst_id VARCHAR(64) NOT NULL,
  ip VARCHAR(64),
  version VARCHAR(32),
  config_version VARCHAR(64),
  last_heartbeat_time TIMESTAMP,
  online BOOLEAN DEFAULT TRUE,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (app_code, inst_id)
);

CREATE TABLE IF NOT EXISTS bistoury_agent_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_code VARCHAR(64) NOT NULL UNIQUE,
  config TEXT,
  config_version VARCHAR(64),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bistoury_agent_instance_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_code VARCHAR(64) NOT NULL,
  inst_id VARCHAR(64) NOT NULL,
  config TEXT,
  config_version VARCHAR(64),
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE (app_code, inst_id)
);

CREATE TABLE IF NOT EXISTS bistoury_plugin_info (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  plugin_code VARCHAR(64) NOT NULL UNIQUE,
  plugin_name VARCHAR(128) NOT NULL,
  plugin_type VARCHAR(32),
  version VARCHAR(32),
  description VARCHAR(512),
  file_name VARCHAR(256),
  file_size BIGINT,
  file_md5 VARCHAR(64),
  download_url VARCHAR(512),
  enabled BOOLEAN DEFAULT TRUE,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agent Memory History Table
DROP TABLE IF EXISTS agent_memory_history;
CREATE TABLE agent_memory_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_code VARCHAR(64) NOT NULL,
  inst_id VARCHAR(64) NOT NULL,
  collect_time TIMESTAMP NOT NULL,
  heap_used BIGINT,
  heap_committed BIGINT,
  heap_max BIGINT,
  non_heap_used BIGINT,
  non_heap_committed BIGINT,
  non_heap_max BIGINT,
  thread_count INT,
  peak_thread_count INT,
  daemon_thread_count INT,
  loaded_class_count INT,
  total_loaded_class_count BIGINT,
  unloaded_class_count BIGINT,
  class_loading_rate DOUBLE,
  gc_count BIGINT,
  gc_time_ms BIGINT,
  minor_gc_count BIGINT,
  minor_gc_time_ms BIGINT,
  full_gc_count BIGINT,
  full_gc_time_ms BIGINT,
  process_cpu_load DOUBLE,
  system_cpu_load DOUBLE,
  memory_pools TEXT,
  thread_states TEXT,
  jvm_start_time BIGINT,
  top_cpu_threads TEXT,                    -- Phase 2: Top CPU线程列表 (JSON)
  thread_pools TEXT,                       -- Phase 2: 线程池信息 (JSON)
  gc_snapshot TEXT,                        -- Phase 2: GC快照数据 (JSON)
  disk_read_bytes BIGINT,                  -- Phase 3: 磁盘读取字节数
  disk_write_bytes BIGINT,                 -- Phase 3: 磁盘写入字节数
  network_recv_bytes BIGINT,               -- Phase 3: 网络接收字节数
  network_sent_bytes BIGINT,               -- Phase 3: 网络发送字节数
  disk_read_ops BIGINT,                    -- Phase 3: 磁盘读操作次数
  disk_write_ops BIGINT,                   -- Phase 3: 磁盘写操作次数
  eden_used BIGINT,                        -- Phase 4: Eden区使用量
  eden_max BIGINT,                         -- Phase 4: Eden区最大值
  survivor_used BIGINT,                    -- Phase 4: Survivor区使用量
  survivor_max BIGINT,                     -- Phase 4: Survivor区最大值
  old_gen_used BIGINT,                     -- Phase 4: 老年代使用量
  old_gen_max BIGINT,                      -- Phase 4: 老年代最大值
  metaspace_used BIGINT,                   -- Phase 4: Metaspace使用量
  metaspace_max BIGINT,                    -- Phase 4: Metaspace最大值
  code_cache_used BIGINT,                  -- Phase 4: CodeCache使用量
  code_cache_max BIGINT,                   -- Phase 4: CodeCache最大值
  gc_reclaimed_bytes BIGINT,               -- Phase 4: GC回收内存量
  gc_efficiency DOUBLE,                    -- Phase 4: GC效率
  memory_allocation_rate DOUBLE,           -- Phase 5: 内存分配速率 (bytes/sec)
  gc_reclaimed_last_interval BIGINT,       -- Phase 5: 上次间隔GC回收量
  gc_pressure DOUBLE,                        -- Phase 5: GC压力指数 (0-100)
  gc_reclaimed_bytes_current BIGINT,         -- Phase 6: 当前GC回收量
  cpu_memory_correlation DOUBLE,             -- Phase 6: CPU与内存相关性指数
  top_cpu_thread_name VARCHAR(255),          -- Phase 7: Top CPU线程名
  top_cpu_thread_percent DOUBLE,             -- Phase 7: Top CPU线程占用率
  thread_count_runnable INTEGER,             -- Phase 7: RUNNABLE线程数
  thread_count_blocked INTEGER,              -- Phase 7: BLOCKED线程数
  performance_score DOUBLE,                  -- Phase 8: 综合性能评分 (0-100)
  health_status VARCHAR(20),                  -- Phase 8: 健康状态
  buffer_pools TEXT,                          -- 缓冲区池使用情况 (JSON)
  total_physical_memory BIGINT,               -- 总物理内存 (bytes)
  free_physical_memory BIGINT                 -- 空闲物理内存 (bytes)
);

-- 告警规则表
CREATE TABLE IF NOT EXISTS alert_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_name VARCHAR(255) NOT NULL COMMENT '规则名称',
  app_code VARCHAR(100) NOT NULL COMMENT '应用代码（*表示所有应用）',
  metric_name VARCHAR(100) NOT NULL COMMENT '监控指标名称',
  operator VARCHAR(10) NOT NULL COMMENT '操作符: >, <, >=, <=, ==',
  threshold DOUBLE NOT NULL COMMENT '阈值',
  duration INT DEFAULT 60 COMMENT '持续时间（秒），连续N秒超过阈值才告警',
  severity VARCHAR(20) DEFAULT 'WARNING' COMMENT '严重程度: INFO, WARNING, CRITICAL',
  notification_type VARCHAR(20) DEFAULT 'WEBHOOK' COMMENT '通知类型: EMAIL, SMS, WEBHOOK',
  notification_target VARCHAR(500) COMMENT '通知目标',
  enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  description VARCHAR(500) COMMENT '规则描述',
  INDEX idx_app_metric (app_code, metric_name),
  INDEX idx_enabled (enabled)
);

-- 告警记录表
CREATE TABLE IF NOT EXISTS alert_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  rule_id BIGINT NOT NULL COMMENT '关联的告警规则ID',
  app_code VARCHAR(100) NOT NULL COMMENT '应用代码',
  inst_id VARCHAR(100) NOT NULL COMMENT '实例ID',
  metric_name VARCHAR(100) NOT NULL COMMENT '触发告警的指标',
  current_value DOUBLE NOT NULL COMMENT '当前值',
  threshold DOUBLE NOT NULL COMMENT '阈值',
  severity VARCHAR(20) NOT NULL COMMENT '严重程度',
  status VARCHAR(20) DEFAULT 'TRIGGERED' COMMENT '状态: TRIGGERED, RESOLVED',
  trigger_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '触发时间',
  resolve_time TIMESTAMP NULL COMMENT '恢复时间',
  message VARCHAR(1000) COMMENT '告警消息',
  INDEX idx_app_inst (app_code, inst_id),
  INDEX idx_rule_status (rule_id, status),
  INDEX idx_trigger_time (trigger_time)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_app_inst ON agent_memory_history (app_code, inst_id);
CREATE INDEX IF NOT EXISTS idx_collect_time ON agent_memory_history (collect_time);

-- Insert default admin user if not exists (password: 123456)
MERGE INTO bistoury_user KEY(user_code) VALUES ('admin', 'U2FsdGVkX1+Q0l+xO5wP/03oY9j4O/9h/qG0mZ6L+eQ=');
-- Insert default test project (exclude id auto-increment column)
MERGE INTO bistoury_project (project_code, project_name, secret_key, description, team_id, team_name, create_time, update_time) 
KEY(project_code) 
VALUES ('default', 'Default Project', 'd8d1d87c-17e9-482a-a92c-8abdbdf9c536', 'Default Project created by system', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Insert order project for testing
MERGE INTO bistoury_project (project_code, project_name, secret_key, description, team_id, team_name, create_time, update_time) 
KEY(project_code) 
VALUES ('order', 'Order Project', '6dae60a9-15ff-4774-aec0-cac473221a53', 'Order application project', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Insert order application
MERGE INTO bistoury_application (project_code, app_code, app_name, description, app_type, app_secret_key, create_time, update_time) 
KEY(app_code) 
VALUES ('order', 'order', 'Order Application', 'Order test application', 'java', '6dae60a9-15ff-4774-aec0-cac473221a53', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
