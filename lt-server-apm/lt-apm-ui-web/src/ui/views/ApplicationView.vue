 <template>
  <div class="application-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 应用定义 -->
      <el-tab-pane label="应用定义" name="definition">
        <div class="tab-content">
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
        </div>
      </el-tab-pane>

      <!-- Tab 2: 运行实例 -->
      <el-tab-pane label="运行实例" name="instances">
        <div class="instances-tab">
          <!-- 统计卡片 -->
          <div class="stats-cards">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #67c23a;">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ onlineCount }}</div>
                  <div class="stat-label">在线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #f56c6c;">
                  <el-icon><CircleClose /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ offlineCount }}</div>
                  <div class="stat-label">离线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #e6a23c;">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ alertedCount }}</div>
                  <div class="stat-label">活跃告警</div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="page-head">
            <div class="title">Agent 运行实例</div>
            <div class="controls">
              <el-button :loading="instancesLoading" type="primary" @click="loadInstances">刷新</el-button>
            </div>
          </div>

          <el-table :data="instances" border stripe v-loading="instancesLoading" style="width: 100%">
            <el-table-column prop="projectCode" label="项目" width="120" />
            <el-table-column prop="app" label="应用" width="150" />
            <el-table-column prop="inst" label="实例" width="120" />
            <el-table-column prop="ip" label="IP" width="140" />
            <el-table-column label="在线状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.online ? 'success' : 'danger'" size="small">
                  {{ row.online ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="告警状态" width="100">
              <template #default="{ row }">
                <el-tooltip v-if="isAlerted(row)" content="该 Agent 已触发离线告警" placement="top">
                  <el-badge is-dot type="danger" style="margin-right: 5px;">
                    <el-icon color="#f56c6c"><Bell /></el-icon>
                  </el-badge>
                </el-tooltip>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="最后心跳时间" width="180">
              <template #default="{ row }">
                {{ formatTimestamp(row.lastHeartbeatTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="120" />
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="(cmd: string) => handleDiagCommand(cmd, row)">
                  <el-button type="primary" link size="small">
                    操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <!-- 配置管理 -->
                      <el-dropdown-item command="config">⚙️ 应用配置</el-dropdown-item>
                      <el-dropdown-item command="instanceConfig">🔧 实例配置</el-dropdown-item>
                      
                      <el-dropdown-item divided />
                      <div class="dropdown-category">📊 实时监控</div>
                      <el-dropdown-item command="memoryChart">
                        <span style="display: flex; justify-content: space-between; align-items: center;">
                          <span>💾 内存监控</span>
                          <el-tag size="small" type="info">趋势</el-tag>
                        </span>
                      </el-dropdown-item>
                      <el-dropdown-item command="gcChart">
                        <span style="display: flex; justify-content: space-between; align-items: center;">
                          <span>♻️ GC分析</span>
                          <el-tag size="small" type="info">趋势</el-tag>
                        </span>
                      </el-dropdown-item>
                      <el-dropdown-item command="threadChart">
                        <span style="display: flex; justify-content: space-between; align-items: center;">
                          <span>🧵 线程监控</span>
                          <el-tag size="small" type="info">趋势</el-tag>
                        </span>
                      </el-dropdown-item>
                      <el-dropdown-item command="ioNetworkChart">
                        <span style="display: flex; justify-content: space-between; align-items: center;">
                          <span>🌐 IO/网络监控</span>
                          <el-tag size="small" type="info">趋势</el-tag>
                        </span>
                      </el-dropdown-item>
                      
                      <el-dropdown-item divided />
                      <div class="dropdown-category">🔍 实时诊断</div>
                      <el-dropdown-item command="jvmInfo">☕ JVM快照</el-dropdown-item>
                      <el-dropdown-item command="threadDump">📝 线程Dump</el-dropdown-item>
                      <el-dropdown-item command="deadlocks">🔒 死锁检测</el-dropdown-item>
                      
                      <el-dropdown-item divided />
                      <div class="dropdown-category">🛠️ 工具</div>
                      <el-dropdown-item command="gc">♻️ 执行GC</el-dropdown-item>
                      <el-dropdown-item command="sysProps">⚙️ 系统属性</el-dropdown-item>
                      <el-dropdown-item command="env">🌍 环境变量</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="900px">
      
      <!-- 图表模式 -->
      <div v-if="diagMode === 'chart' && currentDiagType" class="diag-chart-content">
        <!-- JVM信息图表 -->
        <div v-if="currentDiagType === 'jvmInfo'" class="chart-container">
          <!-- Runtime & Memory Section -->
          <el-row :gutter="16" style="margin-bottom: 16px;">
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">堆内存</div>
                <div class="stat-value">{{ formatBytes(jvmData.heapUsed) }}</div>
                <div class="stat-subtitle">/ {{ formatBytes(jvmData.heapMax) }}</div>
                <el-progress :percentage="jvmData.heapPercent" :color="getProgressColor(jvmData.heapPercent)" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">非堆内存</div>
                <div class="stat-value">{{ formatBytes(jvmData.nonHeapUsed) }}</div>
                <div class="stat-subtitle">/ {{ formatBytes(jvmData.nonHeapMax) }}</div>
                <el-progress :percentage="jvmData.nonHeapPercent" :color="getProgressColor(jvmData.nonHeapPercent)" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">线程数</div>
                <div class="stat-value">{{ jvmData.threadCount }}</div>
                <div class="stat-subtitle">峰值: {{ jvmData.peakThreadCount }}</div>
              </el-card>
            </el-col>
          </el-row>
          
          <!-- Basic Info Card -->
          <el-card shadow="never" style="margin-bottom: 16px;">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">PID:</span>
                <span class="info-value">{{ jvmData.pid }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">JVM名称:</span>
                <span class="info-value">{{ jvmData.vmName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">JVM版本:</span>
                <span class="info-value">{{ jvmData.vmVersion }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时长:</span>
                <span class="info-value">{{ formatDuration(jvmData.uptimeMs) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">启动时间:</span>
                <span class="info-value">{{ formatTimestamp(jvmData.startTimeMs) }}</span>
              </div>
            </div>
          </el-card>

          <!-- Thread & Class Loading Section -->
          <el-row :gutter="16" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="section-title">线程详情</div>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">当前线程:</span>
                    <span class="detail-value">{{ jvmData.threadCount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">守护线程:</span>
                    <span class="detail-value">{{ jvmData.daemonThreadCount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">峰值线程:</span>
                    <span class="detail-value">{{ jvmData.peakThreadCount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">累计启动:</span>
                    <span class="detail-value">{{ jvmData.totalStartedThreadCount }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="section-title">类加载</div>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">已加载类:</span>
                    <span class="detail-value">{{ jvmData.loadedClassCount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">总加载类:</span>
                    <span class="detail-value">{{ jvmData.totalLoadedClassCount }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">卸载类:</span>
                    <span class="detail-value">{{ jvmData.unloadedClassCount }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- OS Information Section -->
          <el-card shadow="never" style="margin-bottom: 16px;">
            <div class="section-title">操作系统信息</div>
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">操作系统:</span>
                    <span class="detail-value">{{ jvmData.osName }} {{ jvmData.osVersion }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">处理器:</span>
                    <span class="detail-value">{{ jvmData.availableProcessors }} 核心</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">系统负载:</span>
                    <span class="detail-value">{{ jvmData.systemLoadAverage.toFixed(2) }}</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">物理内存:</span>
                    <span class="detail-value">{{ formatBytes(jvmData.totalPhysicalMemory - jvmData.freePhysicalMemory) }} / {{ formatBytes(jvmData.totalPhysicalMemory) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">进程CPU:</span>
                    <span class="detail-value">{{ (jvmData.processCpuLoad * 100).toFixed(2) }}%</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">系统CPU:</span>
                    <span class="detail-value">{{ (jvmData.systemCpuLoad * 100).toFixed(2) }}%</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <!-- GC Summary Section -->
          <el-card shadow="never">
            <div class="section-title">GC摘要</div>
            <div class="detail-list">
              <div class="detail-item">
                <span class="detail-label">总GC次数:</span>
                <span class="detail-value">{{ jvmData.totalGcCount }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">总GC耗时:</span>
                <span class="detail-value">{{ formatDuration(jvmData.totalGcTime) }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 内存信息图表 -->
        <div v-else-if="currentDiagType === 'memory'" class="chart-container">
          <el-tabs v-model="memoryTab" type="border-card">
            <!-- 实时数据标签页 -->
            <el-tab-pane label="实时数据" name="realtime">
          <!-- Memory Overview -->
          <el-row :gutter="16" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="section-title">堆内存 (Heap)</div>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">已使用:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.heapUsed) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">已提交:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.heapCommitted) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">最大值:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.heapMax) }}</span>
                  </div>
                </div>
                <el-progress 
                  :percentage="memoryData.heapPercent" 
                  :color="getProgressColor(memoryData.heapPercent)"
                  style="margin-top: 12px"
                />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="section-title">非堆内存 (Non-Heap)</div>
                <div class="detail-list">
                  <div class="detail-item">
                    <span class="detail-label">已使用:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.nonHeapUsed) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">已提交:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.nonHeapCommitted) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">最大值:</span>
                    <span class="detail-value">{{ formatBytes(memoryData.nonHeapMax) }}</span>
                  </div>
                </div>
                <el-progress 
                  :percentage="memoryData.nonHeapPercent" 
                  :color="getProgressColor(memoryData.nonHeapPercent)"
                  style="margin-top: 12px"
                />
              </el-card>
            </el-col>
          </el-row>
          
          <!-- Memory Pools Detail -->
          <el-card shadow="never" style="margin-bottom: 16px;">
            <div class="section-title">内存池详情</div>
            <el-table :data="memoryData.pools" border stripe size="small" max-height="400">
              <el-table-column prop="name" label="内存池" min-width="180" show-overflow-tooltip />
              <el-table-column prop="type" label="类型" width="90" />
              <el-table-column label="已使用" width="110" align="right">
                <template #default="{ row }">{{ formatBytes(row.used) }}</template>
              </el-table-column>
              <el-table-column label="已提交" width="110" align="right">
                <template #default="{ row }">{{ formatBytes(row.committed) }}</template>
              </el-table-column>
              <el-table-column label="最大值" width="110" align="right">
                <template #default="{ row }">{{ formatBytes(row.max) }}</template>
              </el-table-column>
              <el-table-column label="初始化" width="110" align="right">
                <template #default="{ row }">{{ formatBytes(row.init) }}</template>
              </el-table-column>
              <el-table-column label="使用率" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getUsageLevel(row.percent)" size="small">{{ row.percent }}%</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="峰值使用" width="110" align="right">
                <template #default="{ row }">{{ row.peakUsed ? formatBytes(row.peakUsed) : '-' }}</template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- Buffer Pools -->
          <el-card v-if="memoryData.bufferPools.length > 0" shadow="never">
            <div class="section-title">缓冲区池 (Buffer Pools)</div>
            <el-table :data="memoryData.bufferPools" border stripe size="small">
              <el-table-column prop="name" label="缓冲区名称" min-width="150" />
              <el-table-column prop="count" label="数量" width="100" align="right" />
              <el-table-column label="已使用" width="120" align="right">
                <template #default="{ row }">{{ formatBytes(row.memoryUsed) }}</template>
              </el-table-column>
              <el-table-column label="总容量" width="120" align="right">
                <template #default="{ row }">{{ formatBytes(row.totalCapacity) }}</template>
              </el-table-column>
              <el-table-column label="利用率" width="100" align="center">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.totalCapacity > 0 ? getUsageLevel(Math.round((row.memoryUsed / row.totalCapacity) * 100)) : 'info'" 
                    size="small"
                  >
                    {{ row.totalCapacity > 0 ? Math.round((row.memoryUsed / row.totalCapacity) * 100) : 0 }}%
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
            </el-tab-pane>
            
            <!-- 历史趋势标签页 -->
            <el-tab-pane label="历史趋势" name="history">
              <div class="memory-history-container">
                <div class="history-controls">
                  <el-select v-model="historyTimeRange" placeholder="选择时间范围" style="width: 200px; margin-right: 10px;">
                    <el-option label="最近1小时" :value="1" />
                    <el-option label="最近6小时" :value="6" />
                    <el-option label="最近24小时" :value="24" />
                    <el-option label="最近7天" :value="168" />
                  </el-select>
                  <el-button type="primary" @click="loadMemoryHistory" :loading="historyLoading">查询</el-button>
                  
                  <!-- Phase 1: 实时监控开关 -->
                  <el-divider direction="vertical" />
                  <el-switch 
                    v-model="enableRealtime" 
                    active-text="实时监控" 
                    @change="toggleRealtime"
                  />
                  <el-select v-if="enableRealtime" v-model="pollingInterval" placeholder="轮询间隔" style="width: 120px; margin-left: 10px;">
                    <el-option label="3秒" :value="3000" />
                    <el-option label="5秒" :value="5000" />
                    <el-option label="10秒" :value="10000" />
                    <el-option label="30秒" :value="30000" />
                  </el-select>
                  <el-tag v-if="enableRealtime" type="success" effect="dark" style="margin-left: 10px;">
                    <el-icon class="is-loading"><Connection /></el-icon>
                    监控中
                  </el-tag>
                </div>
                
                <div v-if="memoryHistory.length > 0">
                  <!-- Key Metrics Cards -->
                  <el-row :gutter="16" style="margin-bottom: 20px;">
                    <el-col :span="6">
                      <el-card shadow="hover" class="metric-card">
                        <div class="metric-title">堆内存使用率</div>
                        <div class="metric-value">{{ latestHeapPercent }}%</div>
                        <el-progress :percentage="latestHeapPercent" :color="getProgressColor(latestHeapPercent)" />
                      </el-card>
                    </el-col>
                    <el-col :span="6">
                      <el-card shadow="hover" class="metric-card">
                        <div class="metric-title">GC频率</div>
                        <div class="metric-value">{{ gcFrequency }}</div>
                        <div class="metric-subtitle">次/分钟</div>
                      </el-card>
                    </el-col>
                    <el-col :span="6">
                      <el-card shadow="hover" class="metric-card">
                        <div class="metric-title">当前线程数</div>
                        <div class="metric-value">{{ latestThreadCount }}</div>
                        <div class="metric-subtitle">峰值: {{ maxThreadCount }}</div>
                      </el-card>
                    </el-col>
                    <el-col :span="6">
                      <el-card shadow="hover" class="metric-card">
                        <div class="metric-title">CPU使用率</div>
                        <div class="metric-value">{{ latestCpuPercent }}%</div>
                        <el-progress :percentage="latestCpuPercent" :color="getProgressColor(latestCpuPercent)" />
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <!-- Memory Overview Section -->
                  <div class="section-header">
                    <h3>💾 内存监控</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="heapChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="nonHeapChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="youngGenChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="oldGenChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- GC Analysis Section -->
                  <div class="section-header">
                    <h3>♻️ GC分析</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="gcCountChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="gcDurationChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Thread Monitoring Section -->
                  <div class="section-header">
                    <h3>🧵 线程监控</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="threadChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="classLoadingChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- CPU & System Section -->
                  <div class="section-header">
                    <h3>⚡ CPU & 系统</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="cpuChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="memoryPoolsGridRef" class="chart-box-large">
                        <div class="pools-grid-title">内存池详细</div>
                        <div ref="poolsGridContainer" class="pools-grid"></div>
                      </div>
                    </el-col>
                  </el-row>
                  
                  <!-- GC Advanced Analysis Section -->
                  <div class="section-header">
                    <h3>📊 GC深度分析</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="minorVsFullGcChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="gcEfficiencyChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 4: Memory Pools Detail Section -->
                  <div class="section-header">
                    <h3>️ 内存池详细趋势</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="edenSurvivorChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="oldGenChartDetailRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="metaspaceChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="codeCacheChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 5: Advanced Monitoring Section -->
                  <div class="section-header">
                    <h3>🚀 高级监控指标</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="memoryAllocationRateChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="gcPressureChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 6: Comprehensive Monitoring Section -->
                  <div class="section-header">
                    <h3>📈 综合性能分析</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="gcReclaimedChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="cpuMemoryCorrelationChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 7: Real-time Dashboard Section -->
                  <div class="section-header">
                    <h3>⚡ 实时监控仪表盘</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="topCpuThreadChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="threadStateChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 8: Performance Dashboard Section -->
                  <div class="section-header">
                    <h3>🎯 综合性能看板</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="24">
                      <div ref="performanceDashboardChartRef" class="chart-box-large" style="height: 400px;"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Thread Advanced Analysis Section -->
                  <div class="section-header">
                    <h3>🧵 线程深度分析</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="threadStatesChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="classLoadingDetailChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- JVM Info Section -->
                  <div class="section-header">
                    <h3>☕ JVM信息</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="24">
                      <el-card shadow="hover" class="jvm-info-card">
                        <el-descriptions :column="4" border size="small">
                          <el-descriptions-item label="JVM启动时间">{{ jvmStartTimeStr }}</el-descriptions-item>
                          <el-descriptions-item label="运行时长">{{ jvmUptimeStr }}</el-descriptions-item>
                          <el-descriptions-item label="峰值线程数">{{ latestPeakThreadCount }}</el-descriptions-item>
                          <el-descriptions-item label="守护线程数">{{ latestDaemonThreadCount }}</el-descriptions-item>
                          <el-descriptions-item label="累计加载类">{{ latestTotalLoadedClass }}</el-descriptions-item>
                          <el-descriptions-item label="卸载类数量">{{ latestUnloadedClass }}</el-descriptions-item>
                          <el-descriptions-item label="Minor GC次数">{{ latestMinorGcCount }}</el-descriptions-item>
                          <el-descriptions-item label="Full GC次数">{{ latestFullGcCount }}</el-descriptions-item>
                        </el-descriptions>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 2: Advanced Monitoring Section -->
                  <div class="section-header">
                    <h3>🚀 高级监控 (Phase 2)</h3>
                  </div>
                  
                  <!-- Top CPU Threads Table -->
                  <div class="section-header">
                    <h4>🔥 Top CPU线程</h4>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="24">
                      <el-card shadow="hover">
                        <el-table :data="topCpuThreadsTable" border stripe size="small" max-height="300">
                          <el-table-column prop="threadName" label="线程名称" min-width="200" />
                          <el-table-column label="CPU时间" width="150" align="right">
                            <template #default="{ row }">{{ formatNanoTime(row.cpuTimeNs) }}</template>
                          </el-table-column>
                          <el-table-column prop="state" label="状态" width="120" />
                          <el-table-column prop="blockedCount" label="Blocked" width="100" align="right" />
                          <el-table-column prop="waitedCount" label="Waited" width="100" align="right" />
                        </el-table>
                      </el-card>
                    </el-col>
                  </el-row>
                  
                  <!-- Thread Pools Chart -->
                  <div class="section-header">
                    <h4>🏊 线程池监控</h4>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="threadPoolsChartRef" class="chart-box-large"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="classLoadingRateChartRef" class="chart-box-large"></div>
                    </el-col>
                  </el-row>
                </div>
                
                <el-empty v-else description="暂无历史数据" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 内存监控历史趋势 -->
        <div v-else-if="currentDiagType === 'memoryChart'" class="chart-container">
          <div class="memory-history-container">
            <!-- 时间范围控制 -->
            <div class="history-controls" style="margin-bottom: 16px;">
              <el-select v-model="historyTimeRange" placeholder="选择时间范围" style="width: 200px; margin-right: 10px;">
                <el-option label="最近1小时" :value="1" />
                <el-option label="最近6小时" :value="6" />
                <el-option label="最近24小时" :value="24" />
                <el-option label="最近7天" :value="168" />
              </el-select>
              <el-button type="primary" @click="refreshHistoryChart" :loading="historyLoading">🔄 刷新数据</el-button>
              
              <!-- 自动刷新控制 -->
              <el-divider direction="vertical" />
              <el-switch 
                v-model="enableAutoRefresh" 
                active-text="自动刷新" 
                @change="toggleAutoRefresh"
                style="margin-left: 10px;"
              />
              <el-select 
                v-if="enableAutoRefresh" 
                v-model="autoRefreshInterval" 
                placeholder="刷新间隔" 
                style="width: 120px; margin-left: 10px;"
              >
                <el-option label="5秒" :value="5" />
                <el-option label="10秒" :value="10" />
                <el-option label="30秒" :value="30" />
                <el-option label="1分钟" :value="60" />
                <el-option label="5分钟" :value="300" />
              </el-select>
              <el-tag v-if="enableAutoRefresh" type="success" effect="dark" style="margin-left: 10px;">
                <el-icon class="is-loading"><Connection /></el-icon>
                自动刷新中
              </el-tag>
            </div>
            
            <!-- 💾 内存监控区域 -->
            <div class="section-header">
              <h3>💾 内存监控</h3>
            </div>
            
            <!-- 空数据提示 -->
            <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
              <div style="font-size: 64px; margin-bottom: 16px;">📊</div>
              <div style="font-size: 16px; margin-bottom: 8px;">暂无内存监控数据</div>
              <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
            </div>
            
            <template v-else>
            <!-- 1. 堆/非堆总览 -->
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="heapChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="nonHeapChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 2. 新生代/老年代详细 -->
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="youngGenChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="oldGenChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 3. 内存池使用趋势(所有内存池) -->
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="memoryPoolsGridRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 4. 内存深度分析 - 合并到一行 -->
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="memoryUsageRateRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="memoryAllocationRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 缓冲区池和物理内存 - 有数据时才显示，避免空白行 -->
            <template v-if="hasBufferPoolsData || hasPhysicalMemoryData">
              <el-row :gutter="16" class="charts-row">
                <el-col :span="hasBufferPoolsData && hasPhysicalMemoryData ? 12 : 24" v-if="hasBufferPoolsData">
                  <div ref="bufferPoolsChartRef" class="chart-box-large"></div>
                </el-col>
                <el-col :span="hasBufferPoolsData && hasPhysicalMemoryData ? 12 : 24" v-if="hasPhysicalMemoryData">
                  <div ref="physicalMemoryRef" class="chart-box-large"></div>
                </el-col>
              </el-row>
            </template>
            
            <!-- 5. 内存泄漏检测指标 -->
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="heapGrowthRateRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="gcPressureRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            </template>
          </div>
        </div>

        <!-- GC分析历史趋势 -->
        <div v-else-if="currentDiagType === 'gcChart'" class="chart-container">
          <div class="memory-history-container">
            <!-- 时间范围控制 -->
            <div class="history-controls" style="margin-bottom: 16px;">
              <el-select v-model="historyTimeRange" placeholder="选择时间范围" style="width: 200px; margin-right: 10px;">
                <el-option label="最近1小时" :value="1" />
                <el-option label="最近6小时" :value="6" />
                <el-option label="最近24小时" :value="24" />
                <el-option label="最近7天" :value="168" />
              </el-select>
              <el-button type="primary" @click="refreshHistoryChart" :loading="historyLoading">🔄 刷新数据</el-button>
              
              <!-- 自动刷新控制 -->
              <el-divider direction="vertical" />
              <el-switch 
                v-model="enableAutoRefresh" 
                active-text="自动刷新" 
                @change="toggleAutoRefresh"
                style="margin-left: 10px;"
              />
              <el-select 
                v-if="enableAutoRefresh" 
                v-model="autoRefreshInterval" 
                placeholder="刷新间隔" 
                style="width: 120px; margin-left: 10px;"
              >
                <el-option label="5秒" :value="5" />
                <el-option label="10秒" :value="10" />
                <el-option label="30秒" :value="30" />
                <el-option label="1分钟" :value="60" />
                <el-option label="5分钟" :value="300" />
              </el-select>
              <el-tag v-if="enableAutoRefresh" type="success" effect="dark" style="margin-left: 10px;">
                <el-icon class="is-loading"><Connection /></el-icon>
                自动刷新中
              </el-tag>
            </div>
            
            <div class="section-header">
              <h3>♻️ GC分析趋势</h3>
            </div>
            
            <!-- 空数据提示 -->
            <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
              <div style="font-size: 64px; margin-bottom: 16px;">♻️</div>
              <div style="font-size: 16px; margin-bottom: 8px;">暂无GC监控数据</div>
              <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
            </div>
            
            <template v-else>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="gcCountChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="gcDurationChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <div class="section-header">
              <h3>📊 GC深度分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="minorVsFullGcChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="gcEfficiencyChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <div class="section-header">
              <h3>☕ JVM信息</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <el-card shadow="hover" class="jvm-info-card">
                  <el-descriptions :column="4" border size="small">
                    <el-descriptions-item label="JVM启动时间">{{ jvmStartTimeStr }}</el-descriptions-item>
                    <el-descriptions-item label="运行时长">{{ jvmUptimeStr }}</el-descriptions-item>
                    <el-descriptions-item label="峰值线程数">{{ latestPeakThreadCount }}</el-descriptions-item>
                    <el-descriptions-item label="守护线程数">{{ latestDaemonThreadCount }}</el-descriptions-item>
                    <el-descriptions-item label="累计加载类">{{ latestTotalLoadedClass }}</el-descriptions-item>
                    <el-descriptions-item label="卸载类数量">{{ latestUnloadedClass }}</el-descriptions-item>
                    <el-descriptions-item label="Minor GC次数">{{ latestMinorGcCount }}</el-descriptions-item>
                    <el-descriptions-item label="Full GC次数">{{ latestFullGcCount }}</el-descriptions-item>
                  </el-descriptions>
                  
                  <!-- 只在有JVM参数数据时显示 -->
                  <template v-if="latestJvmArgs && latestJvmArgs.length > 0">
                    <el-divider content-position="left">
                      <el-icon><Setting /></el-icon>
                      JVM参数
                    </el-divider>
                    <div class="jvm-args-container">
                      <el-tag 
                        v-for="(arg, index) in latestJvmArgs" 
                        :key="index"
                        size="small"
                        type="info"
                        style="margin: 2px;"
                      >
                        {{ arg }}
                      </el-tag>
                    </div>
                  </template>
                </el-card>
              </el-col>
            </el-row>
            </template>
          </div>
        </div>

        <!-- 线程监控历史趋势 -->
        <div v-else-if="currentDiagType === 'threadChart'" class="chart-container">
          <div class="memory-history-container">
            <!-- 时间范围控制 -->
            <div class="history-controls" style="margin-bottom: 16px;">
              <el-select v-model="historyTimeRange" placeholder="选择时间范围" style="width: 200px; margin-right: 10px;">
                <el-option label="最近1小时" :value="1" />
                <el-option label="最近6小时" :value="6" />
                <el-option label="最近24小时" :value="24" />
                <el-option label="最近7天" :value="168" />
              </el-select>
              <el-button type="primary" @click="refreshHistoryChart" :loading="historyLoading">🔄 刷新数据</el-button>
              
              <!-- 自动刷新控制 -->
              <el-divider direction="vertical" />
              <el-switch 
                v-model="enableAutoRefresh" 
                active-text="自动刷新" 
                @change="toggleAutoRefresh"
                style="margin-left: 10px;"
              />
              <el-select 
                v-if="enableAutoRefresh" 
                v-model="autoRefreshInterval" 
                placeholder="刷新间隔" 
                style="width: 120px; margin-left: 10px;"
              >
                <el-option label="5秒" :value="5" />
                <el-option label="10秒" :value="10" />
                <el-option label="30秒" :value="30" />
                <el-option label="1分钟" :value="60" />
                <el-option label="5分钟" :value="300" />
              </el-select>
              <el-tag v-if="enableAutoRefresh" type="success" effect="dark" style="margin-left: 10px;">
                <el-icon class="is-loading"><Connection /></el-icon>
                自动刷新中
              </el-tag>
            </div>
            
            <div class="section-header">
              <h3>🧵 线程监控趋势</h3>
            </div>
            
            <!-- 空数据提示 -->
            <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
              <div style="font-size: 64px; margin-bottom: 16px;">🧵</div>
              <div style="font-size: 16px; margin-bottom: 8px;">暂无线程监控数据</div>
              <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
            </div>
            
            <template v-else>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="threadChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="classLoadingChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <div class="section-header">
              <h3>🧵 线程深度分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="threadStatesChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="classLoadingDetailChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            </template>
            
            <!-- 🏊 线程池监控 - 始终显示 -->
            <div class="section-header">
              <h3>🏊 线程池与类加载</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="threadPoolsChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- ⚡ CPU与系统监控 - 始终显示 -->
            <div class="section-header">
              <h3>⚡ CPU与系统监控</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="cpuChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- IO/网络监控历史趋势 -->
        <div v-else-if="currentDiagType === 'ioNetworkChart'" class="chart-container">
          <div class="memory-history-container">
            <!-- 时间范围控制 -->
            <div class="history-controls" style="margin-bottom: 16px;">
              <el-select v-model="historyTimeRange" placeholder="选择时间范围" style="width: 200px; margin-right: 10px;">
                <el-option label="最近1小时" :value="1" />
                <el-option label="最近6小时" :value="6" />
                <el-option label="最近24小时" :value="24" />
                <el-option label="最近7天" :value="168" />
              </el-select>
              <el-button type="primary" @click="refreshHistoryChart" :loading="historyLoading">🔄 刷新数据</el-button>
              
              <!-- 自动刷新控制 -->
              <el-divider direction="vertical" />
              <el-switch 
                v-model="enableAutoRefresh" 
                active-text="自动刷新" 
                @change="toggleAutoRefresh"
                style="margin-left: 10px;"
              />
              <el-select 
                v-if="enableAutoRefresh" 
                v-model="autoRefreshInterval" 
                placeholder="刷新间隔" 
                style="width: 120px; margin-left: 10px;"
              >
                <el-option label="5秒" :value="5" />
                <el-option label="10秒" :value="10" />
                <el-option label="30秒" :value="30" />
                <el-option label="1分钟" :value="60" />
                <el-option label="5分钟" :value="300" />
              </el-select>
              <el-tag v-if="enableAutoRefresh" type="success" effect="dark" style="margin-left: 10px;">
                <el-icon class="is-loading"><Connection /></el-icon>
                自动刷新中
              </el-tag>
            </div>
            
            <div class="section-header">
              <h3>🌐 IO/网络监控趋势</h3>
            </div>
            
            <!-- 空数据提示 -->
            <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
              <div style="font-size: 64px; margin-bottom: 16px;">🌐</div>
              <div style="font-size: 16px; margin-bottom: 8px;">暂无IO/网络监控数据</div>
              <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
            </div>
            
            <template v-else>
            <!-- 磁盘I/O监控 -->
            <template v-if="hasDiskIoData">
              <div class="section-header">
                <h3>💾 磁盘I/O监控</h3>
              </div>
              <el-row :gutter="16" class="charts-row">
                <el-col :span="24">
                  <div ref="diskIoRef" class="chart-box-large"></div>
                </el-col>
              </el-row>
            </template>
            
            <!-- 网络监控 (预留，待后端支持) -->
            <div v-if="!hasDiskIoData" style="text-align: center; padding: 60px 0; color: #909399;">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <div style="font-size: 16px; margin-bottom: 8px;">暂无IO/网络数据</div>
              <div style="font-size: 13px; color: #c0c4cc;">当前Agent版本可能未采集网络和IO指标</div>
            </div>
            </template>
          </div>
        </div>

        <!-- GC统计图表 -->
        <div v-else-if="currentDiagType === 'gcStats'" class="chart-container">
          <el-card shadow="never">
            <div class="chart-title">GC收集器统计</div>
            <el-table :data="gcData.collectors" border stripe size="small">
              <el-table-column prop="name" label="GC收集器" min-width="150"></el-table-column>
              <el-table-column prop="count" label="收集次数" width="100" align="right"></el-table-column>
              <el-table-column label="总耗时" width="120" align="right">
                <template #default="{ row }">{{ row.timeMs }} ms</template>
              </el-table-column>
              <el-table-column label="平均耗时" width="120" align="right">
                <template #default="{ row }">{{ row.count > 0 ? (row.timeMs / row.count).toFixed(2) : 0 }} ms</template>
              </el-table-column>
              <el-table-column prop="pools" label="管理的内存池" min-width="200" show-overflow-tooltip></el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 线程概要图表 -->
        <div v-else-if="currentDiagType === 'threadsSummary'" class="chart-container">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">当前线程</div>
                <div class="stat-value large">{{ threadsData.threadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">守护线程</div>
                <div class="stat-value large">{{ threadsData.daemonThreadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">峰值线程</div>
                <div class="stat-value large">{{ threadsData.peakThreadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">累计启动</div>
                <div class="stat-value large">{{ threadsData.totalStartedThreadCount }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 其他文本模式 -->
        <div v-else class="text-mode">
          <el-input v-model="diagResult" type="textarea" :rows="25" readonly />
        </div>
      </div>

      <!-- 文本模式 -->
      <div v-else class="diag-text-content">
        <el-input v-model="diagResult" type="textarea" :rows="25" readonly />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <!-- 历史监控图表的刷新按钮 -->
          <el-button 
            v-if="['memoryChart', 'gcChart', 'threadChart', 'ioNetworkChart'].includes(currentDiagType)" 
            type="success" 
            @click="refreshHistoryChart"
          >
            🔄 刷新数据
          </el-button>
          <el-button v-if="diagMode === 'chart' && currentDiagType" @click="switchToTextMode">查看原始数据</el-button>
          <el-button v-else-if="canShowChart" @click="switchToChartMode">图表视图</el-button>
          <el-button @click="copyDiagResult">复制结果</el-button>
          <el-button type="primary" @click="showDiagDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 配置管理对话框 -->
    <el-dialog v-model="showConfigDialog" :title="configMode === 'app' ? '应用配置管理' : '实例配置管理'" width="900px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="应用">
          <span>{{ currentApp }}</span>
        </el-form-item>
        <el-form-item v-if="configMode === 'instance'" label="实例">
          <span>{{ currentInst }}</span>
        </el-form-item>
        
        <!-- 配置来源选择 -->
        <el-tabs v-model="configSourceTab" type="border-card">
          <el-tab-pane label="数据库配置" name="database">
            <div class="config-hint">
              <el-alert
                title="这是存储在数据库中的配置，Agent 会在下次心跳时拉取并应用"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
            <el-input 
              type="textarea" 
              v-model="dbConfigContent" 
              :rows="16" 
              placeholder="# 请输入 YAML 格式的配置内容\nsampling:\n  rate: 1000\nplugins:\n  jdbc:\n    enabled: true"
            />
          </el-tab-pane>
          
          <el-tab-pane label="Agent运行时配置" name="runtime">
            <div class="config-hint">
              <el-alert
                :title="agentRuntimeConfig ? '这是 Agent 本地配置文件的内容（仅供参考）' : '无法获取 Agent 运行时配置，请确保 Agent 在线且已连接'"
                :description="configMode === 'app' ? '注意：应用级和实例级共享同一个 Agent 配置文件。如需差异化配置，请在数据库标签页中分别设置应用配置和实例配置，Agent 拉取时会自动合并。' : '注意：实例配置会覆盖应用配置中的相同字段。最终生效配置 = 应用配置 + 实例配置(覆盖)。'"
                :type="agentRuntimeConfig ? 'info' : 'warning'"
                :closable="false"
                show-icon
              />
            </div>
            <el-input 
              type="textarea" 
              v-model="agentRuntimeConfig" 
              :rows="16" 
              readonly
              placeholder="加载中..."
            />
          </el-tab-pane>
          
          <el-tab-pane label="查看所有配置" name="full">
            <div class="config-hint">
              <el-alert
                title="完整的配置信息（包括应用配置、实例配置和合并后的最终配置）"
                description="这里显示数据库中存储的配置以及合并后的最终配置。Agent 下次心跳时会拉取并应用这些配置。"
                type="success"
                :closable="false"
                show-icon
              />
            </div>
            
            <el-collapse v-if="fullConfigInfo" v-model="activeCollapsePanels">
              <el-collapse-item title="应用级配置" name="app">
                <div class="config-section">
                  <div class="config-meta">版本: {{ fullConfigInfo.appConfigVersion }}</div>
                  <el-input 
                    type="textarea" 
                    :model-value="fullConfigInfo.appConfig || '# 暂无应用配置'" 
                    :rows="8" 
                    readonly
                  />
                </div>
              </el-collapse-item>
              
              <el-collapse-item v-if="configMode === 'instance'" title="实例级配置" name="instance">
                <div class="config-section">
                  <div class="config-meta">版本: {{ fullConfigInfo.instanceConfigVersion }}</div>
                  <el-input 
                    type="textarea" 
                    :model-value="fullConfigInfo.instanceConfig || '# 暂无实例配置'" 
                    :rows="8" 
                    readonly
                  />
                </div>
              </el-collapse-item>
              
              <el-collapse-item title="合并后的最终配置" name="merged">
                <div class="config-section">
                  <div class="config-meta">最终版本: {{ fullConfigInfo.finalVersion }}</div>
                  <el-alert
                    :description="configMode === 'instance' ? '实例配置会覆盖应用配置中的相同字段' : '当前只有应用级配置'"
                    type="info"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 10px"
                  />
                  <el-input 
                    type="textarea" 
                    :model-value="fullConfigInfo.mergedConfig || '# 无配置'" 
                    :rows="12" 
                    readonly
                  />
                </div>
              </el-collapse-item>
            </el-collapse>
            
            <div v-else class="loading-text">加载中...</div>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <el-button @click="syncFromRuntime" :disabled="!agentRuntimeConfig">从运行时同步</el-button>
          <el-button type="primary" @click="submitConfig" :loading="submitting">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

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
        <el-form-item label="应用类型" prop="appType">
          <el-select v-model="form.appType" placeholder="请选择应用类型">
            <el-option label="自建" value="self-built" />
            <el-option label="Agent接入" value="agent-attached" />
          </el-select>
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
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, CircleClose, Bell, ArrowDown, Setting } from '@element-plus/icons-vue'
import { fetchApplications, createApplication, fetchProjects, type Application, type Project } from '../../api/project'
import { http } from '../../api/http'
import {
  getAppConfig,
  getInstanceConfig,
  updateAgentConfig,
  updateAgentInstanceConfig,
  agentThreadDump,
  agentJvmInfo,
  agentGc,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentDeadlocks,
  agentSysProps,
  agentEnv,
  agentReadConfig,
  fetchAgentConnections,
  getFullConfigInfo,
  getMemoryHistory,
  type AgentFullConfigInfo,
  type AgentMemoryMetrics
} from '../../api/agent'
import * as echarts from 'echarts'

const activeTab = ref('definition')
const applications = ref<Application[]>([])
const projects = ref<Project[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const formRef = ref()
const form = ref({
  projectCode: '',
  appCode: '',
  appName: '',
  appType: 'self-built',
  description: '',
})

// 运行实例相关
interface AgentInstance {
  projectCode: string
  app: string
  inst: string
  ip: string
  version: string | null
  configVersion: string | null
  lastHeartbeatTime: number
  online: boolean
  secretKey: string | null
}

const instances = ref<AgentInstance[]>([])
const instancesLoading = ref(false)
const alertedAgents = ref<string[]>([]) // 已告警的 Agent 列表

// 诊断相关
const showDiagDialog = ref(false)
const diagDialogTitle = ref('')
const diagResult = ref('')
const diagMode = ref<'chart' | 'text'>('chart')
const currentDiagType = ref('')
const currentDiagRow = ref<any>(null) // 保存当前诊断的实例行

// GC数据结构
interface GcData {
  collectors: Array<{ name: string; count: number; timeMs: number; pools: string }>
}

const gcData = ref<GcData>({ collectors: [] })

// 线程数据结构
interface ThreadsData {
  threadCount: number
  daemonThreadCount: number
  peakThreadCount: number
  totalStartedThreadCount: number
}

const threadsData = ref<ThreadsData>({
  threadCount: 0, daemonThreadCount: 0,
  peakThreadCount: 0, totalStartedThreadCount: 0
})

// 配置对话框相关
const showConfigDialog = ref(false)
const configMode = ref<'app' | 'instance'>('app')
const currentApp = ref('')
const currentInst = ref('')
const configForm = ref({ config: '' })
const submitting = ref(false)
const configSourceTab = ref('database')
const dbConfigContent = ref('')
const agentRuntimeConfig = ref('')
const fullConfigInfo = ref<AgentFullConfigInfo | null>(null)
const activeCollapsePanels = ref<string[]>(['app', 'merged'])

// JVM数据结构
interface JvmData {
  // Runtime
  pid: string
  uptimeMs: number
  startTimeMs: number
  vmName: string
  vmVersion: string
  
  // Memory
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  
  // Thread
  threadCount: number
  peakThreadCount: number
  daemonThreadCount: number
  totalStartedThreadCount: number
  
  // Class Loading
  loadedClassCount: number
  totalLoadedClassCount: number
  unloadedClassCount: number
  
  // OS
  osName: string
  osVersion: string
  availableProcessors: number
  systemLoadAverage: number
  totalPhysicalMemory: number
  freePhysicalMemory: number
  processCpuLoad: number
  systemCpuLoad: number
  
  // GC
  totalGcCount: number
  totalGcTime: number
}

const jvmData = ref<JvmData>({
  pid: '',
  uptimeMs: 0,
  startTimeMs: 0,
  vmName: '',
  vmVersion: '',
  heapUsed: 0, heapMax: 0, heapPercent: 0,
  nonHeapUsed: 0, nonHeapMax: 0, nonHeapPercent: 0,
  threadCount: 0, peakThreadCount: 0,
  daemonThreadCount: 0, totalStartedThreadCount: 0,
  loadedClassCount: 0, totalLoadedClassCount: 0, unloadedClassCount: 0,
  osName: '', osVersion: '', availableProcessors: 0,
  systemLoadAverage: 0, totalPhysicalMemory: 0, freePhysicalMemory: 0,
  processCpuLoad: 0, systemCpuLoad: 0,
  totalGcCount: 0, totalGcTime: 0
})

// 内存数据结构
interface MemoryData {
  // Heap
  heapUsed: number
  heapCommitted: number
  heapMax: number
  heapPercent: number
  
  // Non-Heap
  nonHeapUsed: number
  nonHeapCommitted: number
  nonHeapMax: number
  nonHeapPercent: number
  
  // Memory Pools
  pools: Array<{ 
    name: string
    type: string
    used: number
    committed: number
    max: number
    init: number
    percent: number
    collectionUsed?: number
    collectionCommitted?: number
    collectionMax?: number
    peakUsed?: number
    peakCommitted?: number
  }>
  
  // Buffer Pools
  bufferPools: Array<{
    name: string
    count: number
    memoryUsed: number
    totalCapacity: number
  }>
}

const memoryData = ref<MemoryData>({
  heapUsed: 0, heapCommitted: 0, heapMax: 0, heapPercent: 0,
  nonHeapUsed: 0, nonHeapCommitted: 0, nonHeapMax: 0, nonHeapPercent: 0,
  pools: [],
  bufferPools: []
})

// 内存历史相关
const memoryTab = ref('realtime')
const historyTimeRange = ref(6) // 默认6小时
const historyLoading = ref(false)
const memoryHistory = ref<AgentMemoryMetrics[]>([])

// Phase 1: 实时监控相关
const enableRealtime = ref(false)
const pollingInterval = ref(5000) // 默认5秒
const enableAutoRefresh = ref(false) // 是否启用自动刷新
const autoRefreshInterval = ref(10) // 自动刷新间隔(秒)
let realtimeTimer: number | null = null
let autoRefreshTimer: number | null = null
const heapChartRef = ref<HTMLElement>()
const nonHeapChartRef = ref<HTMLElement>()
const youngGenChartRef = ref<HTMLElement>()
const oldGenChartRef = ref<HTMLElement>()
const gcCountChartRef = ref<HTMLElement>()
const gcDurationChartRef = ref<HTMLElement>()
const threadChartRef = ref<HTMLElement>()
const classLoadingChartRef = ref<HTMLElement>()
const cpuChartRef = ref<HTMLElement>()
const memoryPoolsGridRef = ref<HTMLElement>()
const memoryUsageRateRef = ref<HTMLElement>()
const bufferPoolsChartRef = ref<HTMLElement>()
const memoryAllocationRef = ref<HTMLElement>()
const physicalMemoryRef = ref<HTMLElement>()
const heapGrowthRateRef = ref<HTMLElement>()
const gcPressureRef = ref<HTMLElement>()
const systemLoadRef = ref<HTMLElement>()
const diskIoRef = ref<HTMLElement>()
let memoryPoolsGridInstance: any = null
let memoryUsageRateInstance: any = null
let bufferPoolsChartInstance: any = null
let memoryAllocationInstance: any = null
let physicalMemoryInstance: any = null
let heapGrowthRateInstance: any = null
let gcPressureInstance: any = null
let systemLoadInstance: any = null
let diskIoInstance: any = null
const minorVsFullGcChartRef = ref<HTMLElement>()
const gcEfficiencyChartRef = ref<HTMLElement>()
const threadStatesChartRef = ref<HTMLElement>()
const classLoadingDetailChartRef = ref<HTMLElement>()
const threadPoolsChartRef = ref<HTMLElement>()
const classLoadingRateChartRef = ref<HTMLElement>()
// Phase 4: Memory Pools Detail
const edenSurvivorChartRef = ref<HTMLElement>()
const oldGenChartDetailRef = ref<HTMLElement>()
const metaspaceChartRef = ref<HTMLElement>()
const codeCacheChartRef = ref<HTMLElement>()
// Phase 5: Advanced Monitoring
const memoryAllocationRateChartRef = ref<HTMLElement>()
const gcPressureChartRef = ref<HTMLElement>()
// Phase 6: Comprehensive Monitoring
const gcReclaimedChartRef = ref<HTMLElement>()
const cpuMemoryCorrelationChartRef = ref<HTMLElement>()
// Phase 7: Real-time Dashboard
const topCpuThreadChartRef = ref<HTMLElement>()
const threadStateChartRef = ref<HTMLElement>()
// Phase 8: Performance Dashboard
const performanceDashboardChartRef = ref<HTMLElement>()
let heapChartInstance: any = null
let nonHeapChartInstance: any = null
let youngGenChartInstance: any = null
let oldGenChartInstance: any = null
let gcCountChartInstance: any = null
let gcDurationChartInstance: any = null
let threadChartInstance: any = null
let classLoadingChartInstance: any = null
let cpuChartInstance: any = null
let minorVsFullGcChartInstance: any = null
let gcEfficiencyChartInstance: any = null
let threadStatesChartInstance: any = null
let classLoadingDetailChartInstance: any = null
let threadPoolsChartInstance: any = null
let classLoadingRateChartInstance: any = null
// Phase 4: Memory Pools Detail Chart Instances
let edenSurvivorChartInstance: any = null
let oldGenChartDetailInstance: any = null
let metaspaceChartInstance: any = null
let codeCacheChartInstance: any = null
// Phase 5: Advanced Monitoring Chart Instances
let memoryAllocationRateChartInstance: any = null
let gcPressureChartInstance: any = null
// Phase 6: Comprehensive Monitoring Chart Instances
let gcReclaimedChartInstance: any = null
let cpuMemoryCorrelationChartInstance: any = null
// Phase 7: Real-time Dashboard Chart Instances
let topCpuThreadChartInstance: any = null
let threadStateChartInstance: any = null
// Phase 8: Performance Dashboard Chart Instance
let performanceDashboardChartInstance: any = null
interface MemoryPool {
  name: string
  type: string
}
const selectedPools = ref<MemoryPool[]>([])

const canShowChart = computed(() => {
  return ['jvmInfo', 'memory', 'gcStats', 'threadsSummary'].includes(currentDiagType.value)
})

// Computed properties for key metrics cards
const latestHeapPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.heapMax > 0 ? Math.round((latest.heapUsed / latest.heapMax) * 100) : 0
})

const gcFrequency = computed(() => {
  if (memoryHistory.value.length < 2) return '0'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
  const gcDiff = last.gcCount - first.gcCount
  return timeDiffMinutes > 0 ? (gcDiff / timeDiffMinutes).toFixed(1) : '0'
})

const latestThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].threadCount || 0
})

const maxThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return Math.max(...memoryHistory.value.map(m => m.threadCount || 0))
})

const latestCpuPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.processCpuLoad ? Math.round(latest.processCpuLoad * 100) : 0
})

// New computed properties for advanced charts
const latestPeakThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].peakThreadCount || 0
})

const latestDaemonThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].daemonThreadCount || 0
})

const latestTotalLoadedClass = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].totalLoadedClassCount || 0
})

const latestUnloadedClass = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].unloadedClassCount || 0
})

const latestMinorGcCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].minorGcCount || 0
})

const latestFullGcCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].fullGcCount || 0
})

const jvmStartTimeStr = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const startTime = memoryHistory.value[memoryHistory.value.length - 1].jvmStartTime
  if (!startTime) return '-'
  const date = new Date(startTime)
  return date.toLocaleString('zh-CN')
})

const jvmUptimeStr = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const startTime = memoryHistory.value[memoryHistory.value.length - 1].jvmStartTime
  const collectTime = memoryHistory.value[memoryHistory.value.length - 1].collectTime
  if (!startTime || !collectTime) return '-'
  const uptimeMs = collectTime - startTime
  const hours = Math.floor(uptimeMs / 3600000)
  const minutes = Math.floor((uptimeMs % 3600000) / 60000)
  return `${hours}小时${minutes}分钟`
})

// JVM启动信息
const latestJvmVersion = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].jvmVersion || ''
})

