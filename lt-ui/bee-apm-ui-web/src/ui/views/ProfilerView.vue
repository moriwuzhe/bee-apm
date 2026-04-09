<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import PageShell from '../components/PageShell.vue'
import { fetchAgentConnections, startProfiler, stopProfiler, type AgentConnection } from '../../api/diagnostic'

const agents = ref<AgentConnection[]>([])
const loadingAgents = ref(false)
const selectedAgentId = ref('')

const eventType = ref('cpu')
const duration = ref(30)
const profiling = ref(false)
const flameGraphHtml = ref('')
const iframeRef = ref<HTMLIFrameElement | null>(null)

async function loadAgents() {
  loadingAgents.value = true
  try {
    agents.value = await fetchAgentConnections()
    if (agents.value.length > 0 && !selectedAgentId.value) {
      selectedAgentId.value = agents.value[0].agentId
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载节点列表失败')
  } finally {
    loadingAgents.value = false
  }
}

async function handleStart() {
  if (!selectedAgentId.value) {
    ElMessage.warning('请选择目标节点')
    return
  }
  profiling.value = true
  flameGraphHtml.value = ''
  try {
    const res = await startProfiler(selectedAgentId.value, eventType.value, duration.value)
    ElMessage.success('已下发开始指令，正在采集...')
    
    // 自动等待 duration 秒后停止并获取结果
    setTimeout(() => {
      if (profiling.value) {
        handleStop()
      }
    }, duration.value * 1000)
  } catch (e: any) {
    ElMessage.error(e.message || '启动 Profiler 失败')
    profiling.value = false
  }
}

async function handleStop() {
  if (!selectedAgentId.value) {
    return
  }
  try {
    ElMessage.info('正在生成火焰图，请稍候...')
    const html = await stopProfiler(selectedAgentId.value)
    if (html && html.startsWith('<!DOCTYPE html>')) {
      flameGraphHtml.value = html
      renderIframe()
      ElMessage.success('火焰图生成成功')
    } else {
      ElMessage.warning('生成失败或数据为空: ' + html)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '停止 Profiler 失败')
  } finally {
    profiling.value = false
  }
}

function renderIframe() {
  nextTick(() => {
    if (iframeRef.value && flameGraphHtml.value) {
      const doc = iframeRef.value.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(flameGraphHtml.value)
        doc.close()
      }
    }
  })
}

onMounted(() => {
  loadAgents()
})
</script>

<template>
  <PageShell title="持续性能剖析 (Continuous Profiling)">
    <el-card shadow="never" class="profiler-card">
      <div class="control-panel">
        <el-form :inline="true" size="default">
          <el-form-item label="目标节点">
            <el-select v-model="selectedAgentId" placeholder="选择诊断节点" style="width: 300px">
              <el-option v-for="a in agents" :key="a.agentId" :label="a.agentId + (a.active ? ' (在线)' : ' (离线)')" :value="a.agentId" :disabled="!a.active" />
            </el-select>
          </el-form-item>
          <el-form-item label="分析类型">
            <el-select v-model="eventType" style="width: 120px">
              <el-option label="CPU" value="cpu" />
              <el-option label="内存分配 (Alloc)" value="alloc" />
              <el-option label="锁竞争 (Lock)" value="lock" />
              <el-option label="墙钟时间 (Wall)" value="wall" />
            </el-select>
          </el-form-item>
          <el-form-item label="采样时长(秒)">
            <el-input-number v-model="duration" :min="5" :max="300" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleStart" :loading="profiling" :disabled="!selectedAgentId">
              {{ profiling ? '采样中...' : '开始采集' }}
            </el-button>
            <el-button type="danger" @click="handleStop" v-if="profiling">
              提前结束并生成
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="result-panel" v-loading="profiling" element-loading-text="正在底层采集并生成火焰图数据，请耐心等待...">
        <div v-if="!flameGraphHtml && !profiling" class="empty-tip">
          <el-empty description="点击开始采集获取方法级火焰图" />
        </div>
        <iframe v-show="flameGraphHtml" ref="iframeRef" class="flame-graph-frame" frameborder="0"></iframe>
      </div>
    </el-card>
  </PageShell>
</template>

<style scoped>
.profiler-card {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
.profiler-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
}
.control-panel {
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
  padding-bottom: 4px;
}
.result-panel {
  flex: 1;
  position: relative;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}
.empty-tip {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flame-graph-frame {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
