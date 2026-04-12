<template>
  <div class="project-container">
    <div class="header">
      <h2>项目管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">新建项目</el-button>
    </div>

    <el-table :data="projects" border style="width: 100%">
      <el-table-column prop="projectCode" label="项目编码" width="180" />
      <el-table-column prop="projectName" label="项目名称" width="180" />
      <el-table-column prop="secretKey" label="密钥 (Secret Key)" width="320">
        <template #default="{ row }">
          <el-tag type="success">{{ row.secretKey }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
    </el-table>

    <el-dialog v-model="showCreateDialog" title="新建项目" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="项目编码" prop="projectCode">
          <el-input v-model="form.projectCode" placeholder="如: e-commerce" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="如: 电商业务线" />
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
import { fetchProjects, createProject, type Project } from '../../api/project'

const projects = ref<Project[]>([])
const showCreateDialog = ref(false)
const formRef = ref()
const form = ref({
  projectCode: '',
  projectName: '',
  description: '',
})

const rules = {
  projectCode: [{ required: true, message: '请输入项目编码', trigger: 'blur' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
}

const loadData = async () => {
  try {
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
        await createProject(form.value)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        form.value = { projectCode: '', projectName: '', description: '' }
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
.project-container {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
