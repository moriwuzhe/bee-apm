export const APP_NAME = "Bee APM";

export const APP_VERSION = "1.0.0";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const APP_CONFIG = {
  name: APP_NAME,
  version: APP_VERSION,
  description: "企业级APM监控平台",
  copyright: "© 2024 Bee APM Team",
};

export const THEME_CONFIG = {
  defaultTheme: "dark" as const,
  themes: ["light", "dark"] as const,
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  headerHeight: 56,
};

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  showSizeChanger: true,
  showQuickJumper: true,
};

export const DATE_FORMAT = {
  full: "YYYY-MM-DD HH:mm:ss",
  date: "YYYY-MM-DD",
  time: "HH:mm:ss",
  month: "YYYY-MM",
  year: "YYYY",
};

export const CHART_COLORS = {
  primary: "#165DFF",
  success: "#00D68F",
  warning: "#FFAA00",
  danger: "#FF4D4F",
  info: "#0066FF",
  purple: "#A855F7",
  cyan: "#06B6D4",
  pink: "#EC4899",
  orange: "#F97316",
  lime: "#84CC16",
};

export const METRIC_THRESHOLDS = {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 75, critical: 90 },
  disk: { warning: 80, critical: 90 },
  responseTime: { warning: 200, critical: 500 },
  errorRate: { warning: 1, critical: 5 },
  qps: { warning: 1000, critical: 2000 },
};

export const ALERT_LEVELS = {
  critical: { label: "严重", color: "#FF4D4F", priority: 1 },
  warning: { label: "警告", color: "#FFAA00", priority: 2 },
  info: { label: "信息", color: "#165DFF", priority: 3 },
};

export const AGENT_STATUS = {
  online: { label: "在线", color: "#00D68F" },
  offline: { label: "离线", color: "#94A3B8" },
  error: { label: "异常", color: "#FF4D4F" },
  upgrading: { label: "升级中", color: "#165DFF" },
};

export const APP_STATUS = {
  healthy: { label: "健康", color: "#00D68F" },
  warning: { label: "警告", color: "#FFAA00" },
  error: { label: "异常", color: "#FF4D4F" },
  unknown: { label: "未知", color: "#94A3B8" },
};

export const LOG_LEVELS = {
  error: { label: "ERROR", color: "#FF4D4F" },
  warn: { label: "WARN", color: "#FFAA00" },
  info: { label: "INFO", color: "#165DFF" },
  debug: { label: "DEBUG", color: "#94A3B8" },
};

export const CACHE_KEYS = {
  user: "user_info",
  token: "auth_token",
  theme: "theme",
  sidebarCollapsed: "sidebarCollapsed",
  language: "language",
  lastVisit: "last_visit",
};

export const ERROR_MESSAGES = {
  networkError: "网络连接失败，请检查网络",
  serverError: "服务器错误，请稍后重试",
  unauthorized: "未授权，请重新登录",
  forbidden: "没有权限访问该资源",
  notFound: "请求的资源不存在",
  timeout: "请求超时，请重试",
  validationError: "数据验证失败",
  unknownError: "未知错误",
};

export const SUCCESS_MESSAGES = {
  create: "创建成功",
  update: "更新成功",
  delete: "删除成功",
  save: "保存成功",
  submit: "提交成功",
  export: "导出成功",
  import: "导入成功",
  refresh: "刷新成功",
  copy: "复制成功",
};

export const CONFIRM_MESSAGES = {
  delete: "确定要删除吗？此操作不可撤销",
  logout: "确定要退出登录吗？",
  reset: "确定要重置吗？",
  clear: "确定要清空吗？",
};

export const PLACEHOLDERS = {
  search: "请输入搜索关键词...",
  select: "请选择",
  input: "请输入",
  dateRange: "请选择日期范围",
};

export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^1[3-9]\d{9}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  port: /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
};

export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

export const STORAGE_LIMITS = {
  localStorage: 5 * 1024 * 1024,
  sessionStorage: 5 * 1024 * 1024,
};

export const TIME_RANGES = [
  { label: "最近5分钟", value: "5m" },
  { label: "最近15分钟", value: "15m" },
  { label: "最近30分钟", value: "30m" },
  { label: "最近1小时", value: "1h" },
  { label: "最近6小时", value: "6h" },
  { label: "最近24小时", value: "24h" },
  { label: "最近7天", value: "7d" },
  { label: "最近30天", value: "30d" },
];

export const REFRESH_INTERVALS = [
  { label: "手动刷新", value: 0 },
  { label: "5秒", value: 5000 },
  { label: "10秒", value: 10000 },
  { label: "30秒", value: 30000 },
  { label: "1分钟", value: 60000 },
  { label: "5分钟", value: 300000 },
];
