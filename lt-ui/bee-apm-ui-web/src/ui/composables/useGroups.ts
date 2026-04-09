import { ref } from 'vue'
import { fetchGroupList, type KeyValue } from '../../api/common'
import { useTimeRangeStore } from '../../stores/timeRange'

export function useGroups() {
  const timeRange = useTimeRangeStore()

  const envOptions = ref<KeyValue[]>([])
  const appOptions = ref<KeyValue[]>([])
  const loading = ref(false)

  async function reload() {
    loading.value = true
    try {
      const results = await Promise.allSettled([
        fetchGroupList({ beginTime: timeRange.beginTime, endTime: timeRange.endTime, group: 'env' }),
        fetchGroupList({ beginTime: timeRange.beginTime, endTime: timeRange.endTime, group: 'app' }),
      ])
      const env = results[0].status === 'fulfilled' ? results[0].value : []
      const app = results[1].status === 'fulfilled' ? results[1].value : []
      envOptions.value = env
      appOptions.value = app
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    envOptions,
    appOptions,
    reload,
  }
}