const latestJvmVendor = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].jvmVendor || ''
})

const latestJavaVersion = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].javaVersion || ''
})

const latestOsName = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].osName || ''
})

const latestOsArch = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].osArch || ''
})

const latestProcessId = computed(() => {
  if (memoryHistory.value.length === 0) return ''
  return memoryHistory.value[memoryHistory.value.length - 1].processId || ''
})

const latestJvmArgs = computed(() => {
  if (memoryHistory.value.length === 0) return []
  const args = memoryHistory.value[memoryHistory.value.length - 1].jvmArgs
  if (!args) return []
  try {
    return JSON.parse(args)
  } catch (e) {
    return []
  }
})

// 检查是否有缓冲区池数据
const hasBufferPoolsData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.bufferPools) return false
  try {
    const buffers = JSON.parse(latest.bufferPools)
    return buffers && buffers.length > 0
  } catch (e) {
    return false
  }
})

// 检查是否有内存池数据
const hasMemoryPoolsData = computed(() => {
  if (memoryHistory.value.length === 0) {
    console.log('[hasMemoryPoolsData] No history data')
    return false
  }

  console.log(`[hasMemoryPoolsData] Checking ${memoryHistory.value.length} records`)
  
  // 检查所有记录中是否有实际的内存池数据
  for (let i = 0; i < memoryHistory.value.length; i++) {
    const record = memoryHistory.value[i]
    if (record.memoryPools) {
      try {
        const pools = JSON.parse(record.memoryPools)
        console.log(`[hasMemoryPoolsData] Record ${i}: Found ${pools.length} pools`, pools.map((p: any) => p.name))
        if (pools && pools.length > 0) {
          return true
        }
      } catch (e) {
        console.warn(`[hasMemoryPoolsData] Record ${i}: Failed to parse memoryPools`, e)
      }
    } else {
      console.log(`[hasMemoryPoolsData] Record ${i}: No memoryPools field`)
    }
  }
  console.log('[hasMemoryPoolsData] No valid pool data found')
  return false
})

