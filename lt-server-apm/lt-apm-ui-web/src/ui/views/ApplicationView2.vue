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
          <JvmInfoView :jvm-data="jvmData" />
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
                  <el-button type="success" @click="refreshCharts">🔄 刷新图表</el-button>
                  
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
                  
                  <!-- GC Advanced Analysis Section (已移至 memoryChart 和 gcChart 页面) -->
                  
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
        <div v-show="currentDiagType === 'memoryChart'" class="chart-container" :key="'memoryChart'">
          <MemoryMonitoringView
            :memory-history="memoryHistory"
            :history-time-range="historyTimeRange"
            :history-loading="historyLoading"
            :enable-auto-refresh="enableAutoRefresh"
            :auto-refresh-interval="autoRefreshInterval"
            @refresh="refreshHistoryChart"
            @auto-refresh-toggle="toggleAutoRefresh"
            @update:history-time-range="(val) => historyTimeRange = val"
            @update:enable-auto-refresh="(val) => enableAutoRefresh = val"
            @update:auto-refresh-interval="(val) => autoRefreshInterval = val"
          />
        </div>

        <!-- GC分析历史趋势 -->
        <div v-show="currentDiagType === 'gcChart'" class="chart-container" :key="'gcChart'">
          <GcAnalysisView
            :memory-history="memoryHistory"
            :history-time-range="historyTimeRange"
            :history-loading="historyLoading"
            :enable-auto-refresh="enableAutoRefresh"
            :auto-refresh-interval="autoRefreshInterval"
            :total-gc-count-value="totalGcCountValue"
            :total-gc-time-value="totalGcTimeValue"
            :gc-frequency-value="gcFrequencyValue"
            :avg-gc-time-value="avgGcTimeValue"
            :avg-gc-time-status="avgGcTimeStatus"
            :full-gc-ratio-value="fullGcRatioValue"
            :full-gc-ratio-status="fullGcRatioStatus"
            :gc-efficiency-value="gcEfficiencyValue"
            :max-gc-duration-value="maxGcDurationValue"
            :gc-health-score-value="gcHealthScoreValue"
            :gc-health-status="gcHealthStatus"
            :jvm-start-time-str="jvmStartTimeStr"
            :jvm-uptime-str="jvmUptimeStr"
            :latest-peak-thread-count="latestPeakThreadCount"
            :latest-daemon-thread-count="latestDaemonThreadCount"
            :latest-total-loaded-class="latestTotalLoadedClass"
            :latest-unloaded-class="latestUnloadedClass"
            :latest-minor-gc-count="latestMinorGcCount"
            :latest-full-gc-count="latestFullGcCount"
            @refresh="refreshHistoryChart"
            @auto-refresh-toggle="toggleAutoRefresh"
            @update:history-time-range="(val) => historyTimeRange = val"
            @update:enable-auto-refresh="(val) => enableAutoRefresh = val"
            @update:auto-refresh-interval="(val) => autoRefreshInterval = val"
          />
        </div>

        <!-- 线程监控历史趋势 -->
        <div v-show="currentDiagType === 'threadChart'" class="chart-container" :key="'threadChart'">
          <ThreadMonitoringView
            :memory-history="memoryHistory"
            :history-time-range="historyTimeRange"
            :history-loading="historyLoading"
            :enable-auto-refresh="enableAutoRefresh"
            :auto-refresh-interval="autoRefreshInterval"
            :jvm-start-time-str="jvmStartTimeStr"
            :jvm-uptime-str="jvmUptimeStr"
            :latest-peak-thread-count="latestPeakThreadCount"
            :latest-daemon-thread-count="latestDaemonThreadCount"
            :latest-total-loaded-class="latestTotalLoadedClass"
            :latest-unloaded-class="latestUnloadedClass"
            :latest-minor-gc-count="latestMinorGcCount"
            :latest-full-gc-count="latestFullGcCount"
            @refresh="refreshHistoryChart"
            @auto-refresh-toggle="toggleAutoRefresh"
            @update:history-time-range="(val) => historyTimeRange = val"
            @update:enable-auto-refresh="(val) => enableAutoRefresh = val"
            @update:auto-refresh-interval="(val) => autoRefreshInterval = val"
          />
        </div>

        <!-- IO/网络监控历史趋势 -->
        <div v-show="currentDiagType === 'ioNetworkChart'" class="chart-container" :key="'ioNetworkChart'">
          <IoNetworkView
            :memory-history="memoryHistory"
            :history-time-range="historyTimeRange"
            :history-loading="historyLoading"
            :enable-auto-refresh="enableAutoRefresh"
            :auto-refresh-interval="autoRefreshInterval"
            @refresh="refreshHistoryChart"
            @auto-refresh-toggle="toggleAutoRefresh"
            @update:history-time-range="(val) => historyTimeRange = val"
            @update:enable-auto-refresh="(val) => enableAutoRefresh = val"
            @update:auto-refresh-interval="(val) => autoRefreshInterval = val"
          />
        </div>

        <!-- GC统计图表 -->
        <div v-show="currentDiagType === 'gcStats'" class="chart-container" :key="'gcStats'">
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
        <div v-show="currentDiagType === 'threadsSummary'" class="chart-container" :key="'threadsSummary'">
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
        <div v-show="currentDiagType === 'sysProps'" class="chart-container" :key="'sysProps'">
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
        <div v-show="currentDiagType === 'env'" class="chart-container" :key="'env'">
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
        <div v-show="!['memoryChart', 'gcChart', 'threadChart', 'ioNetworkChart', 'gcStats', 'threadsSummary', 'sysProps', 'env'].includes(currentDiagType)" class="text-mode" :key="'text'">
          <el-input v-model="diagResult" type="textarea" :rows="25" readonly />
        </div>
      </div>

      <!-- 文本模式 -->
      <div v-show="diagMode === 'text'" class="diag-text-content" :key="'text-mode'">
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
import * as echarts from 'echarts'
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

