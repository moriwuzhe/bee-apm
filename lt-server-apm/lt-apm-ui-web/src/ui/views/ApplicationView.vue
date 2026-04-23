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
            <el-table-column label="操作" width="350" fixed="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-dropdown trigger="click" @command="(cmd: string) => handleDiagCommand(cmd, row)">
                    <el-button type="primary" size="small">
                      <el-icon><ArrowDown /></el-icon>
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
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="900px" @opened="handleDialogOpened">
      
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
          <el-tabs v-model="memoryTab" type="border-card" :lazy="false">
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
                      <div ref="minorVsFullGcChartRef" class="chart-box-large" data-chart="minor-vs-full-gc"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="gcEfficiencyChartRef" class="chart-box-large" data-chart="gc-efficiency"></div>
                    </el-col>
                  </el-row>
                  
                  <!-- Phase 4: Memory Pools Detail Section -->
                  <div class="section-header">
                    <h3>️ 内存池详细趋势</h3>
                  </div>
                  <el-row :gutter="16" class="charts-row">
                    <el-col :span="12">
                      <div ref="edenSurvivorChartRef" class="chart-box-large" data-chart="eden-survivor"></div>
                    </el-col>
                    <el-col :span="12">
                      <div ref="oldGenChartDetailRef" class="chart-box-large" data-chart="old-gen"></div>
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
            <!-- 内存关键指标卡片 -->
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">💾 堆内存使用率</div>
                  <div class="stat-value" :class="heapUsageStatus">{{ heapUsagePercent }}</div>
                  <div class="stat-subtitle">当前时刻</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📊 非堆内存使用率</div>
                  <div class="stat-value" :class="nonHeapUsageStatus">{{ nonHeapUsagePercent }}</div>
                  <div class="stat-subtitle">Metaspace等</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🌱 新生代使用率</div>
                  <div class="stat-value" :class="youngGenUsageStatus">{{ youngGenUsagePercent }}</div>
                  <div class="stat-subtitle">Eden + Survivor</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">👴 老年代使用率</div>
                  <div class="stat-value" :class="oldGenUsageStatus">{{ oldGenUsagePercent }}</div>
                  <div class="stat-subtitle">Old Gen</div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📈 内存增长速率</div>
                  <div class="stat-value" :class="memoryGrowthStatus">{{ memoryGrowthRate }}</div>
                  <div class="stat-subtitle">MB/分钟</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚡ GC压力指数</div>
                  <div class="stat-value" :class="gcPressureStatus">{{ gcPressureIndex }}</div>
                  <div class="stat-subtitle">0-100分</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🔍 内存泄漏风险</div>
                  <div class="stat-value" :class="leakRiskStatus">{{ leakRiskLevel }}</div>
                  <div class="stat-subtitle">风险评估</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🎯 内存健康度</div>
                  <div class="stat-value" :class="memoryHealthStatus">{{ memoryHealthScore }}</div>
                  <div class="stat-subtitle">综合评分</div>
                </el-card>
              </el-col>
            </el-row>
            
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
            <!-- GC关键指标卡片 -->
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">♻️ 累计GC次数</div>
                  <div class="stat-value">{{ totalGcCount }}</div>
                  <div class="stat-subtitle">Minor + Full</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⏱️ 累计GC耗时</div>
                  <div class="stat-value">{{ totalGcTime }}</div>
                  <div class="stat-subtitle">毫秒</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📈 GC频率</div>
                  <div class="stat-value">{{ gcFrequency }}</div>
                  <div class="stat-subtitle">次/小时</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚡ 平均GC耗时</div>
                  <div class="stat-value" :class="avgGcTimeStatus">{{ avgGcTime }}</div>
                  <div class="stat-subtitle">毫秒/次</div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🔴 Full GC占比</div>
                  <div class="stat-value" :class="fullGcRatioStatus">{{ fullGcRatio }}</div>
                  <div class="stat-subtitle">Full/Total</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title"> GC效率</div>
                  <div class="stat-value" :class="gcEfficiencyStatus">{{ gcEfficiency }}</div>
                  <div class="stat-subtitle">回收/分配</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🛑 最大GC耗时</div>
                  <div class="stat-value">{{ maxGcDuration }}</div>
                  <div class="stat-subtitle">峰值</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🎯 GC健康度</div>
                  <div class="stat-value" :class="gcHealthStatus">{{ gcHealthScore }}</div>
                  <div class="stat-subtitle">综合评分</div>
                </el-card>
              </el-col>
            </el-row>
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
            
            <!-- GC关联分析 -->
            <div class="section-header">
              <h3> GC关联分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="gcVsHeapChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="gcVsCpuChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 智能GC分析面板 -->
            <div class="section-header">
              <h3>🧠 智能GC分析</h3>
            </div>
            <el-card shadow="hover" style="margin-bottom: 20px;">
              <div class="gc-analysis-panel">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">♻️</span>
                      <div class="analysis-content">
                        <div class="analysis-label">GC模式</div>
                        <div class="analysis-value" :class="gcModeAnalysis.status">{{ gcModeAnalysis.text }}</div>
                        <div class="analysis-detail">{{ gcModeAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">🛑</span>
                      <div class="analysis-content">
                        <div class="analysis-label">Full GC趋势</div>
                        <div class="analysis-value" :class="fullGcTrendAnalysis.status">{{ fullGcTrendAnalysis.text }}</div>
                        <div class="analysis-detail">{{ fullGcTrendAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="16" style="margin-top: 16px;">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">🎯</span>
                      <div class="analysis-content">
                        <div class="analysis-label">GC健康度</div>
                        <div class="analysis-value" :class="gcHealthDetailAnalysis.status">{{ gcHealthDetailAnalysis.text }}</div>
                        <div class="analysis-detail">{{ gcHealthDetailAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">💡</span>
                      <div class="analysis-content">
                        <div class="analysis-label">优化建议</div>
                        <div class="analysis-value suggestion">{{ gcSuggestions[0] }}</div>
                        <div class="analysis-detail">{{ gcSuggestions[1] }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
            
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
            <!-- 线程关键指标卡片 -->
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📊 最大线程数</div>
                  <div class="stat-value">{{ maxThreadCountValue }}</div>
                  <div class="stat-subtitle">峰值时刻</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">👥 平均线程数</div>
                  <div class="stat-value">{{ avgThreadCount }}</div>
                  <div class="stat-subtitle">总体平均</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🔝 峰值线程数</div>
                  <div class="stat-value">{{ peakThreadCountValue }}</div>
                  <div class="stat-subtitle">历史最高</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🚫 BLOCKED占比</div>
                  <div class="stat-value" :class="blockedRatioStatus">{{ blockedRatioText }}</div>
                  <div class="stat-subtitle">线程阻塞</div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🛡️ 守护线程占比</div>
                  <div class="stat-value">{{ daemonRatioText }}</div>
                  <div class="stat-subtitle">Daemon比例</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚡ 活跃线程占比</div>
                  <div class="stat-value" :class="runnableRatioStatus">{{ runnableRatioText }}</div>
                  <div class="stat-subtitle">RUNNABLE比例</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📈 线程创建速率</div>
                  <div class="stat-value">{{ threadCreationRateValue }}</div>
                  <div class="stat-subtitle">个/秒</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🔄 累计启动线程</div>
                  <div class="stat-value">{{ totalStartedThreadValue }}</div>
                  <div class="stat-subtitle">生命周期</div>
                </el-card>
              </el-col>
            </el-row>
            
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
            
            <!-- 新增：线程高级分析图表 -->
            <div class="section-header">
              <h3>📈 线程高级分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="daemonThreadChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="blockedThreadChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="topCpuThreadDetailChartRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="threadCreationRateChartRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 线程与性能关联分析 -->
            <div class="section-header">
              <h3> 线程与性能关联</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="12">
                <div ref="threadCpuCorrelationRef" class="chart-box-large"></div>
              </el-col>
              <el-col :span="12">
                <div ref="threadLeakDetectionRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="threadStatesTrendRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 智能线程分析面板 -->
            <div class="section-header">
              <h3>🧠 智能线程分析</h3>
            </div>
            <el-card shadow="hover" style="margin-bottom: 20px;">
              <div class="thread-analysis-panel">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">📊</span>
                      <div class="analysis-content">
                        <div class="analysis-label">线程增长模式</div>
                        <div class="analysis-value" :class="threadGrowthAnalysis.status">{{ threadGrowthAnalysis.text }}</div>
                        <div class="analysis-detail">{{ threadGrowthAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">🚫</span>
                      <div class="analysis-content">
                        <div class="analysis-label">线程阻塞情况</div>
                        <div class="analysis-value" :class="blockedThreadAnalysis.status">{{ blockedThreadAnalysis.text }}</div>
                        <div class="analysis-detail">{{ blockedThreadAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="16" style="margin-top: 16px;">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">⚡</span>
                      <div class="analysis-content">
                        <div class="analysis-label">线程健康度</div>
                        <div class="analysis-value" :class="threadHealthAnalysis.status">{{ threadHealthAnalysis.text }}</div>
                        <div class="analysis-detail">{{ threadHealthAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">💡</span>
                      <div class="analysis-content">
                        <div class="analysis-label">优化建议</div>
                        <div class="analysis-value suggestion">{{ threadSuggestions[0] }}</div>
                        <div class="analysis-detail">{{ threadSuggestions[1] }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
            </template>
            
            <!-- 🏊 线程池监控 - 始终显示 -->
            <div class="section-header">
              <h3>🏊 线程池与类加载</h3>
            </div>
            
            <!-- 线程池关键指标 -->
            <el-row :gutter="16" style="margin-bottom: 20px;" v-if="hasThreadPoolData">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🏊 线程池总数</div>
                  <div class="stat-value">{{ threadPoolCount }}</div>
                  <div class="stat-subtitle">活跃池</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚡ 平均活跃度</div>
                  <div class="stat-value" :class="threadPoolActivityStatus">{{ threadPoolActivityRate }}</div>
                  <div class="stat-subtitle">活跃/总线程</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📦 队列积压</div>
                  <div class="stat-value" :class="queueBacklogStatus">{{ queueBacklogValue }}</div>
                  <div class="stat-subtitle">待处理任务</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">❌ 拒绝次数</div>
                  <div class="stat-value" :class="rejectedCountStatus">{{ rejectedTaskCount }}</div>
                  <div class="stat-subtitle">任务被拒</div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 类加载关键指标 -->
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📦 已加载类</div>
                  <div class="stat-value">{{ loadedClassCount }}</div>
                  <div class="stat-subtitle">当前数量</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📈 类加载速率</div>
                  <div class="stat-value">{{ classLoadingRateValue }}</div>
                  <div class="stat-subtitle">个/秒</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🗑️ 已卸载类</div>
                  <div class="stat-value">{{ unloadedClassCount }}</div>
                  <div class="stat-subtitle">累计数量</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚠️ 加载异常</div>
                  <div class="stat-value" :class="classLoadErrorStatus">{{ classLoadErrorCount }}</div>
                  <div class="stat-subtitle">异常次数</div>
                </el-card>
              </el-col>
            </el-row>
            
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
            <!-- IO/网络关键指标卡片 -->
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📈 最大读取速率</div>
                  <div class="stat-value">{{ maxDiskReadRate }}</div>
                  <div class="stat-subtitle">峰值时刻</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📉 最大写入速率</div>
                  <div class="stat-value">{{ maxDiskWriteRate }}</div>
                  <div class="stat-subtitle">峰值时刻</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🌐 平均接收速率</div>
                  <div class="stat-value">{{ avgNetworkRecvRate }}</div>
                  <div class="stat-subtitle">总体平均</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">📡 平均发送速率</div>
                  <div class="stat-value">{{ avgNetworkSentRate }}</div>
                  <div class="stat-subtitle">总体平均</div>
                </el-card>
              </el-col>
            </el-row>
            <el-row :gutter="16" style="margin-bottom: 20px;">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">💾 磁盘IO压力</div>
                  <div class="stat-value" :class="diskIoPressureStatus">{{ diskIoPressureIndex }}</div>
                  <div class="stat-subtitle">0-100分</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🌐 网络流量负载</div>
                  <div class="stat-value" :class="networkLoadStatus">{{ networkLoadIndex }}</div>
                  <div class="stat-subtitle">0-100分</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">⚡ IO延迟指数</div>
                  <div class="stat-value" :class="ioLatencyIndexStatus">{{ ioLatencyIndexValue }}</div>
                  <div class="stat-subtitle">综合评估</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">🎯 IO健康度</div>
                  <div class="stat-value" :class="ioHealthStatus">{{ ioHealthScore }}</div>
                  <div class="stat-subtitle">综合评分</div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 磁盘I/O监控 - 始终渲染图表容器，由JS决定是否显示数据 -->
            <div class="section-header">
              <h3>💾 磁盘I/O速率</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="diskIoRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 磁盘I/O操作次数 -->
            <div class="section-header">
              <h3>📊 磁盘I/O操作次数</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="diskIoOpsRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 网络流量监控 -->
            <div class="section-header">
              <h3>🌐 网络流量监控</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="networkTrafficRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 综合分析：IO与CPU/内存关联 -->
            <div class="section-header">
              <h3> 综合性能分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="ioCpuCorrelationRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- IO操作热力图 -->
            <div class="section-header">
              <h3>🔥 IO操作热力图</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="ioHeatmapRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 智能IO性能分析 -->
            <div class="section-header">
              <h3>🧠 智能IO性能分析</h3>
            </div>
            <el-card shadow="hover" style="margin-bottom: 20px;">
              <div class="io-analysis-panel">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">📊</span>
                      <div class="analysis-content">
                        <div class="analysis-label">磁盘IO模式</div>
                        <div class="analysis-value" :class="ioPatternAnalysis.status">{{ ioPatternAnalysis.text }}</div>
                        <div class="analysis-detail">{{ ioPatternAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">⏱️</span>
                      <div class="analysis-content">
                        <div class="analysis-label">平均IO延迟</div>
                        <div class="analysis-value" :class="ioLatencyAnalysis.status">{{ ioLatencyAnalysis.text }}</div>
                        <div class="analysis-detail">{{ ioLatencyAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <el-row :gutter="16" style="margin-top: 16px;">
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">🌐</span>
                      <div class="analysis-content">
                        <div class="analysis-label">网络模式</div>
                        <div class="analysis-value" :class="networkPatternAnalysis.status">{{ networkPatternAnalysis.text }}</div>
                        <div class="analysis-detail">{{ networkPatternAnalysis.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="analysis-item">
                      <span class="analysis-icon">💡</span>
                      <div class="analysis-content">
                        <div class="analysis-label">优化建议</div>
                        <div class="analysis-value suggestion">{{ ioSuggestions[0] }}</div>
                        <div class="analysis-detail">{{ ioSuggestions[1] }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
            
            <!-- IO延迟趋势图 -->
            <div class="section-header">
              <h3>⏱️ IO延迟趋势</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="ioLatencyRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- IO与GC关联分析 -->
            <div class="section-header">
              <h3>🔗 IO与GC关联分析</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="ioGcCorrelationRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 内存分配与IO关联 -->
            <div class="section-header">
              <h3>💾 内存分配与IO关联</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="memoryIoCorrelationRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
            
            <!-- 综合性能评分趋势 -->
            <div class="section-header">
              <h3>⭐ 综合性能评分</h3>
            </div>
            <el-row :gutter="16" class="charts-row">
              <el-col :span="24">
                <div ref="performanceScoreRef" class="chart-box-large"></div>
              </el-col>
            </el-row>
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

        <!-- 系统属性表格 -->
        <div v-else-if="currentDiagType === 'sysProps'" class="chart-container">
          <el-card shadow="never">
            <div class="chart-title">⚙️ 系统属性</div>
            <div style="margin-bottom: 12px;">
              <el-input
                v-model="sysPropsSearch"
                placeholder="搜索属性名或值..."
                clearable
                prefix-icon="Search"
                style="width: 300px;"
              />
              <el-tag style="margin-left: 12px;" type="info">共 {{ filteredSysProps.length }} 项</el-tag>
            </div>
            <el-table :data="filteredSysProps" border stripe size="small" max-height="500">
              <el-table-column prop="key" label="属性名" min-width="250" show-overflow-tooltip></el-table-column>
              <el-table-column prop="value" label="属性值" min-width="300" show-overflow-tooltip></el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 环境变量表格 -->
        <div v-else-if="currentDiagType === 'env'" class="chart-container">
          <el-card shadow="never">
            <div class="chart-title">🌍 环境变量</div>
            <div style="margin-bottom: 12px;">
              <el-input
                v-model="envVarsSearch"
                placeholder="搜索变量名或值..."
                clearable
                prefix-icon="Search"
                style="width: 300px;"
              />
              <el-tag style="margin-left: 12px;" type="info">共 {{ filteredEnvVars.length }} 项</el-tag>
            </div>
            <el-table :data="filteredEnvVars" border stripe size="small" max-height="500">
              <el-table-column prop="key" label="变量名" min-width="250" show-overflow-tooltip></el-table-column>
              <el-table-column prop="value" label="变量值" min-width="300" show-overflow-tooltip></el-table-column>
            </el-table>
          </el-card>
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
    <el-dialog v-model="showConfigDialog" :title="configDialogTitle" width="1100px" top="5vh">
      <!-- 基本信息区域 -->
      <div class="config-info-bar">
        <el-tag :type="configMode === 'app' ? '' : 'success'" size="large">
          {{ configMode === 'app' ? '📦 应用级配置' : '🔧 实例级配置' }}
        </el-tag>
        <span class="config-app-name">{{ currentApp }}</span>
        <span v-if="configMode === 'instance'" class="config-inst-badge">
          <el-tag type="warning" size="small">{{ currentInst }}</el-tag>
        </span>
        <span v-if="fullConfigInfo" class="config-version-tag">
          <el-tag type="info" size="small">版本: {{ fullConfigInfo.finalVersion }}</el-tag>
        </span>
      </div>
      
      <!-- 配置来源选择 -->
      <el-tabs v-model="configSourceTab" type="border-card" class="config-tabs">
        <el-tab-pane name="database">
          <template #label>
            <span class="tab-label">
              <el-icon><Document /></el-icon>
              数据库配置
            </span>
          </template>
          
          <div class="config-section">
            <el-alert
              title="💾 数据库存储配置"
              description="Agent 会在下次心跳时拉取并应用此配置。修改后立即生效，无需重启应用。"
              type="info"
              :closable="false"
              show-icon
              class="config-alert"
            />
            
            <div class="editor-toolbar">
              <el-button-group>
                <el-button size="small" @click="formatConfig">
                  <el-icon><MagicStick /></el-icon>
                  格式化
                </el-button>
                <el-button size="small" @click="clearConfig">
                  <el-icon><Delete /></el-icon>
                  清空
                </el-button>
              </el-button-group>
              <el-button size="small" type="primary" @click="submitConfig" :loading="submitting">
                <el-icon><Upload /></el-icon>
                保存配置
              </el-button>
            </div>
            
            <el-input 
              type="textarea" 
              v-model="dbConfigContent" 
              :rows="20" 
              placeholder="# 请输入 YAML 格式的配置内容\nsampling:\n  rate: 1000\nplugins:\n  jdbc:\n    enabled: true"
              class="config-editor"
            />
            
            <div class="config-footer-hint">
              <el-text type="info" size="small">
                📝 配置内容需符合 YAML 格式规范，Agent 会自动解析并应用
              </el-text>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane name="runtime">
          <template #label>
            <span class="tab-label">
              <el-icon><Monitor /></el-icon>
              Agent运行时
            </span>
          </template>
          
          <div class="config-section">
            <el-alert
              :title="agentRuntimeConfig ? '✅ Agent 本地配置文件' : '⚠️ 无法获取 Agent 运行时配置'"
              :description="agentRuntimeConfig ? '这是 Agent 进程读取的配置文件内容（仅供参考）。如需修改，请在「数据库配置」标签页编辑，Agent 会在下次心跳时拉取。' : '请确保 Agent 在线且已连接。检查 Agent 状态或网络连接。'"
              :type="agentRuntimeConfig ? 'success' : 'warning'"
              :closable="false"
              show-icon
              class="config-alert"
            />
            
            <el-input 
              type="textarea" 
              v-model="agentRuntimeConfig" 
              :rows="20" 
              readonly
              placeholder="加载中..."
              class="config-editor"
            />
            
            <div class="config-footer-hint">
              <el-text type="info" size="small">
                ℹ️ 此配置为只读，反映 Agent 当前使用的配置。如需修改，请切换到「数据库配置」标签页
              </el-text>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane name="full">
          <template #label>
            <span class="tab-label">
              <el-icon><List /></el-icon>
              完整配置
            </span>
          </template>
          
          <div class="config-section">
            <el-alert
              title="📊 完整配置信息"
              description="展示应用配置、实例配置以及合并后的最终配置。Agent 实际生效的是最终配置。"
              type="success"
              :closable="false"
              show-icon
              class="config-alert"
            />
            
            <template v-if="fullConfigInfo">
              <!-- 应用级配置 -->
              <div class="config-block">
                <div class="config-block-header">
                  <el-tag type="" effect="plain">
                    <el-icon><Box /></el-icon>
                    应用级配置
                  </el-tag>
                  <el-tag type="info" size="small">{{ fullConfigInfo.appConfigVersion }}</el-tag>
                </div>
                <el-input 
                  type="textarea" 
                  :model-value="fullConfigInfo.appConfig || '# 暂无应用配置'" 
                  :rows="6" 
                  readonly
                  class="config-block-content"
                />
              </div>
              
              <!-- 实例级配置 -->
              <div v-if="configMode === 'instance'" class="config-block">
                <div class="config-block-header">
                  <el-tag type="warning" effect="plain">
                    <el-icon><Tools /></el-icon>
                    实例级配置
                  </el-tag>
                  <el-tag type="info" size="small">{{ fullConfigInfo.instanceConfigVersion }}</el-tag>
                </div>
                <el-input 
                  type="textarea" 
                  :model-value="fullConfigInfo.instanceConfig || '# 暂无实例配置'" 
                  :rows="6" 
                  readonly
                  class="config-block-content"
                />
              </div>
              
              <!-- 合并后的最终配置 -->
              <div class="config-block config-block-highlight">
                <div class="config-block-header">
                  <el-tag type="success" effect="plain">
                    <el-icon><Check /></el-icon>
                    合并后的最终配置
                  </el-tag>
                  <el-tag type="success" size="small">{{ fullConfigInfo.finalVersion }}</el-tag>
                </div>
                <el-alert
                  :description="configMode === 'instance' ? '实例配置会覆盖应用配置中的相同字段，优先级：实例配置 > 应用配置' : '当前只有应用级配置，无实例配置覆盖'"
                  type="success"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 10px"
                />
                <el-input 
                  type="textarea" 
                  :model-value="fullConfigInfo.mergedConfig || '# 无配置'" 
                  :rows="10" 
                  readonly
                  class="config-block-content"
                />
              </div>
            </template>
            
            <div v-else class="loading-state">
              <el-skeleton :rows="10" animated />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-text type="info" size="small">
              💡 提示: 修改配置后，Agent 会在下次心跳时自动拉取并应用
            </el-text>
          </div>
          <div class="footer-right">
            <el-button @click="showConfigDialog = false">取消</el-button>
            <el-button @click="syncFromRuntime" :disabled="!agentRuntimeConfig">
              <el-icon><RefreshRight /></el-icon>
              从运行时同步
            </el-button>
            <el-button type="primary" @click="submitConfig" :loading="submitting">
              <el-icon><Check /></el-icon>
              确认保存
            </el-button>
          </div>
        </div>
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
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, CircleClose, Bell, ArrowDown, Setting, Document, Monitor, List, Box, Tools, Check, MagicStick, Delete, Upload, RefreshRight, Search, DataAnalysis } from '@element-plus/icons-vue'
import type { Application, Project } from '../../api/project'
import {
  agentThreadDump,
  agentJvmInfo,
  agentGc,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentDeadlocks,
  agentSysProps,
  agentEnv,
  getMemoryHistory
} from '../../api/agent'

// 导入 Composables
import { useApplicationManagement } from '../composables/useApplicationManagement'
import { useAgentInstances } from '../composables/useAgentInstances'
import { useDiagnosis } from '../composables/useDiagnosis'
import { useMemoryMonitoring } from '../composables/useMemoryMonitoring'
import { useConfigManagement } from '../composables/useConfigManagement'
import { useGcAnalysis } from '../composables/useGcAnalysis'
import { useThreadMonitoring } from '../composables/useThreadMonitoring'
import { useIoNetworkMonitoring } from '../composables/useIoNetworkMonitoring'

// ==================== Tab 状态 ====================
const activeTab = ref('definition')

// ==================== 应用管理 ====================
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

// ==================== Agent 实例监控 ====================
const agentInst = useAgentInstances()
const { 
  instances, 
  instancesLoading, 
  onlineCount, 
  offlineCount, 
  alertedCount,
  loadInstances,
  isAlerted,
  formatTimestamp
} = agentInst

// ==================== JVM 诊断 ====================
const diagnosis = useDiagnosis()
const {
  showDiagDialog,
  diagDialogTitle,
  diagResult,
  diagMode,
  currentDiagType,
  currentDiagRow,
  jvmData,
  gcData,
  threadsData,
  canShowChart,
  executeDiagCommand,
  copyDiagResult,
  switchToTextMode,
  switchToChartMode,
  // refreshHistoryChart 在下方重新定义，以添加渲染逻辑
  parseJvmData,
  parseMemoryData,
  parseGcData,
  parseThreadsData
} = diagnosis

// 注意：handleDiagCommand 和 refreshHistoryChart 在下方重新定义，以添加渲染逻辑

// ==================== 内存监控 ====================
const memoryMon = useMemoryMonitoring()
const {
  memoryTab,
  historyTimeRange,
  historyLoading,
  memoryHistory,
  enableRealtime,
  pollingInterval,
  enableAutoRefresh,
  autoRefreshInterval,
  heapChartRef,
  nonHeapChartRef,
  youngGenChartRef,
  oldGenChartRef,
  gcCountChartRef,
  gcDurationChartRef,
  threadChartRef,
  classLoadingChartRef,
  cpuChartRef,
  memoryPoolsGridRef,
  heapUsagePercent,
  heapUsageStatus,
  nonHeapUsagePercent,
  nonHeapUsageStatus,
  youngGenUsagePercent,
  youngGenUsageStatus,
  oldGenUsagePercent,
  oldGenUsageStatus,
  memoryGrowthRate,
  memoryGrowthStatus,
  gcPressureIndex,
  gcPressureStatus,
  leakRiskLevel,
  leakRiskStatus,
  memoryHealthScore,
  memoryHealthStatus,
  loadMemoryHistory,
  toggleRealtime,
  toggleAutoRefresh,
  renderMemoryCharts,
  formatBytes,
  getProgressColor,
  cleanup: cleanupMemory
} = memoryMon

// 额外的图表 ref（必须在组件中直接定义，Vue 才能自动绑定 DOM）
const edenSurvivorChartRef = ref<HTMLElement>()
const oldGenChartDetailRef = ref<HTMLElement>()
const metaspaceChartRef = ref<HTMLElement>()
const codeCacheChartRef = ref<HTMLElement>()
const memoryAllocationRateChartRef = ref<HTMLElement>()
const gcPressureChartRef = ref<HTMLElement>()
const gcReclaimedChartRef = ref<HTMLElement>()
const cpuMemoryCorrelationChartRef = ref<HTMLElement>()
const topCpuThreadChartRef = ref<HTMLElement>()
const threadStateChartRef = ref<HTMLElement>()
const performanceDashboardChartRef = ref<HTMLElement>()

// ==================== GC 分析 ====================
const gcAnalysis = useGcAnalysis()
const {
  minorVsFullGcChartRef,
  gcEfficiencyChartRef,
  totalGcCount,
  totalGcTime,
  avgGcTime,
  fullGcRatio,
  gcEfficiency,
  maxGcDuration,
  gcHealthScore,
  renderGcCharts,
  cleanup: cleanupGc
} = gcAnalysis

// ==================== 线程监控 ====================
const threadMon = useThreadMonitoring()
const {
  threadStatesChartRef,
  classLoadingDetailChartRef,
  threadPoolsChartRef,
  maxThreadCountValue,
  avgThreadCount,
  blockedRatioText,
  daemonRatioText,
  threadCreationRateValue,
  hasThreadPoolData,
  renderThreadCharts,
  formatNanoTime,
  cleanup: cleanupThread
} = threadMon

// ==================== IO/网络监控 ====================
const ioNetworkMon = useIoNetworkMonitoring()
const {
  diskIoRef,
  networkTrafficRef,
  avgDiskReadRate,
  avgDiskWriteRate,
  maxDiskReadRate,
  maxDiskWriteRate,
  avgNetworkRecvRate,
  avgNetworkSentRate,
  ioPatternAnalysis,
  ioLatencyAnalysis,
  networkPatternAnalysis,
  renderIoNetworkCharts,
  cleanup: cleanupIo
} = ioNetworkMon

// ==================== 配置管理 ====================
const configMgmt = useConfigManagement()
const {
  showConfigDialog,
  configMode,
  currentApp,
  currentInst,
  dbConfigContent,
  agentRuntimeConfig,
  fullConfigInfo,
  submitting,
  configSourceTab,
  activeCollapsePanels,
  configDialogTitle,
  openConfigDialog,
  loadConfigs,
  formatConfig,
  clearConfig,
  syncFromRuntime,
  submitConfig
} = configMgmt

// ==================== 计算属性 - 从 memoryHistory 派生 ====================
const latestHeapPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.heapMax > 0 ? Math.round((latest.heapUsed / latest.heapMax) * 100) : 0
})

const latestCpuPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.processCpuLoad ? Math.round(latest.processCpuLoad * 100) : 0
})

const latestThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].threadCount || 0
})

const maxThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return Math.max(...memoryHistory.value.map(m => m.threadCount || 0))
})

const gcFrequency = computed(() => {
  if (memoryHistory.value.length < 2) return '0'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
  const gcDiff = last.gcCount - first.gcCount
  return timeDiffMinutes > 0 ? (gcDiff / timeDiffMinutes).toFixed(1) : '0'
})

const avgGcTimeStatus = computed(() => {
  const time = parseFloat(avgGcTime.value) || 0
  if (time < 50) return 'success'
  if (time < 100) return 'warning'
  return 'danger'
})

const fullGcRatioStatus = computed(() => {
  const ratio = parseFloat(fullGcRatio.value) || 0
  if (ratio < 5) return 'success'
  if (ratio < 15) return 'warning'
  return 'danger'
})

const gcEfficiencyStatus = computed(() => {
  const eff = parseFloat(gcEfficiency.value) || 0
  if (eff > 80) return 'success'
  if (eff > 60) return 'warning'
  return 'danger'
})

const gcHealthStatus = computed(() => {
  const score = parseInt(gcHealthScore.value) || 0
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
})

const gcModeAnalysis = computed(() => {
  if (memoryHistory.value.length === 0) {
    return { status: 'info', text: '数据不足', detail: '无法分析GC模式' }
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  
  if (total === 0) {
    return { status: 'info', text: '无GC活动', detail: '当前时间段内没有发生GC' }
  }
  
  const fullRatio = full / total
  if (fullRatio < 0.05) {
    return { status: 'success', text: 'Minor GC为主', detail: `Full GC占比${(fullRatio * 100).toFixed(1)}%，GC策略正常` }
  } else if (fullRatio < 0.15) {
    return { status: 'warning', text: 'Full GC偏多', detail: `Full GC占比${(fullRatio * 100).toFixed(1)}%，建议调整堆大小` }
  } else {
    return { status: 'danger', text: 'Full GC过多', detail: `Full GC占比${(fullRatio * 100).toFixed(1)}%，存在内存问题` }
  }
})

const hasBufferPoolsData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  return !!memoryHistory.value[memoryHistory.value.length - 1].bufferPools
})

const hasPhysicalMemoryData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  return !!memoryHistory.value[0].totalPhysicalMemory
})

const jvmStartTimeStr = computed(() => {
  if (!jvmData.value.startTimeMs) return '-'
  return new Date(jvmData.value.startTimeMs).toLocaleString('zh-CN')
})

const jvmUptimeStr = computed(() => {
  if (!jvmData.value.uptimeMs) return '-'
  const hours = Math.floor(jvmData.value.uptimeMs / 3600000)
  const minutes = Math.floor((jvmData.value.uptimeMs % 3600000) / 60000)
  return `${hours}小时 ${minutes}分钟`
})

const latestPeakThreadCount = computed(() => jvmData.value.peakThreadCount || '-')
const latestDaemonThreadCount = computed(() => jvmData.value.daemonThreadCount || '-')
const latestTotalLoadedClass = computed(() => jvmData.value.totalLoadedClassCount || '-')
const latestUnloadedClass = computed(() => jvmData.value.unloadedClassCount || '-')
const latestMinorGcCount = computed(() => gcData.value.collectors?.find(c => c.name.includes('Young'))?.count || '-')
const latestFullGcCount = computed(() => gcData.value.collectors?.find(c => c.name.includes('Old'))?.count || '-')

const topCpuThreadsTable = computed(() => {
  // TODO: 从 threadsData 中提取 Top CPU 线程
  return []
})

// ==================== 方法 ====================

// 处理诊断命令（覆盖 Composable 中的版本，添加渲染逻辑）
const handleDiagCommand = async (command: string, row: any) => {
  const agentId = `${row.app}@${row.inst}`
  currentDiagRow.value = row

  switch (command) {
    case 'config':
      // 配置管理 - 由父组件处理
      break
    case 'instanceConfig':
      // 实例配置 - 由父组件处理
      break
    case 'memoryChart':
      await showMemoryHistoryChart(row)
      break
    case 'gcChart':
      await showGcHistoryChart(row)
      break
    case 'threadChart':
      await showThreadHistoryChart(row)
      break
    case 'ioNetworkChart':
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
          { confirmButtonText: '确定执行', cancelButtonText: '取消', type: 'warning' }
        )
        await executeDiagCommand('执行GC', () => agentGc(agentId))
      } catch (e: any) {
        if (e !== 'cancel') ElMessage.error('操作失败')
      }
      break
    case 'sysProps':
      await executeDiagCommand('系统属性', () => agentSysProps(agentId), 'sysProps')
      break
    case 'env':
      await executeDiagCommand('环境变量', () => agentEnv(agentId), 'env')
      break
  }
}

// 刷新历史图表（覆盖 Composable 中的版本）
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

// 显示内存历史监控图表（覆盖 Composable 中的版本，添加渲染逻辑）
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
    const startTime = endTime - historyTimeRange.value * 3600 * 1000
    
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    
    if (data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 如果不是刷新，等待 Dialog 打开后再渲染
    if (!refresh) {
      // Dialog 打开后会触发 handleDialogOpened
      console.log('⏳ 等待 Dialog 打开...')
    } else {
      // 刷新时直接渲染
      renderChartsAfterDialogOpen()
    }
    
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

// Dialog 打开后的回调
const handleDialogOpened = () => {
  console.log('✅ Dialog 已打开')
  
  // 根据当前诊断类型渲染对应的图表
  if (currentDiagType.value === 'memoryChart') {
    renderChartsAfterDialogOpen()
  }
}

// 在 Dialog 打开后渲染图表
const renderChartsAfterDialogOpen = () => {
  console.log('🎨 开始渲染图表...')
  
  // 强制切换到 history Tab
  memoryTab.value = 'history'
  
  // 等待足够长的时间让 Element Plus 渲染所有内容
  setTimeout(() => {
    console.log('⏰ 开始渲染图表（不检查 DOM）...')
    
    // 直接渲染，让 Composable 中的 querySelector 备用方案处理
    renderMemoryCharts()
    renderGcCharts(memoryHistory.value)
    
    console.log('✅ 所有图表渲染完成')
  }, 2000) // 等待 2 秒
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
      diagResult.value = '暂无历史数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 渲染GC图表
    setTimeout(() => {
      gcAnalysis.renderGcCharts(memoryHistory.value)
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
      diagResult.value = '暂无历史数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 渲染线程图表
    setTimeout(() => {
      threadMon.renderThreadCharts(memoryHistory.value)
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
      diagResult.value = '暂无历史数据'
      return
    }
    
    memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
    diagResult.value = 'loaded'
    
    // 渲染IO/网络图表
    setTimeout(() => {
      ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
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

// 格式化持续时间
const formatDuration = (ms: number): string => {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天 ${hours % 24}小时`
  if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`
  return `${seconds}秒`
}

// 获取使用率级别
const getUsageLevel = (percent: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (percent < 60) return 'success'
  if (percent < 80) return 'warning'
  return 'danger'
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadData()
  if (activeTab.value === 'instances') {
    loadInstances()
  }
})

onUnmounted(() => {
  // 清理所有图表实例和定时器
  cleanupMemory()
  cleanupGc()
  cleanupThread()
  cleanupIo()
})

// 监听 Tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'instances' && instances.value.length === 0) {
    loadInstances()
  }
  
  // 切换到非历史趋势Tab时，暂停实时监控
  if (newTab !== 'history' && enableRealtime.value) {
    toggleRealtime(false)
    ElMessage.info('已离开历史趋势页面，实时监控已暂停')
  }
})

// 监听诊断类型变化，渲染对应图表
watch(currentDiagType, (newType) => {
  if (newType && memoryHistory.value.length > 0) {
    setTimeout(() => {
      if (newType === 'memory' || newType === 'memoryChart') {
        renderMemoryCharts()
      } else if (newType === 'gcChart') {
        gcAnalysis.renderGcCharts(memoryHistory.value)
      } else if (newType === 'threadChart') {
        threadMon.renderThreadCharts(memoryHistory.value)
      } else if (newType === 'ioNetworkChart') {
        ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
      }
    }, 300)
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

/* IO智能分析面板样式 */
.io-analysis-panel {
  padding: 16px 0;
}

.analysis-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.analysis-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-icon {
  font-size: 28px;
  margin-right: 12px;
  line-height: 1;
}

.analysis-content {
  flex: 1;
}

.analysis-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  font-weight: 500;
}

.analysis-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.analysis-value.success {
  color: #67c23a;
}

.analysis-value.warning {
  color: #e6a23c;
}

.analysis-value.danger {
  color: #f56c6c;
}

.analysis-value.info {
  color: #909399;
}

.analysis-value.suggestion {
  color: #409eff;
  font-size: 14px;
}

.analysis-detail {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

/* 配置管理对话框样式 */
.config-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.config-app-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.config-inst-badge {
  margin-left: 8px;
}

.config-version-tag {
  margin-left: auto;
}

.config-tabs {
  min-height: 600px;
}

.config-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.config-tabs :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-section {
  padding: 0 4px;
}

.config-alert {
  margin-bottom: 16px;
  border-radius: 8px;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
}

.config-editor {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

.config-editor :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

.config-footer-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.config-block {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.config-block:hover {
  border-color: #c0c4cc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.config-block-highlight {
  border: 2px solid #67c23a;
  background: #f0f9ff;
}

.config-block-highlight:hover {
  border-color: #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.config-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.config-block-header .el-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-block-content {
  margin: 0;
}

.config-block-content :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.loading-state {
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 12px;
}

.footer-right .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
