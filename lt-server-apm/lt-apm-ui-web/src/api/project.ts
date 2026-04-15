import { http } from './http'

export interface Project {
  id: number
  projectCode: string
  projectName: string
  secretKey: string
  description: string
  teamId?: string
  teamName?: string
  createTime: number
  updateTime: number
}

export interface Application {
  id: number
  projectCode: string
  appCode: string
  appName: string
  description: string
  appType?: string
  appSecretKey?: string
  createTime: number
  updateTime: number
}

export async function fetchProjects() {
  const res = await http.get<{ data: Project[] }>('/project/list')
  return res.data?.data || []
}

export async function createProject(data: Partial<Project>) {
  const res = await http.post('/project/create', data)
  return res.data
}

export async function fetchApplications(projectCode?: string) {
  const res = await http.get<{ data: Application[] }>('/application/list', { params: { projectCode } })
  return res.data?.data || []
}

export async function createApplication(data: Partial<Application>) {
  const res = await http.post('/application/create', data)
  return res.data
}
