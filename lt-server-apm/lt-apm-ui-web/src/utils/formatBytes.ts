/**
 * 安全的字节格式化函数
 * 适用于ECharts axisLabel formatter，处理各种类型输入
 */
export function safeFormatBytes(bytes: number | string | undefined | null): string {
  // 处理 undefined 或 null
  if (bytes === undefined || bytes === null) {
    return '0 B'
  }
  
  // 转换为数字
  let numBytes: number
  if (typeof bytes === 'string') {
    numBytes = parseFloat(bytes)
  } else {
    numBytes = bytes
  }
  
  // 防御性检查：处理 NaN 和负数
  if (isNaN(numBytes) || numBytes < 0) {
    return '0 B'
  }
  
  // 处理 0
  if (numBytes === 0) {
    return '0 B'
  }
  
  // 计算单位
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(numBytes) / Math.log(k))
  
  // 防止数组越界：确保索引在 0 到 sizes.length-1 之间
  const unitIndex = Math.max(0, Math.min(i, sizes.length - 1))
  
  // 兜底逻辑
  const unit = sizes[unitIndex] || 'B'
  return (numBytes / Math.pow(k, unitIndex)).toFixed(2) + ' ' + unit
}
