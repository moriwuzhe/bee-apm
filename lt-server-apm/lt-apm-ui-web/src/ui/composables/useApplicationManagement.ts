import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchApplications, createApplication, fetchProjects, type Application, type Project } from '../../api/project'

export function useApplicationManagement() {
  const applications = ref<Application[]>([])
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const showCreateDialog = ref(false)
  
  const form = ref({
    projectCode: '',
    appCode: '',
    appName: '',
    appType: 'self-built',
    description: '',
  })

  const rules = {
    projectCode: [{ required: true, message: '请选择项目', trigger: 'change' }],
    appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
    appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  }

  const loadData = async () => {
    loading.value = true
    try {
      applications.value = await fetchApplications()
      projects.value = await fetchProjects()
    } catch (e: any) {
      ElMessage.error(e.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  const submitCreate = async (formRef: any) => {
    if (!formRef) return
    
    await formRef.validate(async (valid: boolean) => {
      if (valid) {
        try {
          await createApplication(form.value)
          ElMessage.success('创建成功')
          showCreateDialog.value = false
          resetForm()
          loadData()
        } catch (e: any) {
          ElMessage.error(e.message || '创建失败')
        }
      }
    })
  }

  const resetForm = () => {
    form.value = { 
      projectCode: '', 
      appCode: '', 
      appName: '', 
      appType: 'self-built', 
      description: '' 
    }
  }

  return {
    applications,
    projects,
    loading,
    showCreateDialog,
    form,
    rules,
    loadData,
    submitCreate,
    resetForm
  }
}
