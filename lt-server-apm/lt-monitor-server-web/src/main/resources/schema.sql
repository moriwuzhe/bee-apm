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

-- Insert default admin user if not exists (password: 123456)
MERGE INTO bistoury_user KEY(user_code) VALUES ('admin', 'U2FsdGVkX1+Q0l+xO5wP/03oY9j4O/9h/qG0mZ6L+eQ=');
-- Insert default test project
MERGE INTO bistoury_project KEY(project_code) VALUES (1, 'default', 'Default Project', 'd8d1d87c-17e9-482a-a92c-8abdbdf9c536', 'Default Project created by system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
