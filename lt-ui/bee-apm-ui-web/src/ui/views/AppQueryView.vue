<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

import PageShell from '../components/PageShell.vue'
import { useGroups } from '../composables/useGroups'
import RequestTab from './query/RequestTab.vue'
import MethodTab from './query/MethodTab.vue'
import SqlTab from './query/SqlTab.vue'
import TxTab from './query/TxTab.vue'
import LoggerTab from './query/LoggerTab.vue'

const { envOptions, appOptions, loading: groupsLoading } = useGroups()

const env = ref('')
const app = ref('')
const activeTab = ref('request')

</script>

<template>
  <PageShell title="应用查询">
    <template #actions>
      <el-button type="primary" :icon="Search" disabled v-if="false">预留</el-button>
    </template>

    <template #filters>
      <el-form label-width="64px">
        <div class="filters">
          <el-form-item label="环境">
            <el-select v-model="env" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in envOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="应用">
            <el-select v-model="app" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in appOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </template>

    <el-tabs v-model="activeTab" class="query-tabs">
      <el-tab-pane label="请求查询" name="request" :lazy="true">
        <RequestTab :env="env" :app="app" />
      </el-tab-pane>
      <el-tab-pane label="方法查询" name="method" :lazy="true">
        <MethodTab :env="env" :app="app" />
      </el-tab-pane>
      <el-tab-pane label="SQL查询" name="sql" :lazy="true">
        <SqlTab :env="env" :app="app" />
      </el-tab-pane>
      <el-tab-pane label="事务查询" name="tx" :lazy="true">
        <TxTab :env="env" :app="app" />
      </el-tab-pane>
      <el-tab-pane label="Logger查询" name="logger" :lazy="true">
        <LoggerTab :env="env" :app="app" />
      </el-tab-pane>
    </el-tabs>
  </PageShell>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-4);
}

.query-tabs {
  margin-top: -10px;
}
</style>