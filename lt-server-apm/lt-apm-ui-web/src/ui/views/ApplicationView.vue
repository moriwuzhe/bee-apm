<template>
  <div class="application-container">
    <div class="header">
      <h2>应用管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">新建应用</el-button>
    </div>

    <el-table :data="applications" border style="width: 100%">
      <el-table-column prop="appCode" label="应用编码" width="180" />
      <el-table-column prop="appName" label="应用名称" width="180" />
      <el-table-column prop="projectCode" label="所属项目编码" width="180" />
      <el-table-column prop="description" label="描述" />
    </el-table>

    <el-dialog v-model="showCreateDialog" title="新建应用" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="所属项目" prop="projectCode">
          <el-select v-model="form.projectCode" placeholder="请选择项目">
            <el-option v-for="p in projects" :key="p.projectCode" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.projectCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用编码" prop="appCode">
          <el-input v-model="form.appCode" placeholder="如: order-service" />
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="如: 订单服务" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchApplications, createApplication, fetchProjects, type Application, type Project } from '../../api/project'

const applications = ref<Application[]>([])
const projects = ref<Project[]>([])
const showCreateDialog = ref(false)
const formRef = ref()
const form = ref({
  projectCode: '',
  appCode: '',
  appName: '',
  description: '',
})

const rules = {
  projectCode: [{ required: true, message: '请选择项目', trigger: 'change' }],
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
}

const loadData = async () => {
  try {
    applications.value = await fetchApplications()
    projects.value = await fetchProjects()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  }
}

const submitCreate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await createApplication(form.value)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        form.value = { projectCode: '', appCode: '', appName: '', description: '' }
        loadData()
      } catch (e: any) {
        ElMessage.error(e.message || '创建失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.application-container {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