// 导入监控视图组件
import {
  MemoryMonitoringView,
  ThreadMonitoringView,
  GcAnalysisView,
  IoNetworkView,
  JvmInfoView
} from './monitoring'

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

// ==================== 系统属性和环境变量搜索 ====================
const sysPropsSearch = ref('')
const envVarsSearch = ref('')
const filteredSysProps = computed(() => [])
const filteredEnvVars = computed(() => [])

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

// ==================== GC 分析 ====================
const gcAnalysis = useGcAnalysis()
const {
  renderGcCharts,
  cleanup: cleanupGc
} = gcAnalysis

// 将GC分析函数转换为直接使用 memoryHistory 的计算属性
const totalGcCountValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const total = (latest.minorGcCount || 0) + (latest.fullGcCount || 0)
  return total > 0 ? `${total} 次` : '0 次'
})

const totalGcTimeValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const total = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
  return total > 0 ? `${total} ms` : '0 ms'
})

const gcFrequencyValue = computed(() => {
  if (memoryHistory.value.length < 2) return '-'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const durationHours = (last.collectTime - first.collectTime) / 3600000
  if (durationHours === 0) return '-'
  const totalGc = (last.minorGcCount || 0) + (last.fullGcCount || 0)
  return (totalGc / durationHours).toFixed(1) + ' 次/小时'
})

const avgGcTimeValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const totalGcTime = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
  const totalGcCount = (latest.minorGcCount || 0) + (latest.fullGcCount || 0)
  if (totalGcCount === 0) return '0 ms'
  const avg = totalGcTime / totalGcCount
  return avg.toFixed(1) + ' ms'
})

const avgGcTimeStatus = computed(() => {
  const avg = parseFloat(avgGcTimeValue.value) || 0
  if (avg < 50) return 'success'
  if (avg < 100) return 'warning'
  return 'danger'
})

const fullGcRatioValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  if (total === 0) return '0%'
  return ((full / total) * 100).toFixed(1) + '%'
})

const fullGcRatioStatus = computed(() => {
  const ratio = parseFloat(fullGcRatioValue.value) || 0
  if (ratio < 5) return 'success'
  if (ratio < 15) return 'warning'
  return 'danger'
})

const gcEfficiencyValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  if (total === 0) return '0%'
  return ((minor / total) * 100).toFixed(1) + '%'
})

const gcEfficiencyStatus = computed(() => {
  const efficiency = parseFloat(gcEfficiencyValue.value) || 0
  if (efficiency > 85) return 'success'
  if (efficiency > 70) return 'warning'
  return 'danger'
})

const maxGcDurationValue = computed(() => {
  if (memoryHistory.value.length < 2) return '-'
  let maxDuration = 0
  for (let i = 1; i < memoryHistory.value.length; i++) {
    const gcTimeDiff = (memoryHistory.value[i].gcTimeMs || 0) - (memoryHistory.value[i-1].gcTimeMs || 0)
    if (gcTimeDiff > maxDuration) {
      maxDuration = gcTimeDiff
    }
  }
  return maxDuration > 0 ? `${maxDuration} ms` : '0 ms'
})

const gcHealthScoreValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  let score = 100
  
  // Full GC占比扣分
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  if (total > 0) {
    const fullRatio = full / total
    if (fullRatio > 0.3) score -= 30
    else if (fullRatio > 0.15) score -= 15
    else if (fullRatio > 0.05) score -= 5
  }
  
  // GC频率扣分
  const gcFreq = parseFloat(gcFrequencyValue.value) || 0
  if (gcFreq > 60) score -= 20
  else if (gcFreq > 30) score -= 10
  
  // 平均GC耗时扣分
  const avgTime = parseFloat(avgGcTimeValue.value) || 0
  if (avgTime > 100) score -= 20
  else if (avgTime > 50) score -= 10
  
  score = Math.max(0, Math.min(100, score))
  return `${score}分`
})

const gcHealthStatus = computed(() => {
  const score = parseInt(gcHealthScoreValue.value) || 0
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
})

// ==================== 线程监控 ====================
const threadMon = useThreadMonitoring()
const {
  threadChartRef,
  classLoadingChartRef,
  cpuChartRef,
  threadStatesChartRef,
  classLoadingDetailChartRef,
  threadPoolsChartRef,
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

// 线程池相关计算属性
const threadPoolCount = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.threadPools) return '-'
  try {
    const pools = JSON.parse(latest.threadPools)
    return pools.length || 0
  } catch (e) {
    return '-'
  }
})

const threadPoolActivityRate = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.threadPools) return '-'
  try {
    const pools = JSON.parse(latest.threadPools)
    if (!pools || pools.length === 0) return '-'
    let totalActive = 0
    let totalThreads = 0
    pools.forEach((pool: any) => {
      totalActive += pool.activeCount || 0
      totalThreads += pool.poolSize || 0
    })
    if (totalThreads === 0) return '-'
    return ((totalActive / totalThreads) * 100).toFixed(1) + '%'
  } catch (e) {
    return '-'
  }
})