// 检查是否有物理内存数据
const hasPhysicalMemoryData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.totalPhysicalMemory !== undefined && latest.totalPhysicalMemory > 0
})

// 检查是否有系统负载数据
const hasSystemLoadData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.systemCpuLoad !== undefined || latest.processCpuLoad !== undefined
})

// 检查是否有磁盘I/O数据
const hasDiskIoData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  // 修复：使用 != null 而不是 !== undefined，避免 null 被误判为有数据
  return (latest.diskReadBytes != null && latest.diskReadBytes > 0) || 
         (latest.diskWriteBytes != null && latest.diskWriteBytes > 0)
})

// 检查是否有CPU数据
const hasCpuData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.cpuUsage !== undefined || latest.systemCpuUsage !== undefined
})

// 检查是否有线程池数据
const hasThreadPoolData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.threadPools) return false
  try {
    const pools = JSON.parse(latest.threadPools)
    return pools && pools.length > 0
  } catch (e) {
    return false
  }
})

// 检查是否有类加载速率数据
const hasClassLoadingRateData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.classLoadingRate !== undefined
})

// Phase 2: Top CPU Threads Table Data
const topCpuThreadsTable = computed(() => {
  if (memoryHistory.value.length === 0 || !memoryHistory.value[0].topCpuThreads) return []
  try {
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    const threads: any[] = JSON.parse(latest.topCpuThreads!)
    return threads.map(t => ({
      ...t,
      cpuTimeNs: t.cpuTimeNs || 0
    }))
  } catch (e) {
    console.error('Failed to parse topCpuThreads:', e)
    return []
  }
})

// Helper function to format nanoseconds to readable time
const formatNanoTime = (ns: number) => {
  if (!ns) return '0s'
  const ms = ns / 1000000
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const minutes = seconds / 60
  return `${minutes.toFixed(2)}min`
}

const loadInstances = async () => {
  instancesLoading.value = true
  try {
    const res = await http.get('/api/agent/instances')
    instances.value = (res.data as any)?.result || []
    
    // 同时加载告警状态
    await loadAlertedAgents()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    instancesLoading.value = false
  }
}

const loadAlertedAgents = async () => {
  try {
    const res = await http.get('/api/alert/list', { params: { limit: 100 } })
    const alerts = (res.data as any)?.result || []
    // 提取活跃的 AGENT_OFFLINE 告警
    const activeAlerts = alerts.filter((a: any) => 
      a.alertType === 'AGENT_OFFLINE' && a.status === 'ACTIVE'
    )
    alertedAgents.value = activeAlerts.map((a: any) => a.app)
  } catch (e: any) {
    console.error('Failed to load alerted agents:', e)
  }
}

// 计算属性
const onlineCount = computed(() => instances.value.filter(i => i.online).length)
const offlineCount = computed(() => instances.value.filter(i => !i.online).length)
const alertedCount = computed(() => alertedAgents.value.length)

// 判断 Agent 是否已告警
const isAlerted = (row: AgentInstance) => {
  return alertedAgents.value.includes(row.app) && !row.online
}

