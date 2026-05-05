// 项目常量定义

// 环境选项
export const ENV_OPTIONS = [
  { value: "dev", label: "开发", color: "#94A3B8" },
  { value: "staging", label: "测试", color: "#FFAA00" },
  { value: "production", label: "生产", color: "#00D68F" },
];

// 状态选项
export const STATUS_OPTIONS = [
  { value: "online", label: "在线", color: "#00D68F" },
  { value: "warning", label: "警告", color: "#FFAA00" },
  { value: "error", label: "错误", color: "#FF4D4F" },
  { value: "offline", label: "离线", color: "#64748B" },
];

// 告警级别
export const ALERT_LEVEL_OPTIONS = [
  { value: "info", label: "信息", color: "#94A3B8" },
  { value: "warning", label: "警告", color: "#FFAA00" },
  { value: "error", label: "错误", color: "#FF4D4F" },
  { value: "critical", label: "严重", color: "#FF4D4F" },
];

// 通知渠道
export const NOTIFICATION_CHANNELS = [
  { value: "dingtalk", label: "钉钉" },
  { value: "email", label: "邮件" },
  { value: "wechat", label: "微信" },
  { value: "slack", label: "Slack" },
  { value: "sms", label: "短信" },
];

// 常见监控指标
export const METRIC_TYPES = [
  { value: "cpu_usage", label: "CPU 使用率", unit: "%" },
  { value: "mem_usage", label: "内存使用率", unit: "%" },
  { value: "disk_usage", label: "磁盘使用率", unit: "%" },
  { value: "response_time", label: "响应时间", unit: "ms" },
  { value: "error_rate", label: "错误率", unit: "%" },
  { value: "request_count", label: "请求数量", unit: "个" },
];

// 比较运算符
export const COMPARISON_OPERATORS = [
  { value: ">", label: "大于" },
  { value: ">=", label: "大于等于" },
  { value: "<", label: "小于" },
  { value: "<=", label: "小于等于" },
  { value: "==", label: "等于" },
  { value: "!=", label: "不等于" },
];

// 权限模块列表
export const PERMISSION_MODULES = [
  { module: "project", label: "项目管理", icon: "📁" },
  { module: "app", label: "应用管理", icon: "🚀" },
  { module: "monitor", label: "监控运维", icon: "📊" },
  { module: "release", label: "版本发布", icon: "📦" },
  { module: "topology", label: "拓扑图谱", icon: "🔗" },
  { module: "user", label: "用户管理", icon: "👤" },
  { module: "role", label: "角色管理", icon: "👥" },
  { module: "perm", label: "权限管理", icon: "🔑" },
  { module: "system", label: "系统设置", icon: "⚙️" },
];

// 时间范围选项
export const TIME_RANGE_OPTIONS = [
  { value: "5m", label: "5分钟" },
  { value: "30m", label: "30分钟" },
  { value: "1h", label: "1小时" },
  { value: "6h", label: "6小时" },
  { value: "1d", label: "1天" },
  { value: "7d", label: "7天" },
];

// 常用时间范围的秒数
export const TIME_RANGES_IN_SECONDS = {
  "5m": 5 * 60,
  "30m": 30 * 60,
  "1h": 60 * 60,
  "6h": 6 * 60 * 60,
  "1d": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
};

// 默认分页配置
export const DEFAULT_PAGINATION = {
  pageSize: 10,
  currentPage: 1,
  pageSizeOptions: [10, 20, 50, 100],
};

// 防抖时间
export const DEBOUNCE_DELAY = {
  search: 300,
  input: 500,
  save: 1000,
};

// API 超时时间（毫秒）
export const API_TIMEOUT = 30000;

// API 重试次数
export const API_RETRY_COUNT = 3;

// 轮询间隔（毫秒）
export const POLLING_INTERVAL = {
  fast: 5000,
  normal: 15000,
  slow: 60000,
};

// 本地存储的 key
export const STORAGE_KEYS = {
  theme: "apm_theme",
  language: "apm_language",
  sidebarCollapsed: "apm_sidebar_collapsed",
  userPreferences: "apm_user_preferences",
};