const threadPoolActivityStatus = computed(() => {
  const rate = parseFloat(threadPoolActivityRate.value) || 0
  if (rate < 50) return 'success'
  if (rate < 80) return 'warning'
  return 'danger'
})

const queueBacklogValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.threadPools) return '-'
  try {
    const pools = JSON.parse(latest.threadPools)
    if (!pools || pools.length === 0) return '-'
    let totalQueue = 0
    pools.forEach((pool: any) => {
      totalQueue += pool.queueSize || 0
    })
    return totalQueue > 0 ? totalQueue : '0'
  } catch (e) {
    return '-'
  }
})

const queueBacklogStatus = computed(() => {
  const backlog = parseInt(queueBacklogValue.value) || 0
  if (backlog === 0) return 'success'
  if (backlog < 100) return 'warning'
  return 'danger'
})

const rejectedTaskCount = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.threadPools) return '-'
  try {
    const pools = JSON.parse(latest.threadPools)
    if (!pools || pools.length === 0) return '-'
    let totalRejected = 0
    pools.forEach((pool: any) => {
      totalRejected += pool.rejectedCount || 0
    })
    return totalRejected > 0 ? totalRejected : '0'
  } catch (e) {
    return '-'
  }
})

const rejectedCountStatus = computed(() => {
  const rejected = parseInt(rejectedTaskCount.value) || 0
  if (rejected === 0) return 'success'
  if (rejected < 10) return 'warning'
  return 'danger'
})

// 类加载相关计算属性
const loadedClassCount = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  return memoryHistory.value[memoryHistory.value.length - 1].loadedClassCount || '-'
})

const classLoadingRateValue = computed(() => {
  if (memoryHistory.value.length < 2) return '-'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const durationSeconds = (last.collectTime - first.collectTime) / 1000
  if (durationSeconds === 0) return '-'
  const classDiff = (last.loadedClassCount || 0) - (first.loadedClassCount || 0)
  return (classDiff / durationSeconds).toFixed(1)
})

const unloadedClassCount = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  return memoryHistory.value[memoryHistory.value.length - 1].unloadedClassCount || '-'
})

const classLoadErrorCount = computed(() => {
  // 当前数据模型中没有类加载错误字段，返回0
  return '0'
})

const classLoadErrorStatus = computed(() => 'success')

// 线程监控相关计算属性
const maxThreadCountValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  let maxCount = 0
  for (let i = 0; i < memoryHistory.value.length; i++) {
    const count = memoryHistory.value[i].threadCount || 0
    if (count > maxCount) maxCount = count
  }
  return maxCount > 0 ? `${maxCount} 线程` : '0 线程'
})

const avgThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const total = memoryHistory.value.reduce((sum, m) => sum + (m.threadCount || 0), 0)
  const avg = total / memoryHistory.value.length
  return `${Math.round(avg)} 线程`
})

const daemonRatioText = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const daemon = latest.daemonThreadCount || 0
  const total = latest.threadCount || 1
  const ratio = (daemon / total) * 100
  return ratio.toFixed(1) + '%'
})

const threadCreationRateValue = computed(() => {
  if (memoryHistory.value.length < 2) return '-'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const timeDiff = (last.collectTime - first.collectTime) / 1000
  const threadDiff = (last.totalStartedThreadCount || 0) - (first.totalStartedThreadCount || 0)
  if (timeDiff > 0) {
    const rate = threadDiff / timeDiff
    return rate.toFixed(2)
  }
  return '0'
})

const hasThreadPoolData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  return !!memoryHistory.value[memoryHistory.value.length - 1].threadPools
})
const peakThreadCountValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  let maxCount = 0
  for (let i = 0; i < memoryHistory.value.length; i++) {
    const count = memoryHistory.value[i].threadCount || 0
    if (count > maxCount) maxCount = count
  }
  return maxCount > 0 ? `${maxCount} 线程` : '0 线程'
})

const blockedRatioText = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const blocked = latest.threadCountBlocked || 0
  const total = latest.threadCount || 1
  const ratio = (blocked / total) * 100
  return ratio.toFixed(1) + '%'
})

const blockedRatioStatus = computed(() => {
  const ratio = parseFloat(blockedRatioText.value) || 0
  if (ratio < 5) return 'success'
  if (ratio < 15) return 'warning'
  return 'danger'
})

const runnableRatioText = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const runnable = latest.threadCountRunnable || 0
  const total = latest.threadCount || 1
  const ratio = (runnable / total) * 100
  return ratio.toFixed(1) + '%'
})

const runnableRatioStatus = computed(() => {
  const ratio = parseFloat(runnableRatioText.value) || 0
  if (ratio > 50) return 'success'
  if (ratio > 20) return 'warning'
  return 'info'
})

const totalStartedThreadValue = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.totalStartedThreadCount || '-'
})

// 智能线程分析
const threadGrowthAnalysis = computed(() => {
  if (memoryHistory.value.length < 2) {
    return { status: 'info', text: '数据不足', detail: '需要更多数据点才能分析趋势' }
  }
  
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const firstCount = first.threadCount || 0
  const lastCount = last.threadCount || 0
  
  if (lastCount > firstCount * 1.5) {
    return { status: 'danger', text: '快速增长', detail: `从${firstCount}增长到${lastCount}，可能存在线程泄漏` }
  } else if (lastCount > firstCount * 1.2) {
    return { status: 'warning', text: '缓慢增长', detail: `从${firstCount}增长到${lastCount}，建议关注` }
  } else if (lastCount < firstCount * 0.8) {
    return { status: 'success', text: '逐渐减少', detail: `从${firstCount}减少到${lastCount}，线程回收正常` }
  } else {
    return { status: 'success', text: '稳定', detail: `维持在${lastCount}左右，线程数量正常` }
  }
})

