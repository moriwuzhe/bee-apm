// 知识图谱相关功能
async function loadGraph() {
    try {
        const res = await fetch('/api/code/graph');
        graph = await res.json();
    } catch (e) {
        console.error('加载知识图谱失败:', e);
    }
}

function loadGraphVisual() {
    const container = document.getElementById('graphVisual');
    container.innerHTML = '<div style="color:#666;">正在加载知识图谱数据...</div>';
    if (!graph) {
        loadGraph().then(() => { createVisualization(container); })
            .catch((error) => { container.innerHTML = '<div style="color:red;">加载知识图谱数据失败: ' + escapeHtml(error.message) + '</div>'; });
    } else {
        createVisualization(container);
    }
}

function createVisualization(container) {
    if (!graph || !graph.nodes) {
        container.innerHTML = '<div style="color:#999;">请先索引代码库</div>';
        return;
    }
    if (typeof vis === 'undefined') {
        container.innerHTML = '<div style="color:red;">vis.js 库加载失败，请刷新页面重试</div>';
        return;
    }
    const typeCount = {};
    for (const nodeId in graph.nodes) {
        const node = graph.nodes[nodeId];
        if (node.type) {
            typeCount[node.type] = (typeCount[node.type] || 0) + 1;
        }
    }
    let typeDistributionHtml = '';
    for (const type in typeCount) {
        typeDistributionHtml += '<div>' + type + ': ' + typeCount[type] + '</div>';
    }
    try {
        container.innerHTML = '<div style="font-weight:600;margin-bottom:15px;">知识图谱可视化</div>' +
            '<div style="font-size:14px;margin-bottom:20px;">' +
            '<div>节点数：' + Object.keys(graph.nodes).length + '</div>' +
            '<div>边数：' + (graph.edges ? graph.edges.length : 0) + '</div>' +
            '<div style="margin-top:10px;">节点类型分布：</div>' + typeDistributionHtml +
            '</div>' +
            '<div id="network" style="height:600px;"></div>';
        const nodes = [];
        const edges = [];
        for (const nodeId in graph.nodes) {
            const node = graph.nodes[nodeId];
            let color = '#97C2FC';
            switch (node.type) {
                case 'FILE': color = '#97C2FC'; break;
                case 'CLASS': color = '#FFBB28'; break;
                case 'INTERFACE': color = '#00E396'; break;
                case 'METHOD': color = '#AB83A1'; break;
                case 'FIELD': color = '#FF8042'; break;
            }
            nodes.push({ id: nodeId, label: node.name, title: node.qualifiedName || node.name, color: color, shape: 'ellipse' });
        }
        if (graph.edges) {
            for (let i = 0; i < graph.edges.length; i++) {
                const edge = graph.edges[i];
                edges.push({ from: edge.sourceId, to: edge.targetId, label: edge.type, color: '#848484' });
            }
        }
        const containerNetwork = document.getElementById('network');
        if (!containerNetwork) throw new Error('无法找到 network 元素');
        const data = { nodes: nodes, edges: edges };
        const options = {
            nodes: { font: { size: 12 } },
            edges: { font: { size: 10, align: 'middle' }, smooth: { type: 'continuous' } },
            interaction: { hover: true, zoomView: true },
            physics: { enabled: true, barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 95, springConstant: 0.04, damping: 0.09 } }
        };
        window.network = new vis.Network(containerNetwork, data, options);
    } catch (error) {
        container.innerHTML = '<div style="color:red;">创建知识图谱可视化失败: ' + escapeHtml(error.message) + '</div>';
    }
}

// 索引代码库
async function indexRepository() {
    const repoPath = document.getElementById('repoPath').value;
    const btn = document.getElementById('indexBtn');
    const status = document.getElementById('indexStatus');
    btn.disabled = true;
    status.style.display = 'none';
    try {
        const res = await fetch('/api/code/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoPath })
        });
        const data = await res.json();
        if (data.success) {
            status.className = 'status success';
            status.textContent = '索引成功：' + data.nodeCount + ' 个节点，' + data.edgeCount + ' 条边';
            status.style.display = 'block';
            await loadGraph();
            loadProjectAnalysis();
        } else {
            status.className = 'status error';
            status.textContent = '索引失败：' + data.error;
            status.style.display = 'block';
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}