// 处理诊断命令
const handleDiagCommand = async (cmd: string, row: AgentInstance) => {
  // 构建简化的 agentId 用于匹配
  const simpleAgentId = `${row.app}@${row.inst}`
  
  // 从在线 Agent 列表中查找完整的 agentId
  let agentId = simpleAgentId
  try {
    const connections = await fetchAgentConnections()
    const matched = connections.find(conn => {
      return conn.agentId === simpleAgentId || 
             conn.agentId.startsWith(simpleAgentId + '@') ||
             conn.agentId.includes(`@${row.inst}@`)
    })
    if (matched) {
      agentId = matched.agentId
    }
  } catch (e) {
    console.warn('Failed to fetch agent connections, using simple agentId')
  }
  
  switch (cmd) {
    case 'config':
      configMode.value = 'app'
      currentApp.value = row.app
      currentInst.value = ''
      showConfigDialog.value = true
      configSourceTab.value = 'database'
      dbConfigContent.value = '加载中...'
      agentRuntimeConfig.value = ''
      fullConfigInfo.value = null
      
      // 从数据库获取配置
      getAppConfig(row.app).then(config => {
        dbConfigContent.value = config || '# 暂无配置\n# 请在此输入 YAML 格式的配置内容'
      }).catch(e => {
        console.error('Failed to load app config:', e)
        dbConfigContent.value = '# 加载失败\n' + e.message
      })
      
      // 加载完整配置信息
      getFullConfigInfo(row.app).then(info => {
        fullConfigInfo.value = info || null
      }).catch(e => {
        console.error('Failed to load full config:', e)
      })
      
      // 尝试从 Agent 获取运行时配置
      fetchAgentConnections().then(connections => {
        const matched = connections.find(conn => {
          // agentId 格式: order@dev@test01@127.0.0.1:8081
          // 需要匹配 app=order, inst=test01
          return conn.agentId.includes(`@${row.inst}@`) ||
                 (conn.agentId.startsWith(`${row.app}@`) && conn.agentId.includes(`@${row.inst}@`))
        })
        if (matched && matched.connected) {
          console.log('Found connected agent:', matched.agentId)
          // 直接读取 Agent 的 config.yml 文件内容
          return agentReadConfig(matched.agentId)
        }
        console.warn('No matching agent found for', row.app, row.inst)
        return null
      }).then(configContent => {
        if (configContent && configContent.trim()) {
          agentRuntimeConfig.value = configContent
        } else {
          agentRuntimeConfig.value = '# Agent 配置文件为空或无法读取\n# 请检查 Agent 是否正常启动'
        }
      }).catch(e => {
        console.warn('Failed to get runtime config from agent:', e)
        agentRuntimeConfig.value = '# 无法获取 Agent 运行时配置\n# 请确保 Agent 在线且已连接'
      })
      break
      
    case 'instanceConfig':
      configMode.value = 'instance'
      currentApp.value = row.app
      currentInst.value = row.inst
      showConfigDialog.value = true
      configSourceTab.value = 'database'
      dbConfigContent.value = '加载中...'
      agentRuntimeConfig.value = ''
      fullConfigInfo.value = null
      
      // 从数据库获取配置
      getInstanceConfig(row.app, row.inst).then(config => {
        dbConfigContent.value = config || '# 暂无实例配置\n# 实例配置会覆盖应用级配置\n# 请在此输入 YAML 格式的配置内容'
      }).catch(e => {
        console.error('Failed to load instance config:', e)
        dbConfigContent.value = '# 加载失败\n' + e.message
      })
      
      // 加载完整配置信息
      getFullConfigInfo(row.app, row.inst).then(info => {
        fullConfigInfo.value = info || null
      }).catch(e => {
        console.error('Failed to load full config:', e)
      })
      
      // 尝试从 Agent 获取运行时配置
      fetchAgentConnections().then(connections => {
        const matched = connections.find(conn => {
          // agentId 格式: order@dev@test01@127.0.0.1:8081
          // 需要匹配 app=order, inst=test01
          return conn.agentId.includes(`@${row.inst}@`) ||
                 (conn.agentId.startsWith(`${row.app}@`) && conn.agentId.includes(`@${row.inst}@`))
        })
        if (matched && matched.connected) {
          console.log('Found connected agent:', matched.agentId)
          // 直接读取 Agent 的 config.yml 文件内容
          return agentReadConfig(matched.agentId)
        }
        console.warn('No matching agent found for', row.app, row.inst)
        return null
      }).then(configContent => {
        if (configContent && configContent.trim()) {
          agentRuntimeConfig.value = configContent
        } else {
          agentRuntimeConfig.value = '# Agent 配置文件为空或无法读取\n# 请检查 Agent 是否正常启动'
        }
      }).catch(e => {
        console.warn('Failed to get runtime config from agent:', e)
        agentRuntimeConfig.value = '# 无法获取 Agent 运行时配置\n# 请确保 Agent 在线且已连接'
      })
      break
      
    case 'memoryChart':
      // 在当前对话框中显示内存历史监控图表
      currentDiagRow.value = row
      await showMemoryHistoryChart(row)
      break
      
    case 'gcChart':
      currentDiagRow.value = row
      await showGcHistoryChart(row)
      break
      
    case 'threadChart':
      currentDiagRow.value = row
      await showThreadHistoryChart(row)
      break
      
    case 'ioNetworkChart':
      currentDiagRow.value = row
      await showIoNetworkHistoryChart(row)
      break
      
    case 'jvmInfo':
      await executeDiagCommand('JVM信息', () => agentJvmInfo(agentId), 'jvmInfo')
      break
      
    case 'memory':
      await executeDiagCommand('内存信息', () => agentMemory(agentId), 'memory')
      break
      
    case 'threadDump':
      await executeDiagCommand('线程Dump', () => agentThreadDump(agentId))
      break
      
    case 'threadsSummary':
      await executeDiagCommand('线程概要', () => agentThreadsSummary(agentId), 'threadsSummary')
      break
      
    case 'gcStats':
      await executeDiagCommand('GC统计', () => agentGcStats(agentId), 'gcStats')
      break
      
    case 'deadlocks':
      await executeDiagCommand('死锁检测', () => agentDeadlocks(agentId))
      break
      
    case 'gc':
      try {
        await ElMessageBox.confirm(
          `确定要对 ${row.app}@${row.inst} 执行 GC 吗？这可能会导致短暂的停顿。`,
          '执行 GC 确认',
          {
            confirmButtonText: '确定执行',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        await executeDiagCommand('执行GC', () => agentGc(agentId))
      } catch (e: any) {
        if (e !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
      break
      
    case 'sysProps':
      await executeDiagCommand('系统属性', () => agentSysProps(agentId))
      break
      
    case 'env':
      await executeDiagCommand('环境变量', () => agentEnv(agentId))
      break
  }
}

// 执行诊断命令
const executeDiagCommand = async (title: string, fn: () => Promise<string | undefined>, type?: string) => {
  diagDialogTitle.value = title
  diagResult.value = '正在执行...'
  showDiagDialog.value = true
  currentDiagType.value = type || ''
  diagMode.value = 'chart'
  
  try {
    const result = await fn()
    if (result === undefined || result === null) {
      diagResult.value = '返回数据为空'
    } else if (result === '') {
      diagResult.value = '返回空字符串'
    } else {
      diagResult.value = result
      
      // 解析数据用于图表展示
      if (type === 'jvmInfo') {
        parseJvmData(result)
      } else if (type === 'memory') {
        parseMemoryData(result)
      } else if (type === 'gcStats') {
        parseGcData(result)
      } else if (type === 'threadsSummary') {
        parseThreadsData(result)
      }
    }
  } catch (e: any) {
    const errorMsg = e.response?.data || e.message || '未知错误'
    diagResult.value = `执行失败: ${JSON.stringify(errorMsg, null, 2)}`
  }
}

// 显示内存历史监控图表
const showMemoryHistoryChart = async (row: any, refresh = false) => {
  if (!refresh) {
    diagDialogTitle.value = `💾 内存监控 - ${row.app}@${row.inst}`
    diagResult.value = '正在加载历史数据...'
    showDiagDialog.value = true
    currentDiagType.value = 'memoryChart'
    diagMode.value = 'chart'
  }
  
  try {
    historyLoading.value = true
    const endTime = Date.now()
    const startTime = endTime - historyTimeRange.value * 3600 * 1000 // 根据选择的时间范围计算
    
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    
    if (data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 使用nextTick确保DOM更新后再渲染
    setTimeout(() => {
      console.log('准备渲染内存图表, memoryHistory长度:', memoryHistory.value.length)
      renderMemoryCharts()
    }, 500)
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    diagResult.value = `加载失败: ${e.message || '未知错误'}`
  } finally {
    historyLoading.value = false
  }
}

// 显示GC历史监控图表
const showGcHistoryChart = async (row: any, refresh = false) => {
  if (!refresh) {
    diagDialogTitle.value = `♻️ GC分析 - ${row.app}@${row.inst}`
    diagResult.value = '正在加载历史数据...'
    showDiagDialog.value = true
    currentDiagType.value = 'gcChart'
    diagMode.value = 'chart'
  }
  
  try {
    historyLoading.value = true
    const endTime = Date.now()
    const startTime = endTime - historyTimeRange.value * 3600 * 1000
    
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    
    if (data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 使用nextTick确保DOM更新后再渲染
    setTimeout(() => {
      console.log('准备渲染GC图表, memoryHistory长度:', memoryHistory.value.length)
      renderGcCharts()
    }, 500)
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    diagResult.value = `加载失败: ${e.message || '未知错误'}`
  } finally {
    historyLoading.value = false
  }
}

// 显示线程历史监控图表
const showThreadHistoryChart = async (row: any, refresh = false) => {
  if (!refresh) {
    diagDialogTitle.value = `🧵 线程监控 - ${row.app}@${row.inst}`
    diagResult.value = '正在加载历史数据...'
    showDiagDialog.value = true
    currentDiagType.value = 'threadChart'
    diagMode.value = 'chart'
  }
  
  try {
    historyLoading.value = true
    const endTime = Date.now()
    const startTime = endTime - historyTimeRange.value * 3600 * 1000
    
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    
    if (data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 使用nextTick确保DOM更新后再渲染
    setTimeout(() => {
      console.log('准备渲染线程图表, memoryHistory长度:', memoryHistory.value.length)
      renderThreadCharts()
    }, 500)
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    diagResult.value = `加载失败: ${e.message || '未知错误'}`
  } finally {
    historyLoading.value = false
  }
}

// 显示IO/网络历史监控图表
const showIoNetworkHistoryChart = async (row: any, refresh = false) => {
  if (!refresh) {
    diagDialogTitle.value = `🌐 IO/网络监控 - ${row.app}@${row.inst}`
    diagResult.value = '正在加载历史数据...'
    showDiagDialog.value = true
    currentDiagType.value = 'ioNetworkChart'
    diagMode.value = 'chart'
  }
  
  try {
    historyLoading.value = true
    const endTime = Date.now()
    const startTime = endTime - historyTimeRange.value * 3600 * 1000
    
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    
    if (data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 使用nextTick确保DOM更新后再渲染
    setTimeout(() => {
      console.log('准备渲染IO/网络图表, memoryHistory长度:', memoryHistory.value.length)
      renderThreadCharts() // 复用线程图表的渲染函数（包含磁盘I/O）
    }, 500)
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    diagResult.value = `加载失败: ${e.message || '未知错误'}`
  } finally {
    historyLoading.value = false
  }
}

// 刷新当前历史监控数据
const refreshHistoryChart = () => {
  if (!currentDiagRow.value) {
    ElMessage.warning('无法获取实例信息')
    return
  }
  
  switch (currentDiagType.value) {
    case 'memoryChart':
      showMemoryHistoryChart(currentDiagRow.value, true)
      break
    case 'gcChart':
      showGcHistoryChart(currentDiagRow.value, true)
      break
    case 'threadChart':
      showThreadHistoryChart(currentDiagRow.value, true)
      break
    case 'ioNetworkChart':
      showIoNetworkHistoryChart(currentDiagRow.value, true)
      break
    default:
      ElMessage.info('当前不是历史监控视图')
  }
}

// 渲染GC图表 - 只渲染GC相关图表
const renderGcCharts = () => {
  if (memoryHistory.value.length === 0) return
  
  const times = memoryHistory.value.map(m => {
    const date = new Date(m.collectTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  // 1. GC Count Chart
  if (gcCountChartRef.value) {
    if (!gcCountChartInstance) gcCountChartInstance = echarts.init(gcCountChartRef.value)
    
    const gcIncrements = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      return m.gcCount - memoryHistory.value[i - 1].gcCount
    })
    
    gcCountChartInstance.setOption({
      title: { text: 'GC次数增量', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params[0].name + '<br/>GC增量: ' + params[0].value + ' 次'
      }},
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '次数' },
      series: [{ name: 'GC增量', type: 'bar', data: gcIncrements, itemStyle: { color: '#9c27b0' } }]
    })
    gcCountChartInstance.resize()
  }
  
  // 2. GC Duration Chart
  if (gcDurationChartRef.value) {
    if (!gcDurationChartInstance) gcDurationChartInstance = echarts.init(gcDurationChartRef.value)
    
    const gcTimeIncrements = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      return m.gcTimeMs - memoryHistory.value[i - 1].gcTimeMs
    })
    
    gcDurationChartInstance.setOption({
      title: { text: 'GC耗时分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params[0].name + '<br/>GC耗时: ' + params[0].value + ' ms'
      }},
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '耗时(ms)' },
      series: [{ name: 'GC耗时', type: 'line', data: gcTimeIncrements, smooth: true, itemStyle: { color: '#ff6b6b' }, areaStyle: { color: 'rgba(255, 107, 107, 0.1)' } }]
    })
    gcDurationChartInstance.resize()
  }
  
  // 3. Minor vs Full GC Chart
  if (minorVsFullGcChartRef.value) {
    if (!minorVsFullGcChartInstance) minorVsFullGcChartInstance = echarts.init(minorVsFullGcChartRef.value)
    
    const minorGcData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      return (m.minorGcCount || 0) - (memoryHistory.value[i - 1].minorGcCount || 0)
    })
    const fullGcData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      return (m.fullGcCount || 0) - (memoryHistory.value[i - 1].fullGcCount || 0)
    })
    
    minorVsFullGcChartInstance.setOption({
      title: { text: 'Minor vs Full GC', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value} 次<br/>` })
        return result
      }},
      legend: { data: ['Minor GC', 'Full GC'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '次数' },
      series: [
        { name: 'Minor GC', type: 'bar', data: minorGcData, itemStyle: { color: '#409eff' } },
        { name: 'Full GC', type: 'bar', data: fullGcData, itemStyle: { color: '#f56c6c' } }
      ]
    })
    minorVsFullGcChartInstance.resize()
  }
  
  // 4. GC Efficiency Chart
  if (gcEfficiencyChartRef.value && memoryHistory.value[0].memoryPools) {
    if (!gcEfficiencyChartInstance) gcEfficiencyChartInstance = echarts.init(gcEfficiencyChartRef.value)
    
    const gcEfficiencyData: number[] = []
    memoryHistory.value.forEach((m, i) => {
      if (i === 0) {
        gcEfficiencyData.push(0)
        return
      }
      try {
        const pools: any[] = JSON.parse(m.memoryPools!)
        const prevPools: any[] = JSON.parse(memoryHistory.value[i - 1].memoryPools!)
        const eden = pools.find(p => p.name.includes('Eden'))
        const prevEden = prevPools.find(p => p.name.includes('Eden'))
        if (eden && prevEden && eden.used !== undefined && prevEden.used !== undefined) {
          const reclaimed = prevEden.used - eden.used
          // 只记录有效数据(>=0)
          gcEfficiencyData.push(reclaimed >= 0 ? reclaimed : 0)
        } else {
          gcEfficiencyData.push(0)
        }
      } catch (e) {
        console.warn('Failed to calculate GC efficiency:', e)
        gcEfficiencyData.push(0)
      }
    })
    
    gcEfficiencyChartInstance.setOption({
      title: { text: 'GC回收效率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis', 
        formatter: (params: any) => {
          const value = params[0].value
          if (value === undefined || value === null || isNaN(value)) {
            return params[0].name + '<br/>数据无效'
          }
          return params[0].name + '<br/>回收内存: ' + formatBytes(value)
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { 
        type: 'value', 
        axisLabel: { 
          formatter: (val: number) => {
            if (isNaN(val) || val === undefined) return '0 B'
            return formatBytes(val)
          }
        }
      },
      series: [{ 
        name: '回收内存', 
        type: 'line', 
        data: gcEfficiencyData.map(v => isNaN(v) ? 0 : v), // 确保没有NaN
        smooth: true, 
        itemStyle: { color: '#67c23a' }, 
        areaStyle: { color: 'rgba(103, 194, 58, 0.1)' }
      }]
    })
    gcEfficiencyChartInstance.resize()
  }
}

// 渲染线程图表 - 只渲染线程相关图表
const renderThreadCharts = () => {
  if (memoryHistory.value.length === 0) return
  
  const times = memoryHistory.value.map(m => {
    const date = new Date(m.collectTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  // 1. Thread Count Chart
  if (threadChartRef.value) {
    if (!threadChartInstance) threadChartInstance = echarts.init(threadChartRef.value)
    threadChartInstance.setOption({
      title: { text: '线程数趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['当前线程'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '线程数' },
      series: [
        { name: '当前线程', type: 'line', data: memoryHistory.value.map(m => m.threadCount), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }
      ]
    })
    threadChartInstance.resize()
  }
  
  // 2. Class Loading Chart
  if (classLoadingChartRef.value) {
    if (!classLoadingChartInstance) classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
    classLoadingChartInstance.setOption({
      title: { text: '类加载统计', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['已加载类'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '类数量' },
      series: [{ name: '已加载类', type: 'line', data: memoryHistory.value.map(m => m.loadedClassCount), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }]
    })
    classLoadingChartInstance.resize()
  }
  
  // 3. Thread States Chart (如果有数据)
  if (threadStatesChartRef.value && memoryHistory.value[0].threadStates) {
    if (!threadStatesChartInstance) threadStatesChartInstance = echarts.init(threadStatesChartRef.value)
    
    try {
      const threadStatesData: any[] = []
      memoryHistory.value.forEach(m => {
        try {
          const states = JSON.parse(m.threadStates!)
          threadStatesData.push(states)
        } catch (e) {
          threadStatesData.push(null)
        }
      })
      
      // 提取各个状态的数组
      const runnables = threadStatesData.map(s => s?.RUNNABLE || 0)
      const waitings = threadStatesData.map(s => s?.WAITING || 0)
      const timedWaitings = threadStatesData.map(s => s?.TIMED_WAITING || 0)
      const blockeds = threadStatesData.map(s => s?.BLOCKED || 0)
      
      threadStatesChartInstance.setOption({
        title: { text: '线程状态分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['RUNNABLE', 'WAITING', 'TIMED_WAITING', 'BLOCKED'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '线程数' },
        series: [
          { name: 'RUNNABLE', type: 'line', stack: 'total', data: runnables, areaStyle: {}, itemStyle: { color: '#67c23a' } },
          { name: 'WAITING', type: 'line', stack: 'total', data: waitings, areaStyle: {}, itemStyle: { color: '#e6a23c' } },
          { name: 'TIMED_WAITING', type: 'line', stack: 'total', data: timedWaitings, areaStyle: {}, itemStyle: { color: '#409eff' } },
          { name: 'BLOCKED', type: 'line', stack: 'total', data: blockeds, areaStyle: {}, itemStyle: { color: '#f56c6c' } }
        ]
      })
      threadStatesChartInstance.resize()
    } catch (e) {
      console.warn('Failed to render thread states chart:', e)
    }
  }
  
  // 4. Class Loading Rate Chart - 显示类加载速率
  if (classLoadingDetailChartRef.value) {
    if (!classLoadingDetailChartInstance) classLoadingDetailChartInstance = echarts.init(classLoadingDetailChartRef.value)
    
    // 检查是否有 classLoadingRate 数据
    const hasRateData = memoryHistory.value.length > 0 && memoryHistory.value[0].classLoadingRate !== undefined
    
    if (!hasRateData || memoryHistory.value.length === 0) {
      // 无数据时显示空状态
      classLoadingDetailChartInstance.setOption({
        title: { text: '类加载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无类加载数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      classLoadingDetailChartInstance.resize()
    } else if (hasRateData) {
      // 使用 classLoadingRate 字段
      const rates = memoryHistory.value.map(m => m.classLoadingRate || 0)
      const allZero = rates.every(r => r === 0)
      
      if (allZero) {
        // 所有数据都是 0，显示空状态
        classLoadingDetailChartInstance.setOption({
          title: { text: '类加载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '无类加载活动\n所有类已加载完成，无新增或卸载',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        // 有数据，正常显示
        classLoadingDetailChartInstance.setOption({
          title: { text: '类加载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { 
            trigger: 'axis', 
            formatter: (params: any) => {
              return params[0].name + '<br/>加载速率: ' + params[0].value.toFixed(2) + ' 类/秒'
            }
          },
          grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', name: '类/秒' },
          series: [{ 
            name: '加载速率', 
            type: 'line', 
            data: rates, 
            smooth: true, 
            itemStyle: { color: '#9c27b0' },
            areaStyle: { color: 'rgba(156, 39, 176, 0.1)' }
          }]
        })
      }
      classLoadingDetailChartInstance.resize()
    } else {
      // 降级：使用 loadedClassCount 的差值
      const loadedRates = memoryHistory.value.map((m, i) => {
        if (i === 0) return 0
        return Math.max(0, m.loadedClassCount - memoryHistory.value[i - 1].loadedClassCount)
      })
      const allZero = loadedRates.every(r => r === 0)
      
      if (allZero) {
        // 所有数据都是 0，显示空状态
        classLoadingDetailChartInstance.setOption({
          title: { text: '类加载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '无类加载活动\n所有类已加载完成，无新增或卸载',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        // 有数据，正常显示
        classLoadingDetailChartInstance.setOption({
          title: { text: '类加载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { trigger: 'axis', formatter: (params: any) => {
            return params[0].name + '<br/>新增类: ' + params[0].value
          }},
          grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', name: '类数量' },
          series: [{ name: '新增类', type: 'bar', data: loadedRates, itemStyle: { color: '#9c27b0' } }]
        })
      }
      classLoadingDetailChartInstance.resize()
    }
  }
  
  // 5. Thread Pools Chart - 始终渲染，无数据时显示默认图表
  if (threadPoolsChartRef.value) {
    if (!threadPoolsChartInstance) threadPoolsChartInstance = echarts.init(threadPoolsChartRef.value)
    
    const hasData = memoryHistory.value.length > 0 && memoryHistory.value[0].threadPools
    
    if (!hasData) {
      threadPoolsChartInstance.setOption({
        title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无线程池数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      threadPoolsChartInstance.resize()
    } else {
      try {
        const latest = memoryHistory.value[memoryHistory.value.length - 1]
        const pools: any[] = JSON.parse(latest.threadPools!)
        
        if (!pools || pools.length === 0) {
          threadPoolsChartInstance.setOption({
            title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
            graphic: {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: '该 Agent 未上报线程池数据\n可能原因：JVM 版本不支持或配置未开启',
                fill: '#c0c4cc',
                fontSize: 14,
                textAlign: 'center'
              }
            }
          })
          threadPoolsChartInstance.resize()
        } else {
          const poolNames = pools.map(p => p.poolName)
          const poolCounts = pools.map(p => p.activeCount)
          
          threadPoolsChartInstance.setOption({
            title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
            xAxis: { type: 'category', data: poolNames, axisLabel: { interval: 0, rotate: 30 } },
            yAxis: { type: 'value', name: '线程数' },
            series: [{
              name: '活跃线程',
              type: 'bar',
              data: poolCounts,
              itemStyle: { color: '#409eff' },
              label: { show: true, position: 'top' }
            }]
          })
          threadPoolsChartInstance.resize()
        }
      } catch (e) {
        console.error('Failed to parse threadPools:', e)
        threadPoolsChartInstance.setOption({
          title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '解析线程池数据失败',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
        threadPoolsChartInstance.resize()
      }
    }
  }
  
  // 6. CPU Usage Chart - 始终渲染，无数据时显示默认图表
  if (cpuChartRef.value) {
    if (!cpuChartInstance) cpuChartInstance = echarts.init(cpuChartRef.value)
    
    const hasData = memoryHistory.value.length > 0 && (memoryHistory.value[0].processCpuLoad !== undefined || memoryHistory.value[0].systemCpuLoad !== undefined)
    
    if (!hasData) {
      cpuChartInstance.setOption({
        title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无CPU数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      cpuChartInstance.resize()
    } else {
      cpuChartInstance.setOption({
        title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(2)}%<br/>` })
          return result
        }},
        legend: { data: ['进程CPU', '系统CPU'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: 'CPU%', axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' } },
        series: [
          { name: '进程CPU', type: 'line', data: memoryHistory.value.map(m => m.processCpuLoad || 0), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
          { name: '系统CPU', type: 'line', data: memoryHistory.value.map(m => m.systemCpuLoad || 0), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
        ]
      })
      cpuChartInstance.resize()
    }
  }
}