const blockedThreadAnalysis = computed(() => {
  if (memoryHistory.value.length === 0) {
    return { status: 'info', text: '数据不足', detail: '无法分析线程阻塞情况' }
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const blocked = latest.threadCountBlocked || 0
  const total = latest.threadCount || 1
  const ratio = (blocked / total) * 100
  
  if (ratio > 20) {
    return { status: 'danger', text: '严重阻塞', detail: `${blocked}/${total} 线程被阻塞 (${ratio.toFixed(1)}%)` }
  } else if (ratio > 10) {
    return { status: 'warning', text: '存在阻塞', detail: `${blocked}/${total} 线程被阻塞 (${ratio.toFixed(1)}%)` }
  } else if (ratio > 0) {
    return { status: 'info', text: '轻微阻塞', detail: `${blocked}/${total} 线程被阻塞 (${ratio.toFixed(1)}%)` }
  } else {
    return { status: 'success', text: '无阻塞', detail: '所有线程正常运行' }
  }
})

const threadHealthAnalysis = computed(() => {
  if (memoryHistory.value.length === 0) {
    return { status: 'info', text: '数据不足', detail: '无法评估线程健康度' }
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  let score = 100
  
  // BLOCKED线程占比扣分
  const blockedRatio = ((latest.threadCountBlocked || 0) / (latest.threadCount || 1)) * 100
  if (blockedRatio > 20) score -= 40
  else if (blockedRatio > 10) score -= 20
  else if (blockedRatio > 5) score -= 10
  
  // 线程总数过多扣分
  if (latest.threadCount > 500) score -= 20
  else if (latest.threadCount > 300) score -= 10
  
  // 守护线程比例异常扣分
  const daemonRatio = ((latest.daemonThreadCount || 0) / (latest.threadCount || 1)) * 100
  if (daemonRatio < 30) score -= 10
  
  score = Math.max(0, Math.min(100, score))
  
  if (score >= 80) {
    return { status: 'success', text: `${score}分 - 优秀`, detail: '线程状态良好，无需优化' }
  } else if (score >= 60) {
    return { status: 'warning', text: `${score}分 - 良好`, detail: '线程状态正常，建议关注' }
  } else if (score >= 40) {
    return { status: 'warning', text: `${score}分 - 一般`, detail: '线程问题较多，建议优化' }
  } else {
    return { status: 'danger', text: `${score}分 - 较差`, detail: '线程问题严重，需要立即处理' }
  }
})

const threadSuggestions = computed(() => {
  if (memoryHistory.value.length === 0) {
    return ['暂无数据', '']
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const blockedRatio = ((latest.threadCountBlocked || 0) / (latest.threadCount || 1)) * 100
  
  if (blockedRatio > 15) {
    return [
      '检查锁竞争',
      '分析BLOCKED线程堆栈，优化同步机制'
    ]
  } else if (latest.threadCount > 400) {
    return [
      '控制线程数量',
      '使用线程池管理，避免创建过多线程'
    ]
  } else if ((latest.daemonThreadCount || 0) / (latest.threadCount || 1) < 0.3) {
    return [
      '增加守护线程',
      '确保后台任务使用守护线程，避免阻止JVM退出'
    ]
  } else {
    return [
      '线程状态正常',
      '继续保持现有配置'
    ]
  }
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

const fullGcTrendAnalysis = computed(() => {
  if (memoryHistory.value.length < 2) {
    return { status: 'info', text: '数据不足', detail: '需要更多数据点才能分析趋势' }
  }
  
  // 分析最近几次Full GC的时间间隔
  let fullGcIntervals: number[] = []
  let prevFullGcCount = memoryHistory.value[0].fullGcCount || 0
  
  for (let i = 1; i < memoryHistory.value.length; i++) {
    const currentFullGcCount = memoryHistory.value[i].fullGcCount || 0
    if (currentFullGcCount > prevFullGcCount) {
      const interval = memoryHistory.value[i].collectTime - memoryHistory.value[i-1].collectTime
      fullGcIntervals.push(interval)
    }
    prevFullGcCount = currentFullGcCount
  }
  
  if (fullGcIntervals.length === 0) {
    return { status: 'success', text: '无Full GC', detail: '当前时间段内没有发生Full GC' }
  }
  
  // 分析间隔是否缩短（趋势恶化）
  if (fullGcIntervals.length >= 2) {
    const recentAvg = fullGcIntervals.slice(-2).reduce((a, b) => a + b, 0) / 2
    const olderAvg = fullGcIntervals.slice(0, -2).reduce((a, b) => a + b, 0) / (fullGcIntervals.length - 2)
    
    if (recentAvg < olderAvg * 0.7) {
      return { status: 'danger', text: '频率加快', detail: `Full GC间隔从${Math.round(olderAvg/1000)}s缩短至${Math.round(recentAvg/1000)}s` }
    } else if (recentAvg > olderAvg * 1.3) {
      return { status: 'success', text: '频率减缓', detail: `Full GC间隔从${Math.round(olderAvg/1000)}s延长至${Math.round(recentAvg/1000)}s` }
    }
  }
  
  const avgInterval = fullGcIntervals.reduce((a, b) => a + b, 0) / fullGcIntervals.length
  return { status: 'warning', text: '频率稳定', detail: `平均间隔${Math.round(avgInterval/1000)}s，共${fullGcIntervals.length}次` }
})

const gcHealthDetailAnalysis = computed(() => {
  if (memoryHistory.value.length === 0) {
    return { status: 'info', text: '数据不足', detail: '无法评估GC健康度' }
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  
  if (total === 0) {
    return { status: 'success', text: '健康', detail: '无GC活动，内存充足' }
  }
  
  const fullRatio = full / total
  let score = 100
  
  // Full GC占比扣分
  if (fullRatio > 0.3) score -= 40
  else if (fullRatio > 0.15) score -= 20
  else if (fullRatio > 0.05) score -= 10
  
  // GC总耗时扣分
  const totalGcTime = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
  if (totalGcTime > 10000) score -= 30
  else if (totalGcTime > 5000) score -= 15
  else if (totalGcTime > 1000) score -= 5
  
  score = Math.max(0, Math.min(100, score))
  
  if (score >= 80) {
    return { status: 'success', text: `${score}分 - 优秀`, detail: 'GC表现良好，无需优化' }
  } else if (score >= 60) {
    return { status: 'warning', text: `${score}分 - 良好`, detail: 'GC表现正常，建议关注' }
  } else if (score >= 40) {
    return { status: 'warning', text: `${score}分 - 一般`, detail: 'GC频率偏高，建议优化' }
  } else {
    return { status: 'danger', text: `${score}分 - 较差`, detail: 'GC问题严重，需要立即优化' }
  }
})

const gcSuggestions = computed(() => {
  if (memoryHistory.value.length === 0) {
    return ['暂无数据', '']
  }
  
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  const minor = latest.minorGcCount || 0
  const full = latest.fullGcCount || 0
  const total = minor + full
  
  if (total === 0) {
    return ['当前GC状态良好', '继续保持现有配置']
  }
  
  const fullRatio = full / total
  
  if (fullRatio > 0.2) {
    return [
      '增加堆内存大小',
      '建议调整 -Xmx 参数，减少Full GC频率'
    ]
  } else if (fullRatio > 0.1) {
    return [
      '优化内存分配',
      '检查是否有大对象或内存泄漏'
    ]
  } else if ((latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0) > 5000) {
    return [
      '调整GC算法',
      '考虑使用G1或ZGC垃圾收集器'
    ]
  } else {
    return [
      'GC状态正常',
      '继续监控，暂无优化建议'
    ]
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
  // 优先使用 memoryHistory 中的数据
  if (memoryHistory.value.length > 0) {
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (latest.jvmStartTime) {
      return new Date(latest.jvmStartTime).toLocaleString('zh-CN')
    }
  }
  // 降级使用 jvmData
  if (!jvmData.value.startTimeMs) return '-'
  return new Date(jvmData.value.startTimeMs).toLocaleString('zh-CN')
})

const jvmUptimeStr = computed(() => {
  // 优先使用 memoryHistory 中的数据
  if (memoryHistory.value.length > 0) {
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (latest.jvmUptimeMs) {
      const hours = Math.floor(latest.jvmUptimeMs / 3600000)
      const minutes = Math.floor((latest.jvmUptimeMs % 3600000) / 60000)
      return `${hours}小时 ${minutes}分钟`
    }
  }
  // 降级使用 jvmData
  if (!jvmData.value.uptimeMs) return '-'
  const hours = Math.floor(jvmData.value.uptimeMs / 3600000)
  const minutes = Math.floor((jvmData.value.uptimeMs % 3600000) / 60000)
  return `${hours}小时 ${minutes}分钟`
})

const latestPeakThreadCount = computed(() => {
  if (memoryHistory.value.length > 0) {
    return memoryHistory.value[memoryHistory.value.length - 1].peakThreadCount || '-'
  }
  return jvmData.value.peakThreadCount || '-'
})

const latestDaemonThreadCount = computed(() => {
  if (memoryHistory.value.length > 0) {
    return memoryHistory.value[memoryHistory.value.length - 1].daemonThreadCount || '-'
  }
  return jvmData.value.daemonThreadCount || '-'
})

const latestTotalLoadedClass = computed(() => {
  if (memoryHistory.value.length > 0) {
    return memoryHistory.value[memoryHistory.value.length - 1].totalLoadedClassCount || '-'
  }
  return jvmData.value.totalLoadedClassCount || '-'
})

const latestUnloadedClass = computed(() => {
  if (memoryHistory.value.length > 0) {
    return memoryHistory.value[memoryHistory.value.length - 1].unloadedClassCount || '-'
  }
  return jvmData.value.unloadedClassCount || '-'
})

const latestMinorGcCount = computed(() => {
  if (memoryHistory.value.length > 0) {
    const count = memoryHistory.value[memoryHistory.value.length - 1].minorGcCount || 0
    return count > 0 ? `${count} 次` : '-'
  }
  return gcData.value.collectors?.find(c => c.name.includes('Young'))?.count || '-'
})

const latestFullGcCount = computed(() => {
  if (memoryHistory.value.length > 0) {
    const count = memoryHistory.value[memoryHistory.value.length - 1].fullGcCount || 0
    return count > 0 ? `${count} 次` : '-'
  }
  return gcData.value.collectors?.find(c => c.name.includes('Old'))?.count || '-'
})

// 解析JVM参数
const latestJvmArgs = computed(() => {
  if (!memoryHistory.value.length) return []
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  if (!latest.jvmArgs) return []
  
  try {
    // 如果已经是数组，直接返回
    if (Array.isArray(latest.jvmArgs)) return latest.jvmArgs
    // 如果是JSON字符串，解析后返回
    if (typeof latest.jvmArgs === 'string') {
      const parsed = JSON.parse(latest.jvmArgs)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (e) {
    console.warn('Failed to parse jvmArgs:', e)
  }
  
  return []
})

const topCpuThreadsTable = computed(() => {
  // TODO: 从 threadsData 中提取 Top CPU 线程
  return []
})

// ==================== 方法 ====================

// 处理诊断命令（覆盖 Composable 中的版本，添加渲染逻辑）
const handleDiagCommand = async (command: string, row: any) => {
  console.log('[ApplicationView] 点击诊断命令:', command, '实例:', row)
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
      console.log('[ApplicationView] 调用 showMemoryHistoryChart')
      await showMemoryHistoryChart(row)
      break
    case 'gcChart':
      console.log('[ApplicationView] 调用 showGcHistoryChart')
      await showGcHistoryChart(row)
      break
    case 'threadChart':
      console.log('[ApplicationView] 调用 showThreadHistoryChart')
      await showThreadHistoryChart(row)
      break
    case 'ioNetworkChart':
      console.log('[ApplicationView] 调用 showIoNetworkHistoryChart')
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
// 刷新历史图表（用户点击“🔄 刷新数据”按钮时调用）
const refreshHistoryChart = () => {
  if (!currentDiagRow.value) {
    ElMessage.warning('无法获取实例信息')
    return
  }
  
  switch (currentDiagType.value) {
    case 'memoryChart':
      // 先刷新数据
      showMemoryHistoryChart(currentDiagRow.value, true)
      // 然后渲染底部 4 个图表
      setTimeout(() => {
        console.log('⏰ 开始渲染底部 GC 图表...')
        renderGcCharts(memoryHistory.value)
        ElMessage.success('所有图表已刷新')
      }, 2500) // 等待数据加载和主要图表渲染完成后
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
    
    // 检查数据是否有效
    if (!data || data.length === 0) {
      diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
      return
    }
    
    // 更新数据
    const sortedData = [...data].sort((a, b) => a.collectTime - b.collectTime)
    memoryHistory.value = sortedData
    diagResult.value = 'loaded'
    
    // 如果不是刷新，等待 Dialog 打开后再渲染
    if (!refresh) {
      // Dialog 打开后会触发 handleDialogOpened
      console.log('⏳ 等待 Dialog 打开...')
      
      // 同时更新原始数据（供切换查看）
      const dataInfo: Record<string, string> = {
        memoryChart: '内存监控',
        gcChart: 'GC分析',
        threadChart: '线程监控',
        ioNetworkChart: 'IO/网络监控'
      }
      const title = dataInfo[currentDiagType.value] || '监控数据'
      diagResult.value = `【${title} - 原始数据】\n\n记录总数: ${sortedData.length} 条\n时间范围: ${new Date(sortedData[0].collectTime).toLocaleString()} ~ ${new Date(sortedData[sortedData.length - 1].collectTime).toLocaleString()}\n\n${JSON.stringify(sortedData, null, 2)}`
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
    // 忽略组件已销毁的错误
    if (e.message && e.message.includes('__vnode')) {
      console.warn('组件已销毁，忽略更新')
      return
    }
    diagResult.value = `加载失败: ${e.message || '未知错误'}`
  } finally {
    historyLoading.value = false
  }
}

// Dialog 打开后的回调
const handleDialogOpened = () => {
  // 根据当前诊断类型渲染对应的图表
  if (currentDiagType.value === 'memoryChart') {
    // 使用 nextTick 确保 DOM 更新
    nextTick(() => {
      // 等待 Dialog 动画完全完成
      setTimeout(() => {
        renderChartsAfterDialogOpen()
      }, 500) // 等待 500ms 确保 Dialog 动画完成
    })
  } else if (currentDiagType.value === 'gcChart') {
    // GC 分析图表
    console.log('🎨 handleDialogOpened: 准备渲染GC图表')
    nextTick(() => {
      setTimeout(() => {
        // 检查组件是否可见
        const rootEl = document.querySelector('.gc-analysis-view') as HTMLElement
        if (!rootEl || rootEl.offsetParent === null) {
          console.log('⚠️ handleDialogOpened: GC组件被隐藏，跳过渲染')
          return
        }
        
        console.log('🎨 handleDialogOpened: 开始渲染GC图表, memoryHistory.length:', memoryHistory.value.length)
        if (memoryHistory.value.length > 0) {
          renderGcCharts(memoryHistory.value)
          console.log('✅ handleDialogOpened: GC图表渲染完成')
        } else {
          console.warn('⚠️ handleDialogOpened: memoryHistory为空，跳过渲染')
        }
      }, 500)
    })
  } else if (currentDiagType.value === 'threadChart') {
    // 线程监控图表
    nextTick(() => {
      setTimeout(() => {
        if (memoryHistory.value.length > 0) {
          threadMon.renderThreadCharts(memoryHistory.value)
        }
      }, 500)
    })
  } else if (currentDiagType.value === 'ioNetworkChart') {
    // IO/网络监控图表
    nextTick(() => {
      setTimeout(() => {
        if (memoryHistory.value.length > 0) {
          ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
        }
      }, 500)
    })
  }
}

// 手动刷新图表（用户点击按钮时调用）
const refreshCharts = () => {
  console.log('🔄 用户手动刷新图表...')
  
  // 确保在 history Tab
  memoryTab.value = 'history'
  
  // 等待一小段时间后渲染
  setTimeout(() => {
    console.log('⏰ 开始渲染内存图表...')
    renderMemoryCharts()
    
    // 等待 500ms 后再渲染 GC 图表，确保 DOM 完全就绪
    setTimeout(() => {
      console.log('⏰ 开始渲染 GC 图表...')
      
      // 直接检查 DOM 是否存在
      const minorEl = document.querySelector('[data-chart="minor-vs-full-gc"]')
      const gcEffEl = document.querySelector('[data-chart="gc-efficiency"]')
      
      console.log('GC 图表 DOM 检查:', {
        minorVsFullGc: !!minorEl,
        gcEfficiency: !!gcEffEl
      })
      
      if (minorEl && gcEffEl) {
        console.log('✅ GC 图表 DOM 已就绪，开始渲染...')
        renderGcCharts(memoryHistory.value)
      } else {
        console.warn('⚠️ GC 图表 DOM 未就绪，强制渲染...')
        renderGcCharts(memoryHistory.value)
      }
      
      console.log('✅ 所有图表渲染完成')
      ElMessage.success('图表已刷新')
    }, 500)
  }, 300)
}

// 在 Dialog 打开后渲染图表
const renderChartsAfterDialogOpen = () => {
  // 强制切换到 history Tab
  memoryTab.value = 'history'
  
  // 使用 nextTick 确保 DOM 更新
  nextTick(() => {
    // 等待 Dialog 动画完全完成
    setTimeout(() => {
      // 渲染所有内存图表（包括底部图表）
      renderMemoryCharts()
      
      // 使用 nextTick 确保图表 DOM 更新
      nextTick(() => {
        // 延迟渲染 GC 图表（确保 Dialog 完全展开）
        setTimeout(() => {
          // 检查组件是否可见
          const rootEl = document.querySelector('.gc-analysis-view') as HTMLElement
          if (rootEl && rootEl.offsetParent !== null) {
            renderGcCharts(memoryHistory.value)
          } else {
            console.log('⚠️ renderChartsAfterDialogOpen: GC组件被隐藏，跳过渲染')
          }
          
          // 最终 resize 所有底部图表
          setTimeout(() => {
            const edenEl = document.querySelector('[data-chart="eden-survivor"]') as HTMLElement
            const oldGenEl = document.querySelector('[data-chart="old-gen"]') as HTMLElement
            const minorGcEl = document.querySelector('[data-chart="minor-vs-full-gc"]') as HTMLElement
            const gcEffEl = document.querySelector('[data-chart="gc-efficiency"]') as HTMLElement
            
            const charts = [
              { name: 'Eden+Survivor', el: edenEl },
              { name: 'Old Gen', el: oldGenEl },
              { name: 'Minor vs Full GC', el: minorGcEl },
              { name: 'GC Efficiency', el: gcEffEl }
            ]
            
            charts.forEach(({ el }) => {
              if (el) {
                const instance = echarts.getInstanceByDom(el)
                if (instance) {
                  instance.resize()
                }
              }
            })
          }, 500)
        }, 1000)
      })
    }, 1000) // 等待 1 秒确保 Dialog 动画完成
  })
}

// 显示GC历史监控图表
const showGcHistoryChart = async (row: any, refresh = false) => {
  console.log('[ApplicationView] showGcHistoryChart 被调用, row:', row, 'refresh:', refresh)
  if (!refresh) {
    diagDialogTitle.value = `♻️ GC分析 - ${row.app}@${row.inst}`
    diagResult.value = '正在加载历史数据...'
    showDiagDialog.value = true
    currentDiagType.value = 'gcChart'
    diagMode.value = 'chart'
    console.log('[ApplicationView] Dialog设置: showDiagDialog=true, currentDiagType=gcChart')
  }
  
  try {
    historyLoading.value = true
    const endTime = Date.now()
    const startTime = endTime - historyTimeRange.value * 3600 * 1000
    
    console.log('[ApplicationView] 开始加载历史数据, app:', row.app, 'inst:', row.inst)
    const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
    console.log('[ApplicationView] 历史数据加载完成, 条数:', data?.length || 0)
    
    // 检查数据是否有效
    if (!data || data.length === 0) {
      diagResult.value = '暂无历史数据'
      return
    }
    
    // 更新数据
    const sortedData = [...data].sort((a, b) => a.collectTime - b.collectTime)
    
    // 检查组件是否仍然挂载
    if (!showDiagDialog.value || currentDiagType.value !== 'gcChart') {
      console.log('组件已切换或关闭，忽略数据更新')
      return
    }
    
    memoryHistory.value = sortedData
    diagResult.value = 'loaded'
    
    // 同时更新原始数据（供切换查看）
    if (!refresh) {
      const title = 'GC分析'
      diagResult.value = `【${title} - 原始数据】\n\n记录总数: ${sortedData.length} 条\n时间范围: ${new Date(sortedData[0].collectTime).toLocaleString()} ~ ${new Date(sortedData[sortedData.length - 1].collectTime).toLocaleString()}\n\n${JSON.stringify(sortedData, null, 2)}`
    }
    
    console.log('📊 历史数据加载完成:', {
      数据条数: sortedData.length,
      第一条: sortedData[0],
      最后一条: sortedData[sortedData.length - 1]
    })
    
    // 数据加载完成后，等待Dialog打开并渲染图表
    nextTick(() => {
      setTimeout(() => {
        if (showDiagDialog.value && currentDiagType.value === 'gcChart' && memoryHistory.value.length > 0) {
          renderGcCharts(memoryHistory.value)
        }
      }, 800) // 增加延迟确保DOM就绪
    })
  } catch (e: any) {
    // 忽略组件已销毁的错误
    if (e.message && e.message.includes('__vnode')) {
      console.warn('组件已销毁，忽略更新')
      return
    }
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
    
    // 检查数据是否有效
    if (!data || data.length === 0) {
      diagResult.value = '暂无历史数据'
      return
    }
    
    // 更新数据
    const sortedData = [...data].sort((a, b) => a.collectTime - b.collectTime)
    
    // 检查组件是否仍然挂载
    if (!showDiagDialog.value || currentDiagType.value !== 'threadChart') {
      console.log('组件已切换或关闭，忽略数据更新')
      return
    }
    
    memoryHistory.value = sortedData
    diagResult.value = 'loaded'
    
    // 同时更新原始数据（供切换查看）
    if (!refresh) {
      const title = '线程监控'
      diagResult.value = `【${title} - 原始数据】\n\n记录总数: ${sortedData.length} 条\n时间范围: ${new Date(sortedData[0].collectTime).toLocaleString()} ~ ${new Date(sortedData[sortedData.length - 1].collectTime).toLocaleString()}\n\n${JSON.stringify(sortedData, null, 2)}`
    }
    
    console.log('📊 历史数据加载完成:', {
      数据条数: sortedData.length,
      第一条: sortedData[0],
      最后一条: sortedData[sortedData.length - 1]
    })
    
    // 数据加载完成后，等待Dialog打开并渲染图表
    nextTick(() => {
      setTimeout(() => {
        if (showDiagDialog.value && currentDiagType.value === 'threadChart' && memoryHistory.value.length > 0) {
          threadMon.renderThreadCharts(memoryHistory.value)
        }
      }, 800) // 增加延迟确保DOM就绪
    })
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    // 忽略组件已销毁的错误
    if (e.message && (e.message.includes('__vnode') || e.message.includes('Cannot set properties of null'))) {
      console.warn('组件已销毁或切换，忽略更新')
      return
    }
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
    
    // 检查数据是否有效
    if (!data || data.length === 0) {
      diagResult.value = '暂无历史数据'
      return
    }
    
    // 更新数据
    const sortedData = [...data].sort((a, b) => a.collectTime - b.collectTime)
    memoryHistory.value = sortedData
    diagResult.value = 'loaded'
    
    // 同时更新原始数据（供切换查看）
    if (!refresh) {
      const title = 'IO/网络监控'
      diagResult.value = `【${title} - 原始数据】\n\n记录总数: ${sortedData.length} 条\n时间范围: ${new Date(sortedData[0].collectTime).toLocaleString()} ~ ${new Date(sortedData[sortedData.length - 1].collectTime).toLocaleString()}\n\n${JSON.stringify(sortedData, null, 2)}`
    }
    
    console.log('📊 历史数据加载完成:', {
      数据条数: sortedData.length,
      第一条: sortedData[0],
      最后一条: sortedData[sortedData.length - 1]
    })
    
    // 数据加载完成后，等待Dialog打开并渲染图表
    nextTick(() => {
      setTimeout(() => {
        if (memoryHistory.value.length > 0) {
          ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
        }
      }, 300)
    })
    
    if (!refresh) {
      ElMessage.success(`加载了 ${data.length} 条历史记录`)
    } else {
      ElMessage.success('数据已刷新')
    }
  } catch (e: any) {
    // 忽略组件已销毁的错误
    if (e.message && e.message.includes('__vnode')) {
      console.warn('组件已销毁，忽略更新')
      return
    }
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
        renderGcCharts(memoryHistory.value)
      } else if (newType === 'threadChart') {
        threadMon.renderThreadCharts(memoryHistory.value)
      } else if (newType === 'ioNetworkChart') {
        ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
      }
    }, 300)
  }
})

// 监听diagMode变化，从原始数据切回图表视图时重新渲染
let diagModeWatchTimer: ReturnType<typeof setTimeout> | null = null
watch(diagMode, (newMode) => {
  // 清除之前的定时器（防抖）
  if (diagModeWatchTimer) {
    clearTimeout(diagModeWatchTimer)
  }
  
  // 只在切换到chart模式时渲染
  if (newMode === 'chart' && currentDiagType.value && memoryHistory.value.length > 0) {
    // 等待DOM更新后重新渲染图表
    diagModeWatchTimer = setTimeout(() => {
      console.log('[ApplicationView] 从原始数据切回图表视图，重新渲染图表')
      if (currentDiagType.value === 'memory' || currentDiagType.value === 'memoryChart') {
        renderMemoryCharts()
      } else if (currentDiagType.value === 'gcChart') {
        renderGcCharts(memoryHistory.value)
      } else if (currentDiagType.value === 'threadChart') {
        threadMon.renderThreadCharts(memoryHistory.value)
      } else if (currentDiagType.value === 'ioNetworkChart') {
        ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
      }
      diagModeWatchTimer = null
    }, 600) // 增加延迟，确保Dialog切换动画完全完成
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
