# App and Project Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Project and Application management system backed by an embedded H2 database, requiring agents to authenticate with a valid `projectCode` and `secretKey` during registration.

**Architecture:** 
- The backend `lt-server-apm/server-web` will initialize H2 tables via Spring Boot JDBC (`schema.sql` / `data.sql`).
- We introduce `Project` and `Application` domain models, DAOs, and REST controllers.
- `AgentConnectionStore` in Netty server will intercept connection requests to validate the secret key against the H2 database.
- The Agent `lt-agent-core` will be modified to accept `lt.project` and `lt.secret` JVM arguments and pass them to the server during connection.
- The UI (`lt-monitor-ui-web`) will add pages to manage Projects and Applications, replacing or augmenting the hardcoded agent list.

**Tech Stack:** Spring Boot, JDBC Template, H2 Database, Netty, Vue3, Element Plus.

---

### Task 1: Database Initialization and Entities

**Files:**
- Create: `/workspace/lt-server-apm/server-web/src/main/resources/schema.sql`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/model/Project.java`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/model/Application.java`

- [ ] **Step 1: Write H2 Database Schema script**
Create `schema.sql` to initialize `lt_project` and `lt_application` tables if they don't exist. We also need to add spring boot datasource config.

- [ ] **Step 2: Update `application.yml` for JDBC**
Modify `/workspace/lt-server-apm/server-web/src/main/resources/application.yml` to configure the embedded H2 datasource and enable `schema.sql` execution.
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:lt_apm;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
    driverClassName: org.h2.Driver
    username: sa
    password: 
  sql:
    init:
      mode: always
```

- [ ] **Step 3: Create `Project` model**
Create POJO with fields: id, projectCode, projectName, secretKey, description.

- [ ] **Step 4: Create `Application` model**
Create POJO with fields: id, projectCode, appCode, appName, description.

- [ ] **Step 5: Commit**
`git add . && git commit -m "feat: setup H2 database and core models for project management"`

### Task 2: Data Access Object (DAO) Layer

**Files:**
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/dao/ProjectDao.java`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/dao/impl/ProjectDaoImpl.java`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/dao/ApplicationDao.java`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/dao/impl/ApplicationDaoImpl.java`

- [ ] **Step 1: Write ProjectDao & Impl**
Implement `insert`, `findByProjectCode`, `findAll`.

- [ ] **Step 2: Write ApplicationDao & Impl**
Implement `insert`, `findByAppCode`, `findByProjectCode`.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement DAOs for Project and Application"`

### Task 3: REST Controllers for UI

**Files:**
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/controller/ProjectController.java`
- Create: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diagnostic/ui/controller/ApplicationController.java`

- [ ] **Step 1: Write ProjectController**
Expose `GET /api/project/list` and `POST /api/project/create` (auto-generate UUID for secretKey).

- [ ] **Step 2: Write ApplicationController**
Expose `GET /api/application/list` and `POST /api/application/create`.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: implement REST APIs for project and app management"`

### Task 4: Netty Agent Authentication Interceptor

**Files:**
- Modify: `/workspace/lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diag/netty/AgentMessageHandler.java` (or similar registration handler)
- Modify: `/workspace/lt-agent/lt-agent-core/src/main/java/org/xi/lt/agent/diagnostic/remoting/protocol/RemotingHeader.java`

- [ ] **Step 1: Update Agent to send Auth Headers**
In `lt-agent-core`, update `LtConfig` to parse `-Dlt.project` and `-Dlt.secret`. 
Update `RemotingHeader` to include `project` and `secret` fields during Netty handshake.

- [ ] **Step 2: Validate Auth in Server**
In `lt-server-apm`, during agent connection handling, extract `project` and `secret`.
Inject `ProjectDao`. If `projectDao.findByProjectCode(project)` is null or secret doesn't match, reject the connection and close the channel.

- [ ] **Step 3: Commit**
`git add . && git commit -m "feat: enforce agent authentication with project secret key"`

### Task 5: Frontend UI Development

**Files:**
- Modify: `/workspace/lt-ui/lt-monitor-ui-web/src/router/index.ts`
- Modify: `/workspace/lt-ui/lt-monitor-ui-web/src/ui/layout/Sidebar.vue`
- Create: `/workspace/lt-ui/lt-monitor-ui-web/src/ui/views/ProjectView.vue`
- Create: `/workspace/lt-ui/lt-monitor-ui-web/src/ui/views/ApplicationView.vue`
- Create: `/workspace/lt-ui/lt-monitor-ui-web/src/api/project.ts`

- [ ] **Step 1: Add API client functions**
Create `project.ts` with Axios calls for fetching/creating projects and apps.

- [ ] **Step 2: Create ProjectView.vue**
Build a table to list projects and their secret keys, and a dialog to create a new project.

- [ ] **Step 3: Create ApplicationView.vue**
Build a table to list applications linked to projects.

- [ ] **Step 4: Update Router and Sidebar**
Add `/project` and `/application` routes. Add them to `Sidebar.vue`.

- [ ] **Step 5: Commit**
`git add . && git commit -m "feat: build UI for Project and Application management"`

### Task 6: UI Automated Testing (Playwright)

**Files:**
- Create: `/workspace/test-demo/ui-test.py`

- [ ] **Step 1: Write Playwright script**
Use Python Playwright to:
1. Navigate to `http://localhost:8081/`.
2. Click "项目管理" (Project Management).
3. Click "新建项目" (Create Project), enter a name, and submit.
4. Verify the project appears in the table with a generated secret key.

- [ ] **Step 2: Execute Test & Polish**
Run the test. If it fails, debug and fix the UI/Backend until it passes reliably.

- [ ] **Step 3: Commit**
`git add . && git commit -m "test: add automated UI test for project creation"`