const formatTimestamp = (ts: number) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 构建完整的 agentId
// 解析 JVM 数据
const parseJvmData = (text: string) => {
  try {
    const lines = text.split('\n')
    const data: any = {}
    let currentSection = ''
    
    lines.forEach(line => {
      // Detect section headers
      if (line.startsWith('=== ')) {
        currentSection = line.match(/=== (.+?) ===/)?.[1] || ''
        return
      }
      
      const trimmedLine = line.trim()
      if (!trimmedLine) return
      
      // Parse key-value pairs
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex === -1) return
      
      const key = trimmedLine.substring(0, colonIndex).trim()
      const value = trimmedLine.substring(colonIndex + 1).trim()
      
      // Runtime Information
      if (key === 'PID') data.pid = value
      else if (key === 'UptimeMs') data.uptimeMs = parseInt(value) || 0
      else if (key === 'StartTimeMs') data.startTimeMs = parseInt(value) || 0
      else if (key === 'VmName') data.vmName = value
      else if (key === 'VmVersion') data.vmVersion = value
      
      // Memory Information (indented keys)
      else if (currentSection === 'Memory Information') {
        if (key === 'used' && !data.heapUsedParsed) {
          data.heapUsed = parseBytes(value)
          data.heapUsedParsed = true
        } else if (key === 'max' && !data.heapMaxParsed) {
          data.heapMax = parseBytes(value)
          data.heapMaxParsed = true
        } else if (key === 'used' && data.heapUsedParsed) {
          data.nonHeapUsed = parseBytes(value)
        } else if (key === 'max' && data.heapMaxParsed) {
          data.nonHeapMax = parseBytes(value)
        }
      }
      
      // Thread Information
      else if (currentSection === 'Thread Information') {
        if (key === 'ThreadCount') data.threadCount = parseInt(value) || 0
        else if (key === 'PeakThreadCount') data.peakThreadCount = parseInt(value) || 0
        else if (key === 'DaemonThreadCount') data.daemonThreadCount = parseInt(value) || 0
        else if (key === 'TotalStartedThreadCount') data.totalStartedThreadCount = parseInt(value) || 0
      }
      
      // Class Loading Information
      else if (currentSection === 'Class Loading Information') {
        if (key === 'LoadedClassCount') data.loadedClassCount = parseInt(value) || 0
        else if (key === 'TotalLoadedClassCount') data.totalLoadedClassCount = parseInt(value) || 0
        else if (key === 'UnloadedClassCount') data.unloadedClassCount = parseInt(value) || 0
      }
      
      // Operating System Information
      else if (currentSection === 'Operating System Information') {
        if (key === 'OS Name') data.osName = value
        else if (key === 'OS Version') data.osVersion = value
        else if (key === 'Available Processors') data.availableProcessors = parseInt(value) || 0
        else if (key === 'System Load Average') data.systemLoadAverage = parseFloat(value) || 0
        else if (key === 'Total Physical Memory') data.totalPhysicalMemory = parseBytes(value)
        else if (key === 'Free Physical Memory') data.freePhysicalMemory = parseBytes(value)
        else if (key === 'Process CPU Load') data.processCpuLoad = parseFloat(value.replace('%', '')) || 0
        else if (key === 'System CPU Load') data.systemCpuLoad = parseFloat(value.replace('%', '')) || 0
      }
      
      // Garbage Collection Summary
      else if (currentSection === 'Garbage Collection Summary') {
        if (key === 'Total GC Count') data.totalGcCount = parseInt(value) || 0
        else if (key === 'Total GC Time') data.totalGcTime = parseDuration(value)
      }
    })
    
    jvmData.value = {
      pid: data.pid || '',
      uptimeMs: data.uptimeMs || 0,
      startTimeMs: data.startTimeMs || 0,
      vmName: data.vmName || '',
      vmVersion: data.vmVersion || '',
      heapUsed: data.heapUsed || 0,
      heapMax: data.heapMax || 0,
      heapPercent: data.heapMax ? Math.round((data.heapUsed / data.heapMax) * 100) : 0,
      nonHeapUsed: data.nonHeapUsed || 0,
      nonHeapMax: data.nonHeapMax || 0,
      nonHeapPercent: data.nonHeapMax ? Math.round((data.nonHeapUsed / data.nonHeapMax) * 100) : 0,
      threadCount: data.threadCount || 0,
      peakThreadCount: data.peakThreadCount || 0,
      daemonThreadCount: data.daemonThreadCount || 0,
      totalStartedThreadCount: data.totalStartedThreadCount || 0,
      loadedClassCount: data.loadedClassCount || 0,
      totalLoadedClassCount: data.totalLoadedClassCount || 0,
      unloadedClassCount: data.unloadedClassCount || 0,
      osName: data.osName || '',
      osVersion: data.osVersion || '',
      availableProcessors: data.availableProcessors || 0,
      systemLoadAverage: data.systemLoadAverage || 0,
      totalPhysicalMemory: data.totalPhysicalMemory || 0,
      freePhysicalMemory: data.freePhysicalMemory || 0,
      processCpuLoad: data.processCpuLoad || 0,
      systemCpuLoad: data.systemCpuLoad || 0,
      totalGcCount: data.totalGcCount || 0,
      totalGcTime: data.totalGcTime || 0
    }
  } catch (e) {
    console.error('Failed to parse JVM data:', e)
  }
}

// 解析字节字符串（如 "256.00 MB"）为数字
const parseBytes = (text: string): number => {
  if (!text || text === 'N/A') return 0
  const match = text.match(/([\d.]+)\s*(B|KB|MB|GB)/i)
  if (!match) return 0
  const value = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  switch (unit) {
    case 'B': return value
    case 'KB': return value * 1024
    case 'MB': return value * 1024 * 1024
    case 'GB': return value * 1024 * 1024 * 1024
    default: return value
  }
}

// 解析时间字符串（如 "2 min 30 s"）为毫秒
const parseDuration = (text: string): number => {
  if (!text || text === 'N/A') return 0
  if (text.includes('ms')) {
    return parseInt(text) || 0
  }
  if (text.includes('min')) {
    const match = text.match(/(\d+)\s*min\s*(\d+)?\s*s?/)
    if (match) {
      const minutes = parseInt(match[1]) || 0
      const seconds = parseInt(match[2]) || 0
      return (minutes * 60 + seconds) * 1000
    }
  }
  if (text.includes('h')) {
    const match = text.match(/(\d+)\s*h\s*(\d+)?\s*min?/)
    if (match) {
      const hours = parseInt(match[1]) || 0
      const minutes = parseInt(match[2]) || 0
      return (hours * 3600 + minutes * 60) * 1000
    }
  }
  if (text.includes('s')) {
    return parseFloat(text) * 1000 || 0
  }
  return parseInt(text) || 0
}

// 解析内存数据
const parseMemoryData = (text: string) => {
  try {
    const lines = text.split('\n')
    const pools: any[] = []
    const bufferPools: any[] = []
    let heapUsed = 0, heapCommitted = 0, heapMax = 0
    let nonHeapUsed = 0, nonHeapCommitted = 0, nonHeapMax = 0
    let currentSection = ''
    let currentPool: any = null
    let currentBufferPool: any = null
    
    lines.forEach(line => {
      // Detect section headers
      if (line.startsWith('=== ')) {
        currentSection = line.match(/=== (.+?) ===/)?.[1] || ''
        return
      }
      
      const trimmedLine = line.trim()
      if (!trimmedLine) {
        // Save current pool/buffer pool when encountering empty line
        if (currentPool) {
          if (currentPool.max > 0) {
            currentPool.percent = Math.round((currentPool.used / currentPool.max) * 100)
          } else {
            currentPool.percent = 0
          }
          pools.push(currentPool)
          currentPool = null
        }
        if (currentBufferPool) {
          bufferPools.push(currentBufferPool)
          currentBufferPool = null
        }
        return
      }
      
      // Parse key-value pairs with indentation
      const colonIndex = trimmedLine.indexOf(':')
      if (colonIndex === -1) return
      
      const key = trimmedLine.substring(0, colonIndex).trim()
      const value = trimmedLine.substring(colonIndex + 1).trim()
      
      // Memory Overview - Heap
      if (currentSection === 'Memory Overview') {
        if (key === 'Heap') {
          // Next lines will be heap details
        } else if (key === 'Non-Heap') {
          // Next lines will be non-heap details
        } else if (key === 'Used' && !heapUsed) {
          heapUsed = parseBytes(value)
        } else if (key === 'Committed' && !heapCommitted) {
          heapCommitted = parseBytes(value)
        } else if (key === 'Max' && !heapMax) {
          heapMax = parseBytes(value)
        } else if (key === 'Usage' && heapMax) {
          // Already calculated from bytes
        }
        
        // Non-Heap parsing
        if (key === 'Used' && heapUsed && !nonHeapUsed) {
          nonHeapUsed = parseBytes(value)
        } else if (key === 'Committed' && heapCommitted && !nonHeapCommitted) {
          nonHeapCommitted = parseBytes(value)
        } else if (key === 'Max' && heapMax && !nonHeapMax) {
          nonHeapMax = parseBytes(value)
        }
      }
      
      // Memory Pools Detail
      else if (currentSection === 'Memory Pools Detail') {
        if (key === 'Pool') {
          // Start new pool
          if (currentPool) {
            if (currentPool.max > 0) {
              currentPool.percent = Math.round((currentPool.used / currentPool.max) * 100)
            } else {
              currentPool.percent = 0
            }
            pools.push(currentPool)
          }
          currentPool = { name: value, type: '', used: 0, committed: 0, max: 0, init: 0, percent: 0 }
        } else if (currentPool) {
          if (key === 'Type') currentPool.type = value
          else if (key === 'Used') currentPool.used = parseBytes(value)
          else if (key === 'Committed') currentPool.committed = parseBytes(value)
          else if (key === 'Max') currentPool.max = parseBytes(value)
          else if (key === 'Init') currentPool.init = parseBytes(value)
          else if (key === 'Collection Used') currentPool.collectionUsed = parseBytes(value)
          else if (key === 'Collection Committed') currentPool.collectionCommitted = parseBytes(value)
          else if (key === 'Collection Max') currentPool.collectionMax = parseBytes(value)
          else if (key === 'Peak Used') currentPool.peakUsed = parseBytes(value)
          else if (key === 'Peak Committed') currentPool.peakCommitted = parseBytes(value)
        }
      }
      
      // Buffer Pools
      else if (currentSection === 'Buffer Pools') {
        if (key === 'Buffer Pool') {
          if (currentBufferPool) {
            bufferPools.push(currentBufferPool)
          }
          currentBufferPool = { name: value, count: 0, memoryUsed: 0, totalCapacity: 0 }
        } else if (currentBufferPool) {
          if (key === 'Count') currentBufferPool.count = parseInt(value) || 0
          else if (key === 'Memory Used') currentBufferPool.memoryUsed = parseBytes(value)
          else if (key === 'Total Capacity') currentBufferPool.totalCapacity = parseBytes(value)
        }
      }
    })
    
    // Don't forget the last pool/buffer pool
    if (currentPool) {
      if (currentPool.max > 0) {
        currentPool.percent = Math.round((currentPool.used / currentPool.max) * 100)
      } else {
        currentPool.percent = 0
      }
      pools.push(currentPool)
    }
    if (currentBufferPool) {
      bufferPools.push(currentBufferPool)
    }
    
    memoryData.value = {
      heapUsed,
      heapCommitted,
      heapMax,
      heapPercent: heapMax ? Math.round((heapUsed / heapMax) * 100) : 0,
      nonHeapUsed,
      nonHeapCommitted,
      nonHeapMax,
      nonHeapPercent: nonHeapMax ? Math.round((nonHeapUsed / nonHeapMax) * 100) : 0,
      pools,
      bufferPools
    }
  } catch (e) {
    console.error('Failed to parse memory data:', e)
  }
}

// 解析 GC 数据
const parseGcData = (text: string) => {
  try {
    const lines = text.split('\n')
    const collectors: any[] = []
    
    lines.forEach(line => {
      if (line.startsWith('GC:')) {
        const match = line.match(/GC: (.+?) count=(\d+) timeMs=(\d+)(?: pools=(.+))?/)
        if (match) {
          collectors.push({
            name: match[1],
            count: parseInt(match[2]),
            timeMs: parseInt(match[3]),
            pools: match[4] || '-'
          })
        }
      }
    })
    
    gcData.value = { collectors }
  } catch (e) {
    console.error('Failed to parse GC data:', e)
  }
}

// 解析线程数据
const parseThreadsData = (text: string) => {
  try {
    const lines = text.split('\n')
    const data: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('ThreadCount:')) {
        data.threadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('DaemonThreadCount:')) {
        data.daemonThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('PeakThreadCount:')) {
        data.peakThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('TotalStartedThreadCount:')) {
        data.totalStartedThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      }
    })
    
    threadsData.value = {
      threadCount: data.threadCount || 0,
      daemonThreadCount: data.daemonThreadCount || 0,
      peakThreadCount: data.peakThreadCount || 0,
      totalStartedThreadCount: data.totalStartedThreadCount || 0
    }
  } catch (e) {
    console.error('Failed to parse threads data:', e)
  }
}

const submitConfig = async () => {
  submitting.value = true
  try {
    // 使用当前 Tab 的配置内容
    const configToSubmit = configSourceTab.value === 'database' ? dbConfigContent.value : agentRuntimeConfig.value
    
    if (configMode.value === 'app') {
      await updateAgentConfig({
        app: currentApp.value,
        config: configToSubmit
      })
    } else {
      await updateAgentInstanceConfig({
        app: currentApp.value,
        inst: currentInst.value,
        config: configToSubmit
      })
    }
    ElMessage.success('配置更新成功')
    showConfigDialog.value = false
    loadInstances()
  } catch (e: any) {
    ElMessage.error(e.message || '配置更新失败')
  } finally {
    submitting.value = false
  }
}

// 从运行时配置同步到编辑区
const syncFromRuntime = () => {
  if (agentRuntimeConfig.value) {
    dbConfigContent.value = agentRuntimeConfig.value
    configSourceTab.value = 'database'
    ElMessage.success('已从运行时配置同步')
  }
}

