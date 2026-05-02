import { test as base, Page } from '@playwright/test';

const mockApiResponses: Record<string, object> = {
  '/api/dashboard/stats': {
    code: 200,
    data: {
      totalProjects: 10,
      totalApplications: 25,
      totalAgents: 8,
      activeAlerts: 3,
    },
  },
  '/api/dashboard/trend': {
    code: 200,
    data: [
      { time: '2024-01-01', value: 100 },
      { time: '2024-01-02', value: 120 },
    ],
  },
  '/api/dashboard/alert-trend': {
    code: 200,
    data: [
      { time: '2024-01-01', count: 5 },
      { time: '2024-01-02', count: 3 },
    ],
  },
  '/api/dashboard/recent-alerts': {
    code: 200,
    data: [
      { id: 1, level: 'warning', message: 'Test alert 1', time: '2024-01-01' },
      { id: 2, level: 'error', message: 'Test alert 2', time: '2024-01-01' },
    ],
  },
  '/api/dashboard/top-apps': {
    code: 200,
    data: [
      { name: 'App1', requests: 1000, errors: 5 },
      { name: 'App2', requests: 800, errors: 2 },
    ],
  },
  '/api/projects': {
    code: 200,
    data: [
      { id: 1, name: 'Project 1', env: 'prod', status: 'active' },
      { id: 2, name: 'Project 2', env: 'dev', status: 'active' },
    ],
  },
  '/api/applications': {
    code: 200,
    data: [
      { id: 1, name: 'App 1', projectId: 1, health: 'healthy' },
      { id: 2, name: 'App 2', projectId: 1, health: 'healthy' },
    ],
  },
  '/api/agents': {
    code: 200,
    data: [
      { id: 1, name: 'Agent 1', status: 'online', host: 'host1' },
    ],
  },
  '/api/jvm': {
    code: 200,
    data: {
      heapUsed: 500,
      heapTotal: 1000,
      threadCount: 50,
    },
  },
  '/api/topology': {
    code: 200,
    data: {
      nodes: [
        { id: '1', name: 'Node 1', type: 'service' },
        { id: '2', name: 'Node 2', type: 'database' },
      ],
      edges: [{ source: '1', target: '2' }],
    },
  },
  '/api/service-dep': {
    code: 200,
    data: [
      { service: 'A', dependsOn: ['B', 'C'] },
      { service: 'B', dependsOn: ['C'] },
    ],
  },
  '/api/releases': {
    code: 200,
    data: [
      { id: 1, version: '1.0.0', status: 'success', time: '2024-01-01' },
    ],
  },
  '/api/alert-rules': {
    code: 200,
    data: [
      { id: 1, name: 'CPU Alert', condition: 'cpu > 80%', enabled: true },
    ],
  },
  '/api/users': {
    code: 200,
    data: [
      { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
    ],
  },
  '/api/roles': {
    code: 200,
    data: [
      { id: 1, name: 'Admin', permissions: ['read', 'write', 'delete'] },
    ],
  },
  '/api/permissions': {
    code: 200,
    data: [
      { id: 1, name: 'read', description: 'Read access' },
      { id: 2, name: 'write', description: 'Write access' },
    ],
  },
  '/api/release-analysis': {
    code: 200,
    data: {
      comparisons: [],
      summary: { total: 0, improved: 0, degraded: 0 },
    },
  },
};

export async function mockApiCalls(page: Page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const endpoint = url.replace('http://localhost:8081', '');

    const mockResponse = mockApiResponses[endpoint];

    if (mockResponse) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 200, data: [] }),
      });
    }
  });
}

export const test = base.extend<{ mockApi: void }>({
  mockApi: async ({ page }, use) => {
    await mockApiCalls(page);
    await use();
  },
});