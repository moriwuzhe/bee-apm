/**
 * Agent 监控历史数据存储
 * 使用 IndexedDB 在浏览器端存储历史数据
 */

const DB_NAME = 'lt-agent-monitor'
const DB_VERSION = 1
const STORE_NAME = 'metrics'

interface MetricRecord {
  id?: number
  agentId: string
  timestamp: number
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  threadCount: number
  peakThreadCount: number
  uptimeMs: number
}

class MetricHistoryStore {
  private db: IDBDatabase | null = null

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          // 创建索引以便快速查询
          store.createIndex('agentId', 'agentId', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('agentId_timestamp', ['agentId', 'timestamp'], { unique: false })
        }
      }
    })
  }

  // 保存指标数据
  async save(record: Omit<MetricRecord, 'id'>): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.add(record)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 查询指定 Agent 的历史数据
  async query(agentId: string, startTime: number, endTime: number): Promise<MetricRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('agentId_timestamp')
      
      // 使用复合索引查询
      const range = IDBKeyRange.bound([agentId, startTime], [agentId, endTime])
      const request = index.getAll(range)

      request.onsuccess = () => {
        // 按时间戳排序
        const records = request.result.sort((a, b) => a.timestamp - b.timestamp)
        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 获取最近 N 条记录
  async getRecent(agentId: string, limit: number = 100): Promise<MetricRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('agentId')
      const request = index.getAll(IDBKeyRange.only(agentId))

      request.onsuccess = () => {
        const records = request.result
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
          .sort((a, b) => a.timestamp - b.timestamp)
        resolve(records)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 清理旧数据（保留最近 N 小时）
  async cleanup(agentId: string, keepHours: number = 24): Promise<void> {
    if (!this.db) await this.init()

    const cutoffTime = Date.now() - keepHours * 60 * 60 * 1000
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('agentId_timestamp')
      
      // 删除早于 cutoffTime 的数据
      const range = IDBKeyRange.upperBound([agentId, cutoffTime])
      const request = index.openCursor(range)

      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 清空所有数据
  async clear(agentId?: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      if (agentId) {
        // 只清空指定 Agent 的数据
        const index = store.index('agentId')
        const request = index.openCursor(IDBKeyRange.only(agentId))
        
        request.onsuccess = (event: any) => {
          const cursor = event.target.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      } else {
        // 清空所有数据
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }
    })
  }
}

// 导出单例
export const metricHistoryStore = new MetricHistoryStore()
export type { MetricRecord }