const copyDiagResult = async () => {
  try {
    await navigator.clipboard.writeText(diagResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e: any) {
    ElMessage.error('复制失败')
  }
}

// 切换模式
const switchToTextMode = () => {
  diagMode.value = 'text'
}

const switchToChartMode = () => {
  if (canShowChart.value) {
    diagMode.value = 'chart'
  }
}

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (ms: number): string => {
  if (ms < 1000) return ms + ' ms'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return seconds + ' s'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + ' min'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + ' h ' + (minutes % 60) + ' min'
  const days = Math.floor(hours / 24)
  return days + ' d ' + (hours % 24) + ' h'
}

// 获取进度条颜色
const getProgressColor = (percent: number): string => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

// 获取使用率级别
const getUsageLevel = (percent: number): string => {
  if (percent < 60) return 'success'
  if (percent < 80) return 'warning'
  return 'danger'
}

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

// 加载内存历史数据
const loadMemoryHistory = async () => {
  console.log('loadMemoryHistory called', {
    currentApp: currentApp.value,
    currentInst: currentInst.value,
    historyTimeRange: historyTimeRange.value
  })
  
  // 如果没有设置实例，尝试从 instances 列表中获取
  let app = currentApp.value
  let inst = currentInst.value
  
  if (!app || !inst) {
    // 尝试从 instances 中找到第一个在线的实例
    const onlineInst = instances.value.find(i => i.online && i.app === (app || 'order'))
    if (onlineInst) {
      app = onlineInst.app
      inst = onlineInst.inst
      console.log('Using instance from list:', { app, inst })
    } else {
      console.warn('No valid app or inst found')
      ElMessage.warning('请先从运行实例列表打开诊断，或确保有在线的实例')
      return
    }
  }
  
  historyLoading.value = true
  try {
    const endTime = Date.now()
    const startTime = endTime - (historyTimeRange.value * 3600 * 1000)
    
    console.log('Fetching memory history with params:', { app, inst, startTime, endTime })
    
    memoryHistory.value = await getMemoryHistory(
      app,
      inst,
      startTime,
      endTime,
      200
    )
    
    console.log('Received history data:', memoryHistory.value.length, 'records')
    
    // Parse memory pools from first record
    if (memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      try {
        const pools: any[] = JSON.parse(memoryHistory.value[0].memoryPools)
        // Select heap-type pools to display
        selectedPools.value = pools
          .filter(p => p.type === 'HEAP')
          .map(p => ({ name: p.name, type: p.type }))
        console.log('Selected pools:', selectedPools.value)
      } catch (e) {
        console.error('Failed to parse memory pools:', e)
      }
    }
    
    // 按时间排序（升序）
    memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
    
    // 渲染图表 - 使用更长的延迟确保DOM完全渲染
    setTimeout(() => {
      console.log('=== Rendering charts ===')
      console.log('heapChartRef:', heapChartRef.value?.offsetWidth, heapChartRef.value?.offsetHeight)
      console.log('nonHeapChartRef:', nonHeapChartRef.value?.offsetWidth, nonHeapChartRef.value?.offsetHeight)
      console.log('youngGenChartRef:', youngGenChartRef.value?.offsetWidth, youngGenChartRef.value?.offsetHeight)
      console.log('oldGenChartRef:', oldGenChartRef.value?.offsetWidth, oldGenChartRef.value?.offsetHeight)
      console.log('gcCountChartRef:', gcCountChartRef.value?.offsetWidth, gcCountChartRef.value?.offsetHeight)
      console.log('gcDurationChartRef:', gcDurationChartRef.value?.offsetWidth, gcDurationChartRef.value?.offsetHeight)
      console.log('threadChartRef:', threadChartRef.value?.offsetWidth, threadChartRef.value?.offsetHeight)
      console.log('classLoadingChartRef:', classLoadingChartRef.value?.offsetWidth, classLoadingChartRef.value?.offsetHeight)
      console.log('cpuChartRef:', cpuChartRef.value?.offsetWidth, cpuChartRef.value?.offsetHeight)
      renderMemoryCharts()
      console.log('=== Charts rendered ===')
    }, 500)
    
    ElMessage.success(`加载了 ${memoryHistory.value.length} 条历史记录`)
  } catch (e: any) {
    console.error('Failed to load memory history:', e)
    ElMessage.error(e.message || '加载历史数据失败')
  } finally {
    historyLoading.value = false
    console.log('loadMemoryHistory finished')
  }
}

// Phase 1: 加载最新数据（用于实时监控）
const loadLatestMetrics = async () => {
  let app = currentApp.value
  let inst = currentInst.value
  
  if (!app || !inst) {
    const onlineInst = instances.value.find(i => i.online && i.app === (app || 'order'))
    if (onlineInst) {
      app = onlineInst.app
      inst = onlineInst.inst
    } else {
      return
    }
  }
  
  try {
    // 只查询最近1分钟的10条记录
    const endTime = Date.now()
    const startTime = endTime - 60000
    
    const newData = await getMemoryHistory(app, inst, startTime, endTime, 10)
    
    if (newData.length > 0) {
      // 追加新数据到现有列表（去重）
      const existingTimes = new Set(memoryHistory.value.map(m => m.collectTime))
      
      newData.forEach(metric => {
        if (!existingTimes.has(metric.collectTime)) {
          memoryHistory.value.push(metric)
        }
      })
      
      // 保持最多200条记录
      if (memoryHistory.value.length > 200) {
        memoryHistory.value = memoryHistory.value.slice(-200)
      }
      
      // 重新排序
      memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
      
      // 增量更新图表
      renderMemoryCharts()
    }
  } catch (e: any) {
    console.error('Failed to load latest metrics:', e)
  }
}

// Phase 1: 切换实时监控
const toggleRealtime = (enabled: boolean) => {
  if (enabled) {
    // 启动实时监控
    ElMessage.info(`已开启实时监控，轮询间隔：${pollingInterval.value / 1000}秒`)
    
    // 立即加载一次最新数据
    loadLatestMetrics()
    
    // 启动定时器
    realtimeTimer = setInterval(() => {
      loadLatestMetrics()
    }, pollingInterval.value)
  } else {
    // 停止实时监控
    if (realtimeTimer) {
      clearInterval(realtimeTimer)
      realtimeTimer = null
    }
    ElMessage.info('已关闭实时监控')
  }
}

// Phase 2: 监听轮询间隔变化，自动重启定时器
watch(pollingInterval, (newInterval) => {
  if (enableRealtime.value && realtimeTimer) {
    // 重启定时器以应用新的间隔
    clearInterval(realtimeTimer)
    realtimeTimer = setInterval(() => {
      loadLatestMetrics()
    }, newInterval)
    
    ElMessage.success(`轮询间隔已更新为 ${newInterval / 1000}秒`)
  }
})

// 切换自动刷新
const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
    ElMessage.success(`自动刷新已开启 (${autoRefreshInterval.value}秒)`)
  } else {
    stopAutoRefresh()
    ElMessage.info('自动刷新已关闭')
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先停止之前的定时器
  autoRefreshTimer = window.setInterval(() => {
    refreshHistoryChart()
  }, autoRefreshInterval.value * 1000)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

// 监听自动刷新间隔变化
watch(autoRefreshInterval, (newInterval) => {
  if (enableAutoRefresh.value) {
    startAutoRefresh() // 重启定时器以应用新的间隔
    ElMessage.success(`自动刷新间隔已更新为 ${newInterval}秒`)
  }
})

// 渲染内存趋势图表
const renderMemoryCharts = () => {
  console.log('🔴 renderMemoryCharts called')
  console.log('🔴 memoryHistory length:', memoryHistory.value.length)
  
  // 渲染内存池图表（无论有无数据都要渲染，显示默认图表）
  console.log('🔴 准备调用 renderMemoryPoolsGrid')
  renderMemoryPoolsGrid()
  
  console.log('🔴 Starting to render memory charts...')
  
  const times = memoryHistory.value.map(m => {
    const date = new Date(m.collectTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })
  
  // Phase 2: 判断是否为增量更新（实时监控模式）
  const isIncrementalUpdate = enableRealtime.value && heapChartInstance !== null
  
  // Phase 2: 配置项 - 启用平滑动画
  const animationConfig = isIncrementalUpdate ? {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  } : {
    animation: false // 首次加载时禁用动画，加快速度
  }
  
  // 1. Heap Memory Chart
  if (heapChartRef.value) {
    if (!heapChartInstance) {
      heapChartInstance = echarts.init(heapChartRef.value)
    }
    const heapData = memoryHistory.value.map(m => m.heapUsed)
    const heapCommittedData = memoryHistory.value.map(m => m.heapCommitted)
    const heapMaxData = memoryHistory.value.map(m => m.heapMax)
    
    heapChartInstance.setOption({
      title: { text: '堆内存总览', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
        return result
      }},
      legend: { data: ['已使用', '已提交', '最大值'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: '已使用', type: 'line', data: heapData, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
        { name: '已提交', type: 'line', data: heapCommittedData, smooth: true, lineStyle: { type: 'dotted' }, itemStyle: { color: '#67c23a' } },
        { name: '最大值', type: 'line', data: heapMaxData, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
      ],
      ...animationConfig // Phase 2: 应用动画配置
    })
    heapChartInstance.resize()
  }
  
  // 2. Non-Heap Memory Chart
  if (nonHeapChartRef.value) {
    if (!nonHeapChartInstance) nonHeapChartInstance = echarts.init(nonHeapChartRef.value)
    nonHeapChartInstance.setOption({
      title: { text: '非堆内存', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
        return result
      }},
      legend: { data: ['已使用', '已提交', '最大值'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: '已使用', type: 'line', data: memoryHistory.value.map(m => m.nonHeapUsed), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } },
        { name: '已提交', type: 'line', data: memoryHistory.value.map(m => m.nonHeapCommitted), smooth: true, lineStyle: { type: 'dotted' }, itemStyle: { color: '#67c23a' } },
        { name: '最大值', type: 'line', data: memoryHistory.value.map(m => m.nonHeapMax > 0 ? m.nonHeapMax : m.nonHeapCommitted), smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
      ]
    })
    nonHeapChartInstance.resize()
  }
  
  // 3. Young Generation Stacked Chart (Eden + S0 + S1)
  if (youngGenChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
    if (!youngGenChartInstance) youngGenChartInstance = echarts.init(youngGenChartRef.value)
    
    const edenData: number[] = []
    const s0Data: number[] = []
    const s1Data: number[] = []
    
    memoryHistory.value.forEach(record => {
      try {
        const pools: any[] = JSON.parse(record.memoryPools!)
        const eden = pools.find(p => p.name.includes('Eden'))
        const s0 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S0'))
        const s1 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S1'))
        edenData.push(eden ? eden.used : 0)
        s0Data.push(s0 ? s0.used : 0)
        s1Data.push(s1 ? s1.used : 0)
      } catch (e) {
        edenData.push(0)
        s0Data.push(0)
        s1Data.push(0)
      }
    })
    
    youngGenChartInstance.setOption({
      title: { text: '新生代 (Young Gen)', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>总计: ' + formatBytes(params.reduce((sum: number, p: any) => sum + p.value, 0)) + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
        return result
      }},
      legend: { data: ['Eden', 'Survivor 0', 'Survivor 1'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: 'Eden', type: 'bar', stack: 'young', data: edenData, itemStyle: { color: '#409eff' } },
        { name: 'Survivor 0', type: 'bar', stack: 'young', data: s0Data, itemStyle: { color: '#67c23a' } },
        { name: 'Survivor 1', type: 'bar', stack: 'young', data: s1Data, itemStyle: { color: '#e6a23c' } }
      ]
    })
    youngGenChartInstance.resize()
  }
  
  // 4. Old Generation Chart
  if (oldGenChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
    if (!oldGenChartInstance) oldGenChartInstance = echarts.init(oldGenChartRef.value)
    
    const oldGenData: number[] = []
    const oldGenMax: number[] = []
    
    memoryHistory.value.forEach(record => {
      try {
        const pools: any[] = JSON.parse(record.memoryPools!)
        const old = pools.find(p => p.name.includes('Old') || p.name.includes('Tenured'))
        oldGenData.push(old ? old.used : 0)
        oldGenMax.push(old ? (old.max > 0 ? old.max : old.committed) : 0)
      } catch (e) {
        oldGenData.push(0)
        oldGenMax.push(0)
      }
    })
    
    oldGenChartInstance.setOption({
      title: { text: '老年代 (Old Gen)', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
        const usage = params.find((p: any) => p.seriesName === '已使用')
        const max = params.find((p: any) => p.seriesName === '最大值')
        if (usage && max && max.value > 0) {
          result += `使用率: ${((usage.value / max.value) * 100).toFixed(1)}%`
        }
        return result
      }},
      legend: { data: ['已使用', '最大值'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
        { name: '最大值', type: 'line', data: oldGenMax, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
      ]
    })
    oldGenChartInstance.resize()
  }
  
  // 5. GC Count Chart
  if (gcCountChartRef.value) {
    if (!gcCountChartInstance) gcCountChartInstance = echarts.init(gcCountChartRef.value)

    const gcIncrements = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const increment = m.gcCount - memoryHistory.value[i - 1].gcCount
      return increment >= 0 ? increment : 0 // 确保不会出现负值
    })

    gcCountChartInstance.setOption({
      title: { text: 'GC次数增量', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params[0].name + '<br/>GC增量: ' + params[0].value + ' 次'
      }},
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '次数' },
      series: [{ name: 'GC增量', type: 'bar', data: gcIncrements, itemStyle: { color: '#9c27b0' } }]
    })
    gcCountChartInstance.resize()
  }

  // 6. GC Duration Chart
  if (gcDurationChartRef.value) {
    if (!gcDurationChartInstance) gcDurationChartInstance = echarts.init(gcDurationChartRef.value)

    const gcTimeIncrements = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const increment = m.gcTimeMs - memoryHistory.value[i - 1].gcTimeMs
      return increment >= 0 ? increment : 0 // 确保不会出现负值
    })

    gcDurationChartInstance.setOption({
      title: { text: 'GC耗时分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params[0].name + '<br/>GC耗时: ' + params[0].value + ' ms'
      }},
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '耗时(ms)' },
      series: [{ name: 'GC耗时', type: 'line', data: gcTimeIncrements, smooth: true, itemStyle: { color: '#ff6b6b' }, areaStyle: { color: 'rgba(255, 107, 107, 0.1)' } }]
    })
    gcDurationChartInstance.resize()
  }

  // 7. Thread Count Chart
  if (threadChartRef.value) {
    if (!threadChartInstance) threadChartInstance = echarts.init(threadChartRef.value)
    threadChartInstance.setOption({
      title: { text: '线程数趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['当前线程'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '线程数' },
      series: [
        { name: '当前线程', type: 'line', data: memoryHistory.value.map(m => m.threadCount), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }
      ],
      ...animationConfig // Phase 2: 应用动画配置
    })
    threadChartInstance.resize()
  }
  
  // 8. Class Loading Chart
  if (classLoadingChartRef.value) {
    if (!classLoadingChartInstance) classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
    classLoadingChartInstance.setOption({
      title: { text: '类加载统计', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['已加载类'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '类数量' },
      series: [{ name: '已加载类', type: 'line', data: memoryHistory.value.map(m => m.loadedClassCount), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }],
      ...animationConfig // Phase 2: 应用动画配置
    })
    classLoadingChartInstance.resize()
  }
  
  // 9. CPU Usage Chart - 始终渲染，无数据时显示默认图表
  if (cpuChartRef.value) {
    console.log('🟢 CPU Chart ref found')
    if (!cpuChartInstance) cpuChartInstance = echarts.init(cpuChartRef.value)
    
    // 检查是否有有效数据
    const hasData = memoryHistory.value.length > 0 && (memoryHistory.value[0].processCpuLoad !== undefined || memoryHistory.value[0].systemCpuLoad !== undefined)
    
    if (!hasData) {
      // 无数据时显示空状态
      cpuChartInstance.setOption({
        title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无CPU数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      cpuChartInstance.resize()
    } else {
      cpuChartInstance.setOption({
        title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(2)}%<br/>` })
          return result
        }},
        legend: { data: ['进程CPU', '系统CPU'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: 'CPU%', axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' } },
        series: [
          { name: '进程CPU', type: 'line', data: memoryHistory.value.map(m => m.processCpuLoad || 0), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
          { name: '系统CPU', type: 'line', data: memoryHistory.value.map(m => m.systemCpuLoad || 0), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
        ],
        ...animationConfig // Phase 2: 应用动画配置
      })
      cpuChartInstance.resize()
    }
  }
  
  // 10. Minor vs Full GC Chart
  if (minorVsFullGcChartRef.value) {
    if (!minorVsFullGcChartInstance) minorVsFullGcChartInstance = echarts.init(minorVsFullGcChartRef.value)
    
    const minorGcData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const increment = (m.minorGcCount || 0) - (memoryHistory.value[i - 1].minorGcCount || 0)
      return Math.max(0, increment) // 确保增量不为负
    })
    const fullGcData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const increment = (m.fullGcCount || 0) - (memoryHistory.value[i - 1].fullGcCount || 0)
      return Math.max(0, increment) // 确保增量不为负
    })
    
    minorVsFullGcChartInstance.setOption({
      title: { text: 'Minor vs Full GC', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value} 次<br/>` })
        return result
      }},
      legend: { data: ['Minor GC', 'Full GC'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '次数' },
      series: [
        { name: 'Minor GC', type: 'bar', data: minorGcData, itemStyle: { color: '#409eff' } },
        { name: 'Full GC', type: 'bar', data: fullGcData, itemStyle: { color: '#f56c6c' } }
      ]
    })
    minorVsFullGcChartInstance.resize()
  }
  
  // 11. GC Efficiency Chart
  if (gcEfficiencyChartRef.value && memoryHistory.value[0].memoryPools) {
    if (!gcEfficiencyChartInstance) gcEfficiencyChartInstance = echarts.init(gcEfficiencyChartRef.value)
    
    const gcEfficiencyData: number[] = []
    memoryHistory.value.forEach((m, i) => {
      if (i === 0) {
        gcEfficiencyData.push(0)
        return
      }
      try {
        const pools: any[] = JSON.parse(m.memoryPools!)
        const prevPools: any[] = JSON.parse(memoryHistory.value[i - 1].memoryPools!)
        const eden = pools.find(p => p.name.includes('Eden'))
        const prevEden = prevPools.find(p => p.name.includes('Eden'))
        if (eden && prevEden && eden.used !== undefined && prevEden.used !== undefined) {
          const reclaimed = prevEden.used - eden.used
          // 只记录有效数据(>=0)
          gcEfficiencyData.push(reclaimed >= 0 ? reclaimed : 0)
        } else {
          gcEfficiencyData.push(0)
        }
      } catch (e) {
        console.warn('Failed to calculate GC efficiency:', e)
        gcEfficiencyData.push(0)
      }
    })
    
    gcEfficiencyChartInstance.setOption({
      title: { text: 'GC效率 (Eden回收量)', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis', 
        formatter: (params: any) => {
          const value = params[0].value
          if (value === undefined || value === null || isNaN(value)) {
            return params[0].name + '<br/>数据无效'
          }
          return params[0].name + '<br/>回收: ' + formatBytes(value)
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { 
        type: 'value', 
        name: '回收量', 
        axisLabel: { 
          formatter: (val: number) => {
            if (isNaN(val) || val === undefined) return '0 B'
            return formatBytes(val)
          }
        }
      },
      series: [{ 
        name: '回收量', 
        type: 'line', 
        data: gcEfficiencyData.map(v => isNaN(v) ? 0 : v), // 确保没有NaN
        smooth: true, 
        itemStyle: { color: '#67c23a' }, 
        areaStyle: { color: 'rgba(103, 194, 58, 0.1)' }
      }]
    })
    gcEfficiencyChartInstance.resize()
  }
  
  // 12. Thread States Pie Chart
  if (threadStatesChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].threadStates) {
    if (!threadStatesChartInstance) threadStatesChartInstance = echarts.init(threadStatesChartRef.value)
    
    try {
      const threadStates: any = JSON.parse(memoryHistory.value[memoryHistory.value.length - 1].threadStates!)
      const pieData = Object.entries(threadStates).map(([name, value]) => ({ name, value }))
      
      threadStatesChartInstance.setOption({
        title: { text: '线程状态分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', bottom: '10%' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          data: pieData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
          label: { formatter: '{b}: {c}' }
        }]
      })
      threadStatesChartInstance.resize()
    } catch (e) {
      console.error('Failed to parse thread states:', e)
    }
  }
  
  // 13. Class Loading Detail Chart - 仅当有数据时初始化
  if (classLoadingDetailChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].totalLoadedClassCount !== undefined) {
    if (!classLoadingDetailChartInstance) classLoadingDetailChartInstance = echarts.init(classLoadingDetailChartRef.value)
    
    const totalLoadedData = memoryHistory.value.map(m => m.totalLoadedClassCount || 0)
    const unloadedData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      return (m.unloadedClassCount || 0) - (memoryHistory.value[i - 1].unloadedClassCount || 0)
    })
    
    classLoadingDetailChartInstance.setOption({
      title: { text: '类加载/卸载趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['累计加载', '卸载增量'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '类数量' },
      series: [
        { name: '累计加载', type: 'line', data: totalLoadedData, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
        { name: '卸载增量', type: 'bar', data: unloadedData, itemStyle: { color: '#f56c6c' } }
      ]
    })
    classLoadingDetailChartInstance.resize()
  }
  
  // 14. Thread Pools Chart - 始终渲染，无数据时显示默认图表
  if (threadPoolsChartRef.value) {
    if (!threadPoolsChartInstance) threadPoolsChartInstance = echarts.init(threadPoolsChartRef.value)
    
    // 检查是否有有效数据
    const hasData = memoryHistory.value.length > 0 && memoryHistory.value[0].threadPools
    
    if (!hasData) {
      // 无数据时显示空状态
      threadPoolsChartInstance.setOption({
        title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无线程池数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      threadPoolsChartInstance.resize()
    } else {
      try {
        const latest = memoryHistory.value[memoryHistory.value.length - 1]
        const pools: any[] = JSON.parse(latest.threadPools!)
        
        if (!pools || pools.length === 0) {
          threadPoolsChartInstance.setOption({
            title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
            graphic: {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: '该 Agent 未上报线程池数据\n可能原因：JVM 版本不支持或配置未开启',
                fill: '#c0c4cc',
                fontSize: 14,
                textAlign: 'center'
              }
            }
          })
          threadPoolsChartInstance.resize()
        } else {
          const poolNames = pools.map(p => p.poolName)
          const poolCounts = pools.map(p => p.activeCount)
          
          threadPoolsChartInstance.setOption({
            title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
            xAxis: { type: 'category', data: poolNames, axisLabel: { interval: 0, rotate: 30 } },
            yAxis: { type: 'value', name: '线程数' },
            series: [{
              name: '活跃线程',
              type: 'bar',
              data: poolCounts,
              itemStyle: { color: '#409eff' },
              label: { show: true, position: 'top' }
            }]
          })
          threadPoolsChartInstance.resize()
        }
      } catch (e) {
        console.error('Failed to parse threadPools:', e)
        threadPoolsChartInstance.setOption({
          title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '解析线程池数据失败',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
        threadPoolsChartInstance.resize()
      }
    }
  }
  
  // 15. Class Loading Rate Chart - 仅当有数据时初始化
  if (classLoadingRateChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].classLoadingRate !== undefined) {
    if (!classLoadingRateChartInstance) classLoadingRateChartInstance = echarts.init(classLoadingRateChartRef.value)
    
    const loadRates: number[] = []
    const unloadRates: number[] = []
    
    memoryHistory.value.forEach((m, i) => {
      if (i === 0) {
        loadRates.push(0)
        unloadRates.push(0)
        return
      }
      
      const prevM = memoryHistory.value[i - 1]
      const timeDiffSeconds = (m.collectTime - prevM.collectTime) / 1000
      
      if (timeDiffSeconds > 0) {
        const totalLoadedDiff = Math.max(0, (m.totalLoadedClassCount || 0) - (prevM.totalLoadedClassCount || 0))
        const unloadedDiff = Math.max(0, (m.unloadedClassCount || 0) - (prevM.unloadedClassCount || 0))
        
        loadRates.push(totalLoadedDiff / timeDiffSeconds)
        unloadRates.push(unloadedDiff / timeDiffSeconds)
      } else {
        loadRates.push(0)
        unloadRates.push(0)
      }
    })
    
    classLoadingRateChartInstance.setOption({
      title: { text: '类加载/卸载速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value.toFixed(2)} 类/秒<br/>` })
        return result
      }},
      legend: { data: ['加载速率', '卸载速率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '类/秒' },
      series: [
        { name: '加载速率', type: 'line', data: loadRates, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } },
        { name: '卸载速率', type: 'line', data: unloadRates, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
      ]
    })
    classLoadingRateChartInstance.resize()
  }
  
  // ===== Phase 4: Memory Pools Detail Charts =====
  
  // 16. Eden & Survivor Chart
  if (edenSurvivorChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].edenUsed !== undefined) {
    if (!edenSurvivorChartInstance) edenSurvivorChartInstance = echarts.init(edenSurvivorChartRef.value)
    
    const edenUsedData = memoryHistory.value.map(m => m.edenUsed || 0)
    const edenMaxData = memoryHistory.value.map(m => m.edenMax || 0)
    const survivorUsedData = memoryHistory.value.map(m => m.survivorUsed || 0)
    
    edenSurvivorChartInstance.setOption({
      title: { text: 'Eden & Survivor区', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }
      },
      legend: { data: ['Eden使用', 'Eden最大', 'Survivor使用'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '内存', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: 'Eden使用', type: 'line', data: edenUsedData, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } },
        { name: 'Eden最大', type: 'line', data: edenMaxData, smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed' } },
        { name: 'Survivor使用', type: 'line', data: survivorUsedData, smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }
      ]
    })
    edenSurvivorChartInstance.resize()
  }
  
  // 17. Old Gen Detail Chart
  if (oldGenChartDetailRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].oldGenUsed !== undefined) {
    if (!oldGenChartDetailInstance) oldGenChartDetailInstance = echarts.init(oldGenChartDetailRef.value)
    
    const oldGenUsedData = memoryHistory.value.map(m => m.oldGenUsed || 0)
    const oldGenMaxData = memoryHistory.value.map(m => m.oldGenMax || 0)
    const oldGenUsageRate = memoryHistory.value.map(m => 
      m.oldGenMax > 0 ? ((m.oldGenUsed || 0) / m.oldGenMax * 100).toFixed(1) : 0
    )
    
    oldGenChartDetailInstance.setOption({
      title: { text: '老年代使用趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { 
            if (p.seriesName.includes('使用率')) {
              result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
            } else {
              result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>`
            }
          })
          return result
        }
      },
      legend: { data: ['老年代使用', '老年代最大', '使用率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: [
        { type: 'value', name: '内存', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        { type: 'value', name: '使用率(%)', max: 100, position: 'right' }
      ],
      series: [
        { name: '老年代使用', type: 'line', data: oldGenUsedData, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' }, yAxisIndex: 0 },
        { name: '老年代最大', type: 'line', data: oldGenMaxData, smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed' }, yAxisIndex: 0 },
        { name: '使用率', type: 'line', data: oldGenUsageRate, smooth: true, itemStyle: { color: '#409eff' }, lineStyle: { width: 2 }, yAxisIndex: 1 }
      ]
    })
    oldGenChartDetailInstance.resize()
  }
  
  // 18. Metaspace Chart
  if (metaspaceChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].metaspaceUsed !== undefined) {
    if (!metaspaceChartInstance) metaspaceChartInstance = echarts.init(metaspaceChartRef.value)
    
    const metaspaceUsedData = memoryHistory.value.map(m => m.metaspaceUsed || 0)
    const metaspaceMaxData = memoryHistory.value.map(m => m.metaspaceMax || 0)
    
    metaspaceChartInstance.setOption({
      title: { text: 'Metaspace趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }
      },
      legend: { data: ['Metaspace使用', 'Metaspace最大'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '内存', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: 'Metaspace使用', type: 'line', data: metaspaceUsedData, smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } },
        { name: 'Metaspace最大', type: 'line', data: metaspaceMaxData, smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed' } }
      ]
    })
    metaspaceChartInstance.resize()
  }
  
  // 19. Code Cache Chart
  if (codeCacheChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].codeCacheUsed !== undefined) {
    if (!codeCacheChartInstance) codeCacheChartInstance = echarts.init(codeCacheChartRef.value)
    
    const codeCacheUsedData = memoryHistory.value.map(m => m.codeCacheUsed || 0)
    const codeCacheMaxData = memoryHistory.value.map(m => m.codeCacheMax || 0)
    
    codeCacheChartInstance.setOption({
      title: { text: 'CodeCache趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }
      },
      legend: { data: ['CodeCache使用', 'CodeCache最大'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '内存', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: 'CodeCache使用', type: 'line', data: codeCacheUsedData, smooth: true, itemStyle: { color: '#9c27b0' }, areaStyle: { color: 'rgba(156, 39, 176, 0.1)' } },
        { name: 'CodeCache最大', type: 'line', data: codeCacheMaxData, smooth: true, itemStyle: { color: '#909399' }, lineStyle: { type: 'dashed' } }
      ]
    })
    codeCacheChartInstance.resize()
  }
  
  // ===== Phase 5: Advanced Monitoring Charts =====
  
  // 20. Memory Allocation Rate Chart
  if (memoryAllocationRateChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryAllocationRate !== undefined) {
    if (!memoryAllocationRateChartInstance) memoryAllocationRateChartInstance = echarts.init(memoryAllocationRateChartRef.value)
    
    const allocRateData = memoryHistory.value.map(m => m.memoryAllocationRate || 0)
    
    memoryAllocationRateChartInstance.setOption({
      title: { text: '内存分配速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          return params[0].name + '<br/>' + params[0].marker + ' 分配速率: ' + formatBytes(params[0].value) + '/s'
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '分配速率', axisLabel: { formatter: (val: number) => formatBytes(val) + '/s' } },
      series: [
        { 
          name: '分配速率', 
          type: 'line', 
          data: allocRateData, 
          smooth: true, 
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
          markLine: {
            data: [
              { type: 'average', label: { formatter: '平均值' }, lineStyle: { color: '#67c23a' } }
            ]
          }
        }
      ]
    })
    memoryAllocationRateChartInstance.resize()
  }
  
  // 21. GC Pressure Chart
  if (gcPressureChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].gcPressure !== undefined) {
    if (!gcPressureChartInstance) gcPressureChartInstance = echarts.init(gcPressureChartRef.value)
    
    const gcPressureData = memoryHistory.value.map(m => m.gcPressure || 0)
    
    gcPressureChartInstance.setOption({
      title: { text: 'GC压力指数', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value
          let level = value < 30 ? '低' : value < 60 ? '中' : value < 80 ? '高' : '极高'
          return params[0].name + '<br/>' + params[0].marker + ' GC压力: ' + value.toFixed(1) + ' (' + level + ')'
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '压力指数', max: 100 },
      series: [
        { 
          name: 'GC压力', 
          type: 'line', 
          data: gcPressureData, 
          smooth: true, 
          itemStyle: { color: '#e6a23c' },
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.5)' },
              { offset: 0.5, color: 'rgba(230, 162, 60, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ])
          },
          markLine: {
            data: [
              { yAxis: 30, label: { formatter: '低' }, lineStyle: { color: '#67c23a', type: 'dashed' } },
              { yAxis: 60, label: { formatter: '中' }, lineStyle: { color: '#e6a23c', type: 'dashed' } },
              { yAxis: 80, label: { formatter: '高' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }
            ]
          }
        }
      ]
    })
    gcPressureChartInstance.resize()
  }
  
  // ===== Phase 6: Comprehensive Monitoring Charts =====
  
  // 22. GC Reclaimed Bytes Chart
  if (gcReclaimedChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].gcReclaimedBytesCurrent !== undefined) {
    if (!gcReclaimedChartInstance) gcReclaimedChartInstance = echarts.init(gcReclaimedChartRef.value)
    
    const gcReclaimedData = memoryHistory.value.map(m => m.gcReclaimedBytesCurrent || 0)
    
    gcReclaimedChartInstance.setOption({
      title: { text: 'GC回收内存量', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          return params[0].name + '<br/>' + params[0].marker + ' GC回收: ' + formatBytes(params[0].value)
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '回收量', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { 
          name: 'GC回收量', 
          type: 'bar', 
          data: gcReclaimedData, 
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#409eff' }
            ])
          },
          markLine: {
            data: [
              { type: 'average', label: { formatter: '平均回收' }, lineStyle: { color: '#e6a23c' } }
            ]
          }
        }
      ]
    })
    gcReclaimedChartInstance.resize()
  }
  
  // 23. CPU-Memory Correlation Chart
  if (cpuMemoryCorrelationChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].cpuMemoryCorrelation !== undefined) {
    if (!cpuMemoryCorrelationChartInstance) cpuMemoryCorrelationChartInstance = echarts.init(cpuMemoryCorrelationChartRef.value)
    
    const correlationData = memoryHistory.value.map(m => m.cpuMemoryCorrelation || 0)
    const cpuData = memoryHistory.value.map(m => ((m.processCpuLoad || 0) * 100).toFixed(1))
    const memData = memoryHistory.value.map(m => m.heapMax > 0 ? ((m.heapUsed / m.heapMax) * 100).toFixed(1) : 0)
    
    cpuMemoryCorrelationChartInstance.setOption({
      title: { text: 'CPU-内存关联分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>` })
          return result
        }
      },
      legend: { data: ['CPU使用率', '内存使用率', '关联指数'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '百分比(%)', max: 100 },
      series: [
        { name: 'CPU使用率', type: 'line', data: cpuData, smooth: true, itemStyle: { color: '#409eff' } },
        { name: '内存使用率', type: 'line', data: memData, smooth: true, itemStyle: { color: '#67c23a' } },
        { 
          name: '关联指数', 
          type: 'line', 
          data: correlationData, 
          smooth: true, 
          itemStyle: { color: '#e6a23c' },
          lineStyle: { width: 3, type: 'dashed' },
          areaStyle: { color: 'rgba(230, 162, 60, 0.1)' }
        }
      ]
    })
    cpuMemoryCorrelationChartInstance.resize()
  }
  
  // ===== Phase 7: Real-time Dashboard Charts =====
  
  // 24. Top CPU Thread Chart
  if (topCpuThreadChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].topCpuThreadName !== undefined) {
    if (!topCpuThreadChartInstance) topCpuThreadChartInstance = echarts.init(topCpuThreadChartRef.value)
    
    const threadNames = memoryHistory.value.map(m => m.topCpuThreadName || 'unknown')
    const cpuPercents = memoryHistory.value.map(m => m.topCpuThreadPercent || 0)
    
    topCpuThreadChartInstance.setOption({
      title: { text: 'Top CPU线程趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          return params[0].name + '<br/>' + 
                 params[0].marker + ' 线程: ' + threadNames[params[0].dataIndex] + '<br/>' +
                 params[0].marker + ' CPU占用: ' + params[0].value.toFixed(2) + '%'
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: 'CPU占用(%)' },
      series: [
        { 
          name: 'CPU占用', 
          type: 'line', 
          data: cpuPercents, 
          smooth: true, 
          itemStyle: { color: '#f56c6c' },
          areaStyle: { color: 'rgba(245, 108, 108, 0.2)' },
          markPoint: {
            data: [
              { type: 'max', label: { formatter: '峰值' } },
              { type: 'average', label: { formatter: '平均' } }
            ]
          }
        }
      ]
    })
    topCpuThreadChartInstance.resize()
  }
  
  // 25. Thread State Distribution Chart
  if (threadStateChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].threadCountRunnable !== undefined) {
    if (!threadStateChartInstance) threadStateChartInstance = echarts.init(threadStateChartRef.value)
    
    const runnableData = memoryHistory.value.map(m => m.threadCountRunnable || 0)
    const blockedData = memoryHistory.value.map(m => m.threadCountBlocked || 0)
    const totalThreads = memoryHistory.value.map(m => (m.threadCountRunnable || 0) + (m.threadCountBlocked || 0))
    
    threadStateChartInstance.setOption({
      title: { text: '线程状态分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}<br/>` })
          return result
        }
      },
      legend: { data: ['RUNNABLE', 'BLOCKED'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '线程数' },
      series: [
        { 
          name: 'RUNNABLE', 
          type: 'bar', 
          stack: 'total',
          data: runnableData,
          itemStyle: { color: '#67c23a' }
        },
        { 
          name: 'BLOCKED', 
          type: 'bar', 
          stack: 'total',
          data: blockedData,
          itemStyle: { color: '#e6a23c' }
        },
        {
          name: '总计',
          type: 'line',
          data: totalThreads,
          smooth: true,
          itemStyle: { color: '#409eff' },
          lineStyle: { width: 2, type: 'dashed' }
        }
      ]
    })
    threadStateChartInstance.resize()
  }
  
  // ===== Phase 8: Performance Dashboard Chart =====
  
  // 26. Comprehensive Performance Dashboard
  if (performanceDashboardChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].performanceScore !== undefined) {
    if (!performanceDashboardChartInstance) performanceDashboardChartInstance = echarts.init(performanceDashboardChartRef.value)
    
    const cpuData = memoryHistory.value.map(m => ((m.processCpuLoad || 0) * 100).toFixed(1))
    const memUsageData = memoryHistory.value.map(m => m.heapMax > 0 ? ((m.heapUsed / m.heapMax) * 100).toFixed(1) : 0)
    const gcCountData = memoryHistory.value.map(m => m.gcCount || 0)
    const perfScoreData = memoryHistory.value.map(m => m.performanceScore || 0)
    
    // Health status colors
    const healthColors = memoryHistory.value.map(m => {
      const status = m.healthStatus
      if (status === 'HEALTHY') return '#67c23a'
      if (status === 'WARNING') return '#e6a23c'
      return '#f56c6c'
    })
    
    performanceDashboardChartInstance.setOption({
      title: { 
        text: '综合性能看板', 
        left: 'center', 
        textStyle: { fontSize: 16, fontWeight: 600 }
      },
      tooltip: { 
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => {
            if (p.seriesName.includes('CPU') || p.seriesName.includes('内存') || p.seriesName.includes('GC')) {
              result += `${p.marker} ${p.seriesName}: ${p.value}<br/>`
            } else if (p.seriesName.includes('评分')) {
              result += `${p.marker} ${p.seriesName}: ${p.value.toFixed(1)}<br/>`
            }
          })
          return result
        }
      },
      legend: { 
        data: ['CPU使用率', '内存使用率', 'GC次数', '性能评分'],
        top: 30,
        bottom: 0
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '12%', 
        top: '15%', 
        containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        data: times, 
        boundaryGap: false 
      },
      yAxis: [
        { 
          type: 'value', 
          name: '百分比(%)', 
          max: 100,
          position: 'left'
        },
        { 
          type: 'value', 
          name: 'GC次数',
          position: 'right'
        },
        {
          type: 'value',
          name: '性能评分',
          max: 100,
          position: 'right',
          offset: 80
        }
      ],
      series: [
        { 
          name: 'CPU使用率', 
          type: 'line', 
          data: cpuData, 
          smooth: true, 
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
          yAxisIndex: 0
        },
        { 
          name: '内存使用率', 
          type: 'line', 
          data: memUsageData, 
          smooth: true, 
          itemStyle: { color: '#67c23a' },
          areaStyle: { color: 'rgba(103, 194, 58, 0.1)' },
          yAxisIndex: 0
        },
        { 
          name: 'GC次数', 
          type: 'bar', 
          data: gcCountData,
          itemStyle: { color: '#e6a23c' },
          yAxisIndex: 1
        },
        { 
          name: '性能评分', 
          type: 'line', 
          data: perfScoreData, 
          smooth: true, 
          itemStyle: { 
            color: (params: any) => {
              const score = params.value
              if (score >= 80) return '#67c23a'
              if (score >= 60) return '#e6a23c'
              return '#f56c6c'
            }
          },
          lineStyle: { width: 3 },
          markLine: {
            data: [
              { yAxis: 80, label: { formatter: '健康线' }, lineStyle: { color: '#67c23a', type: 'dashed' } },
              { yAxis: 60, label: { formatter: '警告线' }, lineStyle: { color: '#e6a23c', type: 'dashed' } }
            ]
          },
          yAxisIndex: 2
        }
      ]
    })
    performanceDashboardChartInstance.resize()
  }
  
  // 关键：所有图表渲染后统一resize，确保在Tab页中正确显示
  setTimeout(() => {
    heapChartInstance?.resize()
    nonHeapChartInstance?.resize()
    youngGenChartInstance?.resize()
    oldGenChartInstance?.resize()
    gcCountChartInstance?.resize()
    gcDurationChartInstance?.resize()
    threadChartInstance?.resize()
    classLoadingChartInstance?.resize()
    cpuChartInstance?.resize()
    minorVsFullGcChartInstance?.resize()
    gcEfficiencyChartInstance?.resize()
    threadStatesChartInstance?.resize()
    classLoadingDetailChartInstance?.resize()
    threadPoolsChartInstance?.resize()
    classLoadingRateChartInstance?.resize()
    edenSurvivorChartInstance?.resize()
    oldGenChartDetailInstance?.resize()
    metaspaceChartInstance?.resize()
    codeCacheChartInstance?.resize()
    memoryAllocationRateChartInstance?.resize()
    gcPressureChartInstance?.resize()
    gcReclaimedChartInstance?.resize()
    cpuMemoryCorrelationChartInstance?.resize()
    topCpuThreadChartInstance?.resize()
    threadStateChartInstance?.resize()
    performanceDashboardChartInstance?.resize()
    memoryPoolsGridInstance?.resize()
    memoryUsageRateInstance?.resize()
    bufferPoolsChartInstance?.resize()
    memoryAllocationInstance?.resize()
    physicalMemoryInstance?.resize()
    heapGrowthRateInstance?.resize()
    gcPressureInstance?.resize()
    systemLoadInstance?.resize()
    diskIoInstance?.resize()
    
    console.log('All charts resized')
  }, 50)
  
  // 新增：内存使用率趋势图
  if (memoryUsageRateRef.value && memoryHistory.value.length > 0) {
    if (!memoryUsageRateInstance) memoryUsageRateInstance = echarts.init(memoryUsageRateRef.value)
    
    const heapUsageRates = memoryHistory.value.map(m => 
      m.heapMax > 0 ? ((m.heapUsed / m.heapMax) * 100).toFixed(1) : 0
    )
    const nonHeapUsageRates = memoryHistory.value.map(m => 
      m.nonHeapMax > 0 ? ((m.nonHeapUsed / m.nonHeapMax) * 100).toFixed(1) : 0
    )
    
    memoryUsageRateInstance.setOption({
      title: { text: '内存使用率趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>` })
          return result
        }
      },
      legend: { data: ['堆内存使用率', '非堆内存使用率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: '使用率(%)', max: 100 },
      series: [
        { 
          name: '堆内存使用率', 
          type: 'line', 
          data: heapUsageRates, 
          smooth: true, 
          itemStyle: { color: '#409eff' },
          markLine: {
            data: [{ yAxis: 80, label: { formatter: '警戒线 80%' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }]
          }
        },
        { 
          name: '非堆内存使用率', 
          type: 'line', 
          data: nonHeapUsageRates, 
          smooth: true, 
          itemStyle: { color: '#e6a23c' }
        }
      ]
    })
    memoryUsageRateInstance.resize()
  }
  
  // 新增：缓冲区池监控 (只在有数据时渲染)
  if (bufferPoolsChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].bufferPools) {
    try {
      const latest = memoryHistory.value[memoryHistory.value.length - 1]
      const buffers: any[] = JSON.parse(latest.bufferPools!)
      
      // 检查是否有有效数据
      if (!buffers || buffers.length === 0) {
        console.log('No buffer pools data available')
        return
      }
      
      if (!bufferPoolsChartInstance) bufferPoolsChartInstance = echarts.init(bufferPoolsChartRef.value)
      
      const bufferNames = buffers.map(b => b.name)
      const bufferUsed = buffers.map(b => b.memoryUsed || 0)
      const bufferCapacity = buffers.map(b => b.totalCapacity || 0)
      
      bufferPoolsChartInstance.setOption({
        title: { text: '缓冲区池使用', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
            return result
          }
        },
        legend: { data: ['已使用', '总容量'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: bufferNames, axisLabel: { interval: 0, rotate: 30 } },
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        series: [
          { name: '已使用', type: 'bar', data: bufferUsed, itemStyle: { color: '#409eff' } },
          { name: '总容量', type: 'bar', data: bufferCapacity, itemStyle: { color: '#909399' } }
        ]
      })
      bufferPoolsChartInstance.resize()
    } catch (e) {
      console.warn('Failed to render buffer pools chart:', e)
    }
  }
  
  // 新增：内存分配趋势
  if (memoryAllocationRef.value && memoryHistory.value.length > 0) {
    if (!memoryAllocationInstance) memoryAllocationInstance = echarts.init(memoryAllocationRef.value)
    
    const heapCommittedData = memoryHistory.value.map(m => m.heapCommitted)
    const nonHeapCommittedData = memoryHistory.value.map(m => m.nonHeapCommitted)
    
    memoryAllocationInstance.setOption({
      title: { text: '内存分配趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }
      },
      legend: { data: ['堆内存分配', '非堆内存分配'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: '堆内存分配', type: 'line', data: heapCommittedData, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } },
        { name: '非堆内存分配', type: 'line', data: nonHeapCommittedData, smooth: true, itemStyle: { color: '#00bcd4' }, areaStyle: { color: 'rgba(0, 188, 212, 0.1)' } }
      ]
    })
    memoryAllocationInstance.resize()
  }
  
  // 新增：物理内存监控
  if (physicalMemoryRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].totalPhysicalMemory) {
    if (!physicalMemoryInstance) physicalMemoryInstance = echarts.init(physicalMemoryRef.value)
    
    const usedPhysicalMemory = memoryHistory.value.map(m => 
      (m.totalPhysicalMemory || 0) - (m.freePhysicalMemory || 0)
    )
    const totalPhysicalMemory = memoryHistory.value[0].totalPhysicalMemory
    
    physicalMemoryInstance.setOption({
      title: { text: '物理内存使用', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          const used = params.find((p: any) => p.seriesName === '已使用')
          if (used && totalPhysicalMemory > 0) {
            result += `使用率: ${((used.value / totalPhysicalMemory) * 100).toFixed(1)}%`
          }
          return result
        }
      },
      legend: { data: ['已使用', '总物理内存'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
      series: [
        { name: '已使用', type: 'line', data: usedPhysicalMemory, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
        { name: '总物理内存', type: 'line', data: memoryHistory.value.map(() => totalPhysicalMemory), smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
      ]
    })
    physicalMemoryInstance.resize()
  }
  
  // 新增：系统负载监控 - 仅当有数据时初始化
  if (systemLoadRef.value && memoryHistory.value.length > 0 && (memoryHistory.value[0].systemCpuLoad !== undefined || memoryHistory.value[0].processCpuLoad !== undefined)) {
    if (!systemLoadInstance) systemLoadInstance = echarts.init(systemLoadRef.value)
    
    const systemCpuLoadData = memoryHistory.value.map(m => 
      m.systemCpuLoad ? (m.systemCpuLoad * 100).toFixed(1) : 0
    )
    const processCpuLoadData = memoryHistory.value.map(m => 
      m.processCpuLoad ? (m.processCpuLoad * 100).toFixed(1) : 0
    )
    
    systemLoadInstance.setOption({
      title: { text: 'CPU负载趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>` })
          return result
        }
      },
      legend: { data: ['系统CPU', '进程CPU'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: 'CPU%', max: 100 },
      series: [
        { 
          name: '系统CPU', 
          type: 'line', 
          data: systemCpuLoadData, 
          smooth: true, 
          itemStyle: { color: '#f56c6c' },
          areaStyle: { color: 'rgba(245, 108, 108, 0.1)' },
          markLine: {
            data: [{ yAxis: 80, label: { formatter: '警戒线 80%' }, lineStyle: { color: '#ff0000', type: 'dashed' } }]
          }
        },
        { 
          name: '进程CPU', 
          type: 'line', 
          data: processCpuLoadData, 
          smooth: true, 
          itemStyle: { color: '#409eff' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
        }
      ]
    })
    systemLoadInstance.resize()
  }
  
  // 新增：磁盘I/O监控（如果有数据）
  if (diskIoRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].diskReadBytes !== undefined) {
    if (!diskIoInstance) diskIoInstance = echarts.init(diskIoRef.value)
    
    const diskReadData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const val = (m.diskReadBytes || 0) - (memoryHistory.value[i - 1].diskReadBytes || 0)
      return val >= 0 ? val : 0 // 确保增量不为负
    })
    const diskWriteData = memoryHistory.value.map((m, i) => {
      if (i === 0) return 0
      const val = (m.diskWriteBytes || 0) - (memoryHistory.value[i - 1].diskWriteBytes || 0)
      return val >= 0 ? val : 0 // 确保增量不为负
    })
    
    diskIoInstance.setOption({
      title: { text: '磁盘I/O速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}/s<br/>` })
          return result
        }
      },
      legend: { data: ['读取速率', '写入速率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { type: 'value', name: 'B/s', axisLabel: { formatter: (val: number) => formatBytes(val) + '/s' } },
      series: [
        { name: '读取速率', type: 'bar', data: diskReadData, itemStyle: { color: '#67c23a' } },
        { name: '写入速率', type: 'bar', data: diskWriteData, itemStyle: { color: '#e6a23c' } }
      ]
    })
    diskIoInstance.resize()
  }
  
  // 新增：堆内存增长率 (内存泄漏检测关键指标)
  if (heapGrowthRateRef.value && memoryHistory.value.length > 0) {
    if (!heapGrowthRateInstance) heapGrowthRateInstance = echarts.init(heapGrowthRateRef.value)
    
    // 计算堆内存增长率 (%/分钟)
    const growthRates: number[] = []
    for (let i = 1; i < memoryHistory.value.length; i++) {
      const prev = memoryHistory.value[i - 1]
      const curr = memoryHistory.value[i]
      const timeDiffMinutes = (curr.collectTime - prev.collectTime) / 60000
      
      if (timeDiffMinutes > 0 && prev.heapMax > 0) {
        const growthPercent = ((curr.heapUsed - prev.heapUsed) / prev.heapMax) * 100
        growthRates.push(growthPercent / timeDiffMinutes) // %/min
      } else {
        growthRates.push(0)
      }
    }
    growthRates.unshift(0) // 第一个点为0
    
    heapGrowthRateInstance.setOption({
      title: { 
        text: '堆内存增长率 (泄漏检测)', 
        left: 'center', 
        textStyle: { fontSize: 14, fontWeight: 600 }
      },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value
          let status = ''
          if (value > 5) status = ' ⚠️ 快速增长'
          else if (value > 1) status = ' ⚡ 中速增长'
          else if (value > 0) status = ' ✅ 缓慢增长'
          else status = ' 💚 稳定/下降'
          
          return `${params[0].name}<br/>${params[0].marker} 增长率: ${value.toFixed(2)}%/分钟${status}`
        }
      },
      legend: { data: ['增长率'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { 
        type: 'value', 
        name: '%/分钟',
        axisLabel: { formatter: (val: number) => val.toFixed(2) + '%' }
      },
      series: [
        { 
          name: '增长率', 
          type: 'line', 
          data: growthRates, 
          smooth: true,
          itemStyle: { 
            color: (params: any) => {
              if (params.value > 5) return '#f56c6c' // 红色-快速增长
              if (params.value > 1) return '#e6a23c' // 橙色-中速增长
              if (params.value > 0) return '#409eff' // 蓝色-缓慢增长
              return '#67c23a' // 绿色-稳定
            }
          },
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
            ])
          },
          markLine: {
            data: [
              { yAxis: 0, label: { formatter: '零增长线' }, lineStyle: { color: '#67c23a', type: 'solid' } },
              { yAxis: 1, label: { formatter: '警戒线 1%/min' }, lineStyle: { color: '#e6a23c', type: 'dashed' } },
              { yAxis: 5, label: { formatter: '危险线 5%/min' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }
            ]
          }
        }
      ]
    })
    heapGrowthRateInstance.resize()
  }
  
  // 新增：GC压力指数 (综合评估GC对性能的影响)
  if (gcPressureRef.value && memoryHistory.value.length > 0) {
    if (!gcPressureInstance) gcPressureInstance = echarts.init(gcPressureRef.value)
    
    // 计算GC压力指数 (0-100)
    const gcPressureData: number[] = []
    for (let i = 1; i < memoryHistory.value.length; i++) {
      const prev = memoryHistory.value[i - 1]
      const curr = memoryHistory.value[i]
      const timeDiffSeconds = (curr.collectTime - prev.collectTime) / 1000
      
      if (timeDiffSeconds > 0) {
        // GC时间占比（确保不为负）
        const gcTimeIncrement = Math.max(0, curr.gcTimeMs - prev.gcTimeMs)
        const gcTimeRatio = gcTimeIncrement / (timeDiffSeconds * 1000)
        
        // GC频率（确保不为负）
        const gcCountIncrement = Math.max(0, curr.gcCount - prev.gcCount)
        const gcFrequency = gcCountIncrement / timeDiffSeconds
        
        // Full GC频率（确保不为负，权重更高）
        const fullGcIncrement = Math.max(0, (curr.fullGcCount || 0) - (prev.fullGcCount || 0))
        const fullGcFreq = fullGcIncrement / timeDiffSeconds
        
        // 综合压力指数 (0-100)
        const pressure = Math.min(100, Math.max(0, (
          gcTimeRatio * 40 +      // GC时间占比 40%
          gcFrequency * 30 +      // GC频率 30%
          fullGcFreq * 300        // Full GC频率 30% (权重高)
        ) * 100))
        
        gcPressureData.push(pressure)
      } else {
        gcPressureData.push(0)
      }
    }
    gcPressureData.unshift(0)
    
    gcPressureInstance.setOption({
      title: { 
        text: 'GC压力指数', 
        left: 'center', 
        textStyle: { fontSize: 14, fontWeight: 600 }
      },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          const value = params[0].value
          let level = ''
          let color = ''
          if (value > 70) { level = '🔴 严重'; color = '#f56c6c' }
          else if (value > 40) { level = '🟠 高'; color = '#e6a23c' }
          else if (value > 20) { level = '🟡 中'; color = '#ffd700' }
          else { level = '🟢 低'; color = '#67c23a' }
          
          return `${params[0].name}<br/>${params[0].marker} 压力指数: ${value.toFixed(1)}<br/>等级: <span style="color:${color}">${level}</span>`
        }
      },
      legend: { data: ['GC压力'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times, boundaryGap: false },
      yAxis: { 
        type: 'value', 
        name: '压力指数',
        max: 100,
        axisLabel: { formatter: (val: number) => val.toFixed(0) }
      },
      series: [
        { 
          name: 'GC压力', 
          type: 'line', 
          data: gcPressureData, 
          smooth: true,
          itemStyle: { 
            color: (params: any) => {
              if (params.value > 70) return '#f56c6c'
              if (params.value > 40) return '#e6a23c'
              if (params.value > 20) return '#ffd700'
              return '#67c23a'
            }
          },
          areaStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
            ])
          },
          markLine: {
            data: [
              { yAxis: 20, label: { formatter: '低/中分界' }, lineStyle: { color: '#ffd700', type: 'dashed' } },
              { yAxis: 40, label: { formatter: '中/高分界' }, lineStyle: { color: '#e6a23c', type: 'dashed' } },
              { yAxis: 70, label: { formatter: '高/严重分界' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }
            ]
          }
        }
      ]
    })
    gcPressureInstance.resize()
  }
}

