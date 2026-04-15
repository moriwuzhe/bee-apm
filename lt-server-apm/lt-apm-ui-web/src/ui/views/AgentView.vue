<template>
  <div class="agent-container">
    <div class="page-head">
      <div class="title">Agent管理</div>
      <div class="controls">
        <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-table :data="agents" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="app" label="应用" width="150" />
      <el-table-column prop="inst" label="实例" width="150" />
      <el-table-column prop="ip" label="IP地址" width="150" />
      <el-table-column prop="version" label="Agent版本" width="120" />
      <el-table-column prop="configVersion" label="配置版本" width="120" />
      <el-table-column prop="online" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'danger'">
            {{ row.online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="showConfigDialog = true; currentApp = row.app">配置管理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showConfigDialog" title="Agent配置管理" width="600px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="应用">
          <span>{{ currentApp }}</span>
        </el-form-item>
        <el-form-item label="配置内容">
          <el-input type="textarea" v-model="configForm.config" :rows="15" placeholder="请输入配置内容（YAML格式）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <el-button type="primary" @click="submitConfig">确认更新</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAgentInstances, updateAgentConfig, type AgentInstanceInfo } from '../../api/agent'

const agents = ref<AgentInstanceInfo[]>([])
const loading = ref(false)
const showConfigDialog = ref(false)
const currentApp = ref('')
const configForm = ref({
  config: ''
})

const loadData = async () => {
  loading.value = true
  try {
    agents.value = await fetchAgentInstances()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const submitConfig = async () => {
  try {
    await updateAgentConfig({
      app: currentApp.value,
      config: configForm.value.config
    })
    ElMessage.success('配置更新成功')
    showConfigDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '配置更新失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.agent-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>
