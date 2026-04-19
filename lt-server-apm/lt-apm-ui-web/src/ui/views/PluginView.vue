<template>
  <div class="plugin-container">
    <div class="page-head">
      <div class="title">插件管理</div>
      <div class="controls">
        <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
        <el-button type="success" @click="showUploadDialog = true">上传插件</el-button>
      </div>
    </div>

    <el-table :data="plugins" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="pluginCode" label="插件编码" width="180" />
      <el-table-column prop="pluginName" label="插件名称" width="180" />
      <el-table-column prop="pluginType" label="插件类型" width="120" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="fileName" label="文件名" width="180" />
      <el-table-column prop="fileSize" label="文件大小" width="120">
        <template #default="{ row }">
          {{ formatFileSize(row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '已启用' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="toggleEnabled(row)">
            {{ row.enabled ? '禁用' : '启用' }}
          </el-button>
          <el-button type="primary" link size="small" @click="downloadPlugin(row)">下载</el-button>
          <el-button type="primary" link size="small" @click="showEditDialog = true; currentPlugin = { ...row }">编辑</el-button>
          <el-button type="danger" link size="small" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 上传插件对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传插件" width="500px" @close="handleDialogClose">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="插件文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            :file-list="fileList"
            accept=".jar,.zip"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="插件编码">
          <el-input v-model="uploadForm.pluginCode" placeholder="请输入插件编码" />
        </el-form-item>
        <el-form-item label="插件名称">
          <el-input v-model="uploadForm.pluginName" placeholder="请输入插件名称" />
        </el-form-item>
        <el-form-item label="插件类型">
          <el-input v-model="uploadForm.pluginType" placeholder="请输入插件类型" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="uploadForm.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="uploadForm.description" :rows="3" placeholder="请输入插件描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false; resetUploadForm()">取消</el-button>
          <el-button type="primary" @click="uploadPlugin" :loading="uploading">确认上传</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑插件对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑插件" width="500px">
      <el-form :model="currentPlugin" label-width="100px" v-if="currentPlugin">
        <el-form-item label="插件名称">
          <el-input v-model="currentPlugin.pluginName" placeholder="请输入插件名称" />
        </el-form-item>
        <el-form-item label="插件类型">
          <el-input v-model="currentPlugin.pluginType" placeholder="请输入插件类型" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="currentPlugin.version" placeholder="请输入版本号" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="currentPlugin.description" :rows="3" placeholder="请输入插件描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="updatePlugin" :loading="updating">确认更新</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '../../api/http'
import { fetchAllPlugins, updatePlugin as updatePluginApi, deletePlugin as deletePluginApi, type PluginInfo } from '../../api/plugin'

const plugins = ref<PluginInfo[]>([])
const loading = ref(false)
const uploading = ref(false)
const updating = ref(false)
const showUploadDialog = ref(false)
const showEditDialog = ref(false)
const currentPlugin = ref<PluginInfo | null>(null)
const uploadRef = ref()
const fileList = ref<any[]>([])
const uploadForm = ref({
  pluginCode: '',
  pluginName: '',
  pluginType: '',
  version: '',
  description: '',
  file: null as File | null
})

const loadData = async () => {
  loading.value = true
  try {
    const data = await fetchAllPlugins()
    plugins.value = data || []
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any, files: any[]) => {
  uploadForm.value.file = file.raw
  fileList.value = files
  
  // 尝试从文件名自动提取信息
  const fileName = file.name || ''
  const nameParts = fileName.replace('.jar', '').replace('.zip', '').split('-')
  
  if (nameParts.length >= 2) {
    // 假设文件名格式为: plugin-name-1.0.0.jar
    const versionPart = nameParts[nameParts.length - 1]
    if (/^\d+\.\d+\.\d+$/.test(versionPart)) {
      uploadForm.value.version = versionPart
      uploadForm.value.pluginName = nameParts.slice(0, nameParts.length - 1).join('-')
      uploadForm.value.pluginCode = uploadForm.value.pluginName
    }
  }
  
  ElMessage.success('文件已选择，请完善其他信息')
}

const resetUploadForm = () => {
  uploadForm.value = {
    pluginCode: '',
    pluginName: '',
    pluginType: '',
    version: '',
    description: '',
    file: null
  }
  fileList.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleDialogClose = () => {
  resetUploadForm()
}

const uploadPlugin = async () => {
  if (!uploadForm.value.pluginCode || !uploadForm.value.pluginName || !uploadForm.value.version) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择插件文件')
    return
  }
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('pluginCode', uploadForm.value.pluginCode)
    formData.append('pluginName', uploadForm.value.pluginName)
    formData.append('pluginType', uploadForm.value.pluginType || '')
    formData.append('version', uploadForm.value.version)
    formData.append('description', uploadForm.value.description || '')
    
    // 使用 http 直接调用上传接口
    await http.post('/api/plugin/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    ElMessage.success('插件上传成功')
    showUploadDialog.value = false
    resetUploadForm()
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

const toggleEnabled = async (plugin: PluginInfo) => {
  try {
    const updatedPlugin = { ...plugin, enabled: !plugin.enabled }
    await updatePluginApi(updatedPlugin)
    ElMessage.success(updatedPlugin.enabled ? '插件已启用' : '插件已禁用')
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const downloadPlugin = (plugin: PluginInfo) => {
  // 如果没有 downloadUrl，我们直接使用 /api/plugin/download?pluginCode=xxx
  const downloadUrl = plugin.downloadUrl || `/api/plugin/download?pluginCode=${plugin.pluginCode}`
  
  // 创建一个临时的 a 标签来下载文件
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = plugin.fileName || `${plugin.pluginCode}-${plugin.version}.jar`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('开始下载插件')
}

const updatePlugin = async () => {
  if (!currentPlugin.value) return
  
  updating.value = true
  try {
    await updatePluginApi(currentPlugin.value)
    ElMessage.success('插件更新成功')
    showEditDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '更新失败')
  } finally {
    updating.value = false
  }
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const confirmDelete = async (plugin: PluginInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除插件 "${plugin.pluginName}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deletePluginApi(plugin.pluginCode)
    ElMessage.success('插件删除成功')
    loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.plugin-container {
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