// 渲染内存池详细网格 - 改为折线图展示
const renderMemoryPoolsGrid = () => {
  if (!memoryPoolsGridRef.value) return
  
  try {
    // 只有确定有数据时才初始化 ECharts 实例
    if (!memoryPoolsGridInstance) {
      memoryPoolsGridInstance = echarts.init(memoryPoolsGridRef.value)
    }
    
    // 如果没有历史数据，显示默认空状态图表
    if (memoryHistory.value.length === 0) {
      memoryPoolsGridInstance.setOption({
        title: { 
          text: '内存池使用趋势', 
          left: 'center', 
          textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } 
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无内存池数据\n请确保 Agent 正常运行并上报数据',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      memoryPoolsGridInstance.resize()
      return
    }
    
    // 提取所有内存池名称
    const allPoolNames = new Set<string>()
    memoryHistory.value.forEach(record => {
      if (record.memoryPools) {
        try {
          const pools: any[] = JSON.parse(record.memoryPools)
          pools.forEach(pool => allPoolNames.add(pool.name))
        } catch (e) {
          // ignore
        }
      }
    })
    
    const poolNames = Array.from(allPoolNames)
    const times = memoryHistory.value.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 如果没有内存池数据，显示提示图表
    if (poolNames.length === 0) {
      memoryPoolsGridInstance.setOption({
        title: { 
          text: '内存池使用趋势', 
          left: 'center', 
          textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } 
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '该 Agent 未上报内存池数据\n可能原因：JVM 版本不支持或配置未开启',
            fill: '#c0c4cc',
            fontSize: 14,
            textAlign: 'center'
          }
        }
      })
      memoryPoolsGridInstance.resize()
      return
    }
    
    // 为每个内存池生成数据系列
    const series = poolNames.map((poolName, index) => {
      const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9c27b0', '#00bcd4', '#ff9800', '#795548']
      const color = colors[index % colors.length]
      
      const data = memoryHistory.value.map(record => {
        if (!record.memoryPools) return 0
        try {
          const pools: any[] = JSON.parse(record.memoryPools)
          const pool = pools.find(p => p.name === poolName)
          return pool ? pool.used : 0
        } catch (e) {
          return 0
        }
      })
      
      return {
        name: poolName,
        type: 'line',
        data: data,
        smooth: true,
        itemStyle: { color: color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color.replace(')', ', 0.3)').replace('rgb', 'rgba') },
            { offset: 1, color: color.replace(')', ', 0.05)').replace('rgb', 'rgba') }
          ])
        }
      }
    })
    
    memoryPoolsGridInstance.setOption({
      title: { 
        text: '内存池使用趋势', 
        left: 'center', 
        textStyle: { fontSize: 14, fontWeight: 600 } 
      },
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { 
            result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>`
          })
          return result
        }
      },
      legend: { 
        data: poolNames, 
        bottom: 0,
        type: 'scroll',
        orient: 'horizontal',
        itemGap: 12,
        itemWidth: 15,
        itemHeight: 10,
        // 多行显示配置
        pageIcons: {
          horizontal: ['M0,0L12,-10L12,10z', 'M0,0L-12,-10L-12,10z']
        },
        pageIconColor: '#409eff',
        pageIconInactiveColor: '#c0c4cc',
        pageIconSize: 12,
        pageTextStyle: { 
          color: '#666',
          fontSize: 11
        },
        formatter: (name: string) => {
          // 缩短过长的名称
          if (name.length > 25) {
            return name.substring(0, 23) + '...'
          }
          return name
        },
        textStyle: {
          fontSize: 11
        }
      },
      grid: { 
        left: '3%', 
        right: '4%', 
        bottom: '25%', 
        top: '10%', 
        containLabel: true 
      },
      xAxis: { 
        type: 'category', 
        data: times, 
        boundaryGap: false 
      },
      yAxis: { 
        type: 'value', 
        name: '内存使用',
        axisLabel: { formatter: (val: number) => formatBytes(val) } 
      },
      series: series
    })
    
    memoryPoolsGridInstance.resize()
  } catch (e) {
    console.error('Failed to render memory pools chart:', e)
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
        form.value = { projectCode: '', appCode: '', appName: '', appType: 'self-built', description: '' }
        loadData()
      } catch (e: any) {
        ElMessage.error(e.message || '创建失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
  // 如果默认显示运行实例 Tab，则加载实例数据
  if (activeTab.value === 'instances') {
    loadInstances()
  }
})

// Phase 1: 组件卸载时清理定时器
onUnmounted(() => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = null
  }
  stopAutoRefresh() // 停止自动刷新
})

// 监听 Tab 切换，加载对应数据
watch(activeTab, (newTab) => {
  if (newTab === 'instances' && instances.value.length === 0) {
    loadInstances()
  }
  
  // Phase 2: 切换到非历史趋势Tab时，暂停实时监控
  if (newTab !== 'history' && enableRealtime.value) {
    toggleRealtime(false)
    ElMessage.info('已离开历史趋势页面，实时监控已暂停')
  }
})
</script>

<style scoped>
/* 下拉菜单分类标题样式 */
.dropdown-category {
  padding: 6px 12px;
  font-size: 11px;
  color: #909399;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: #f5f7fa;
  border-left: 3px solid #409eff;
  margin: 4px 0;
}

.application-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 600px;
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

.tab-content {
  padding: var(--space-4) 0;
}

.instances-tab {
  min-height: 500px;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 诊断图表样式 */
.diag-chart-content {
  min-height: 400px;
}

.chart-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-card {
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #909399;
  font-size: 13px;
}

.info-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.percentage-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.text-mode,
.diag-text-content {
  font-family: monospace;
}

.text-mode :deep(.el-textarea__inner),
.diag-text-content :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

/* 配置对话框样式 */
.config-hint {
  margin-bottom: 16px;
}

.config-hint :deep(.el-alert) {
  padding: 12px 16px;
}

.config-section {
  padding: 8px 0;
}

.config-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  font-family: monospace;
}

.loading-text {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

:deep(.el-tabs--border-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.el-tabs--border-card > .el-tabs__header) {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #ebeef5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}

.detail-value {
  color: #303133;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.stat-value.large {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
}

/* 内存历史趋势样式 */
.memory-history-container {
  padding: 16px 0;
}

.history-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-box {
  height: 300px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.chart-box-large {
  height: 320px;
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}

.charts-row {
  margin-bottom: 20px;
}

.section-header {
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.metric-card {
  text-align: center;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.metric-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.metric-subtitle {
  font-size: 12px;
  color: #c0c4cc;
}

.pools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  margin-top: 10px;
}

.pool-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.pool-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.pool-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pool-type {
  font-size: 11px;
  color: #909399;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.pool-stats {
  margin-bottom: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 12px;
}

.stat-label {
  color: #606266;
  font-weight: 500;
}

.stat-value {
  color: #303133;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.pool-progress-bar {
  width: 100%;
  height: 8px;
  background-color: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.pool-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mini-pool-chart {
  height: 120px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 5px;
}

.pools-grid-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.jvm-info-card {
  margin-top: 10px;
}

.jvm-info-card :deep(.el-descriptions__label) {
  font-weight: 600;
  background-color: #f5f7fa;
}

.jvm-args-container {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-top: 8px;
}

.jvm-args-container::-webkit-scrollbar {
  width: 6px;
}

.jvm-args-container::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.jvm-args-container::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}
</style>
