<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type Topology = {
  nodes?: any[]
  edges?: any[]
}

const props = defineProps<{
  modelValue: boolean
  loading: boolean
  data: Topology | null
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const container = ref<HTMLDivElement | null>(null)

let network: any = null
let nodesDs: any = null
let edgesDs: any = null

function normalizeNodes(raw: any[]) {
  const res: any[] = []
  for (let i = 0; i < raw.length; i += 1) {
    const n = raw[i] || {}
    const id = n.id != null ? n.id : i + 1
    const label = n.label || n.name || n.text || String(id)
    res.push({
      id,
      label,
      title: label,
      color: n.color,
      group: n.group,
    })
  }
  return res
}

function normalizeEdges(raw: any[]) {
  const res: any[] = []
  for (let i = 0; i < raw.length; i += 1) {
    const e = raw[i] || {}
    const from = e.from != null ? e.from : e.source
    const to = e.to != null ? e.to : e.target
    if (from == null || to == null) continue
    res.push({
      from,
      to,
      label: e.label,
      arrows: 'to',
    })
  }
  return res
}

async function ensureNetwork() {
  if (network) return
  const mod: any = await import('vis-network/standalone')
  const DataSet = mod.DataSet
  const Network = mod.Network
  nodesDs = new DataSet([])
  edgesDs = new DataSet([])
  network = new Network(
    container.value,
    { nodes: nodesDs, edges: edgesDs },
    {
      autoResize: true,
      interaction: { hover: true, multiselect: true },
      physics: { enabled: true, stabilization: { iterations: 80 } },
      edges: { smooth: { type: 'dynamic' }, color: { opacity: 0.6 } },
      nodes: { shape: 'dot', size: 14, font: { color: '#111827' } },
    },
  )
}

async function render() {
  if (!props.modelValue) return
  if (!container.value) return
  await ensureNetwork()

  const topo = props.data || {}
  const nodes = normalizeNodes(Array.isArray(topo.nodes) ? topo.nodes : [])
  const edges = normalizeEdges(Array.isArray(topo.edges) ? topo.edges : [])

  nodesDs.clear()
  edgesDs.clear()
  nodesDs.add(nodes)
  edgesDs.add(edges)

  network.fit({ animation: { duration: 200 } })
}

function destroy() {
  if (network) {
    network.destroy()
    network = null
    nodesDs = null
    edgesDs = null
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await nextTick()
    await render()
  },
)

watch(
  () => props.data,
  async () => {
    if (!props.modelValue) return
    await nextTick()
    await render()
  },
)

onBeforeUnmount(() => {
  destroy()
})
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="title || '拓扑'"
    size="78%"
    @update:model-value="(v:boolean)=>emit('update:modelValue', v)"
  >
    <div class="wrap">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else ref="container" class="graph" />
    </div>
  </el-drawer>
</template>

<style scoped>
.wrap{
  height: 70vh;
}

.graph{
  height: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
</style>

