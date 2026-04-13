import { ref } from 'vue'

interface CacheItem<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useLocalCache() {
  const cache = ref<Map<string, CacheItem<any>>>(new Map())

  function set<T>(key: string, data: T) {
    cache.value.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  function get<T>(key: string): T | null {
    const item = cache.value.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.value.delete(key)
      return null
    }
    
    return item.data
  }

  function clear() {
    cache.value.clear()
  }

  function remove(key: string) {
    cache.value.delete(key)
  }

  return {
    cache,
    set,
    get,
    clear,
    remove
  }
}
