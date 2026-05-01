<template>
  <div class="application-definition">
    <div class="page-head">
      <div class="title">应用定义管理</div>
      <div class="controls">
        <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
        <el-button type="primary" @click="showCreateDialog = true">新建应用</el-button>
      </div>
    </div>

    <el-table :data="applications" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="appCode" label="应用编码" width="180" />
      <el-table-column prop="appName" label="应用名称" width="180" />
      <el-table-column prop="projectCode" label="所属项目编码" width="180" />
      <el-table-column prop="appType" label="应用类型" width="120">
        <template #default="{ row }">
          <el-tag :type="row.appType === 'agent-attached' ? 'primary' : 'info'">
            {{ row.appType === 'agent-attached' ? 'Agent接入' : '自建' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="appSecretKey" label="应用密钥" width="280">
        <template #default="{ row }">
          <el-tag type="success">{{ row.appSecretKey }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" />
    </el-table>

    <!-- 新建应用对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建应用" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="应用编码" prop="appCode">
          <el-input v-model="form.appCode" placeholder="请输入应用编码" />
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectCode">
          <el-select v-model="form.projectCode" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projects"
              :key="project.projectCode"
              :label="project.projectName"
              :value="project.projectCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="应用类型" prop="appType">
          <el-radio-group v-model="form.appType">
            <el-radio label="agent-attached">Agent接入</el-radio>
            <el-radio label="self-built">自建</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="应用密钥" prop="appSecretKey">
          <el-input v-model="form.appSecretKey" placeholder="请输入应用密钥" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetForm">取消</el-button>
        <el-button type="primary" @click="submitCreate(formRef)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApplicationManagement } from '../composables/useApplicationManagement'

const appMgmt = useApplicationManagement()
const { 
  applications, 
  projects, 
  loading, 
  showCreateDialog, 
  form, 
  rules,
  loadData,
  submitCreate,
  resetForm 
} = appMgmt

const formRef = ref()
</script>

<style scoped>
.application-definition {
  padding: 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-head .title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-head .controls {
  display: flex;
  gap: 8px;
}
</style>
