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
  UNIQUE KEY (app_code, inst_id)
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
  UNIQUE KEY (app_code, inst_id)
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

-- Insert default admin user if not exists (password: 123456)
MERGE INTO bistoury_user KEY(user_code) VALUES ('admin', 'U2FsdGVkX1+Q0l+xO5wP/03oY9j4O/9h/qG0mZ6L+eQ=');
-- Insert default test project (exclude id auto-increment column)
MERGE INTO bistoury_project (project_code, project_name, secret_key, description, team_id, team_name, create_time, update_time) 
KEY(project_code) 
VALUES ('default', 'Default Project', 'd8d1d87c-17e9-482a-a92c-8abdbdf9c536', 'Default Project created by system', NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
