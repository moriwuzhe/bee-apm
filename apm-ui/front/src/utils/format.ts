// 数据格式化工具

/**
 * 格式化数字，添加千位分隔符
 * @param num - 数字
 * @param decimalPlaces - 小数位数
 */
export function formatNumber(num: number, decimalPlaces = 2): string {
  if (typeof num !== "number" || isNaN(num)) {
    return "0";
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * 格式化文件大小
 * @param bytes - 字节数
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${formatNumber(size, 2)} ${sizes[i]}`;
}

/**
 * 格式化时间戳为日期字符串
 * @param timestamp - 时间戳（秒或毫秒）
 * @param format - 格式字符串
 */
export function formatTimestamp(timestamp: number): string {
  if (!timestamp) return "-";
  
  // 判断是否是毫秒（大于1000000000000）
  const ms = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化相对时间
 * @param timestamp - 时间戳（秒或毫秒）
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const ms = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  const diff = now - ms;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  if (seconds > 10) return `${seconds}秒前`;
  
  return "刚刚";
}

/**
 * 格式化百分比
 * @param value - 数值
 * @param total - 总数
 * @param decimalPlaces - 小数位数
 */
export function formatPercent(value: number, total: number, decimalPlaces = 1): string {
  if (total === 0) return "0%";
  const percent = (value / total) * 100;
  return `${formatNumber(percent, decimalPlaces)}%`;
}

/**
 * 格式化字节为可读格式
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * 格式化网络速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "0 KB/s";
  
  const kbps = bytesPerSecond / 1024;
  if (kbps < 1024) {
    return `${formatNumber(kbps, 1)} KB/s`;
  }
  
  const mbps = kbps / 1024;
  return `${formatNumber(mbps, 2)} MB/s`;
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 截断字符串
 */
export function truncate(str: string, maxLength = 50, suffix = "..."): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 安全的 JSON 解析
 */
export function safeJSONParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
