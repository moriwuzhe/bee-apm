// 全局变量，用于存储知识图谱
let graph = null;

// 标签页切换
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // 移除所有标签页的 active 类
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        // 添加当前标签页的 active 类
        this.classList.add('active');
        const tabId = this.dataset.tab;
        document.getElementById(`${tabId}-tab`).classList.add('active');
        // 如果切换到可视化标签页，加载知识图谱
        if (tabId === 'visualize') {
            loadGraphVisual();
        }
    });
});

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
            // 加载知识图谱
            await loadGraph();
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

// 加载知识图谱
async function loadGraph() {
    try {
        const res = await fetch('/api/code/graph');
        graph = await res.json();
    } catch (e) {
        console.error('加载知识图谱失败:', e);
    }
}

// 加载知识图谱可视化
function loadGraphVisual() {
    console.log('开始加载知识图谱可视化');
    const container = document.getElementById('graphVisual');
    console.log('找到容器元素:', container);
    if (!graph || !graph.nodes) {
        console.log('知识图谱数据不存在');
        container.innerHTML = '<div style="color:#999;">请先索引代码库</div>';
        return;
    }
    console.log('知识图谱数据存在，节点数:', Object.keys(graph.nodes).length);

    // 检查 vis 库是否加载
    console.log('检查 vis 库是否加载:', typeof vis);
    if (typeof vis === 'undefined') {
        console.log('vis.js 库加载失败');
        container.innerHTML = '<div style="color:red;">vis.js 库加载失败，请刷新页面重试</div>';
        return;
    }
    console.log('vis.js 库加载成功');

    // 计算节点类型分布
    const typeCount = {};
    for (const nodeId in graph.nodes) {
        const node = graph.nodes[nodeId];
        if (node.type) {
            typeCount[node.type] = (typeCount[node.type] || 0) + 1;
        }
    }

    // 构建节点类型分布的 HTML
    let typeDistributionHtml = '';
    for (const type in typeCount) {
        typeDistributionHtml += '<div>' + type + ': ' + typeCount[type] + '</div>';
    }

    try {
        // 创建图形化的知识图谱
        container.innerHTML = '<div style="font-weight:600;margin-bottom:15px;">知识图谱可视化</div>' +
            '<div style="font-size:14px;margin-bottom:20px;">' +
            '<div>节点数：' + Object.keys(graph.nodes).length + '</div>' +
            '<div>边数：' + (graph.edges ? graph.edges.length : 0) + '</div>' +
            '<div style="margin-top:10px;">节点类型分布：</div>' +
            typeDistributionHtml +
            '</div>' +
            '<div id="network" style="height:600px;"></div>';
        console.log('创建 network 容器元素');

        // 准备节点和边数据
        const nodes = [];
        const edges = [];

        // 添加节点
        console.log('开始添加节点');
        for (const nodeId in graph.nodes) {
            const node = graph.nodes[nodeId];
            let color = '#97C2FC'; // 默认颜色
            
            // 根据节点类型设置不同的颜色
            switch (node.type) {
                case 'FILE':
                    color = '#97C2FC';
                    break;
                case 'CLASS':
                    color = '#FFBB28';
                    break;
                case 'INTERFACE':
                    color = '#00E396';
                    break;
                case 'METHOD':
                    color = '#AB83A1';
                    break;
                case 'FIELD':
                    color = '#FF8042';
                    break;
            }

            nodes.push({
                id: nodeId,
                label: node.name,
                title: node.qualifiedName || node.name,
                color: color,
                shape: 'ellipse'
            });
        }
        console.log('节点添加完成，节点数:', nodes.length);

        // 添加边
        if (graph.edges) {
            console.log('开始添加边');
            for (let i = 0; i < graph.edges.length; i++) {
                const edge = graph.edges[i];
                edges.push({
                    from: edge.sourceId,
                    to: edge.targetId,
                    label: edge.type,
                    color: '#848484'
                });
            }
            console.log('边添加完成，边数:', edges.length);
        } else {
            console.log('没有边数据');
        }

        // 创建网络实例
        const containerNetwork = document.getElementById('network');
        console.log('找到 network 元素:', containerNetwork);
        if (!containerNetwork) {
            throw new Error('无法找到 network 元素');
        }

        const data = {
            nodes: nodes,
            edges: edges
        };
        const options = {
            nodes: {
                font: {
                    size: 12
                }
            },
            edges: {
                font: {
                    size: 10,
                    align: 'middle'
                },
                smooth: {
                    type: 'continuous'
                }
            },
            interaction: {
                hover: true,
                zoomView: true
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04,
                    damping: 0.09
                }
            }
        };

        // 创建网络实例
        console.log('开始创建网络实例');
        window.network = new vis.Network(containerNetwork, data, options);
        console.log('知识图谱可视化创建成功');
    } catch (error) {
        console.error('创建知识图谱可视化失败:', error);
        container.innerHTML = '<div style="color:red;">创建知识图谱可视化失败: ' + error.message + '</div>';
    }
}

// Context 查询
async function getContext() {
    const nodeId = document.getElementById('nodeId').value;
    const btn = document.getElementById('contextBtn');
    const status = document.getElementById('contextStatus');
    const result = document.getElementById('contextResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/context/' + nodeId);
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '查询失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">节点信息：</div>' +
                '<div>ID: ' + data.node.id + '</div>' +
                '<div>类型: ' + data.node.type + '</div>' +
                '<div>名称: ' + data.node.name + '</div>';
            if (data.node.qualifiedName) {
                html += '<div>完整名称: ' + data.node.qualifiedName + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">入边（谁调用/包含它）：</div>';
            for (let i = 0; i < data.incomingEdges.length; i++) {
                const e = data.incomingEdges[i];
                html += '<div class="edge-item">' + e.type + ' from ' + e.sourceId + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">出边（它调用/包含谁）：</div>';
            for (let i = 0; i < data.outgoingEdges.length; i++) {
                const e = data.outgoingEdges[i];
                html += '<div class="edge-item">' + e.type + ' to ' + e.targetId + '</div>';
            }
            html += '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// Impact Analysis
async function getImpact() {
    const nodeId = document.getElementById('impactNodeId').value;
    const btn = document.getElementById('impactBtn');
    const status = document.getElementById('impactStatus');
    const result = document.getElementById('impactResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/impact/' + nodeId);
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '分析失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">节点信息：</div>' +
                '<div>ID: ' + data.node.id + '</div>' +
                '<div>类型: ' + data.node.type + '</div>' +
                '<div>名称: ' + data.node.name + '</div>' +
                '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">上游影响（谁调用它）：</div>';
            for (let i = 0; i < data.upstreamImpact.length; i++) {
                const n = data.upstreamImpact[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">下游影响（它调用谁）：</div>';
            for (let i = 0; i < data.downstreamImpact.length; i++) {
                const n = data.downstreamImpact[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">风险评估：</div>' +
                '<div>总影响数：' + data.totalImpactCount + '</div>' +
                '<div>风险等级：' + data.riskLevel + '</div>' +
                '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// Detect Changes
async function detectChanges() {
    const changedFiles = document.getElementById('changedFiles').value.split('\n').filter(f => f.trim());
    const btn = document.getElementById('detectBtn');
    const status = document.getElementById('detectStatus');
    const result = document.getElementById('detectResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/detectChanges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ changedFiles })
        });
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '检测失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">变更的节点：</div>';
            for (let i = 0; i < data.changedNodes.length; i++) {
                const n = data.changedNodes[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">受影响的节点：</div>';
            for (let i = 0; i < data.impactedNodes.length; i++) {
                const n = data.impactedNodes[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            html += '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">风险评估：</div>' +
                '<div>总影响数：' + data.totalImpactCount + '</div>' +
                '<div>风险等级：' + data.riskLevel + '</div>' +
                '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// 基础查询
async function doQuery() {
    const nodeType = document.getElementById('nodeType').value;
    const nameContains = document.getElementById('nameContains').value;
    const btn = document.getElementById('queryBtn');
    const status = document.getElementById('queryStatus');
    const result = document.getElementById('queryResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeType, nameContains })
        });
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '查询失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">查询结果：' + data.nodeCount + ' 个</div>' +
                '</div>';

            html += '<div class="node-list">';
            for (let i = 0; i < data.nodes.length; i++) {
                const n = data.nodes[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// API Route Map
async function getApiRouteMap() {
    const btn = document.getElementById('apiRouteBtn');
    const status = document.getElementById('apiRouteStatus');
    const result = document.getElementById('apiRouteResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/apiRouteMap');
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '获取失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">API 路由映射：' + data.routeCount + ' 个</div>' +
                '</div>';

            html += '<div style="display:grid;gap:10px;">';
            for (let i = 0; i < data.apiRoutes.length; i++) {
                const route = data.apiRoutes[i];
                html += '<div class="edge-item">' +
                    '<strong>路由：</strong>' + route.route + '<br>' +
                    '<strong>控制器：</strong>' + route.controllerClass + '<br>' +
                    '<strong>方法：</strong>' + route.methodName +
                    '</div>';
            }
            html += '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// MCP 工具
async function doMCPQuery() {
    const queryType = document.getElementById('mcpQueryType').value;
    const query = document.getElementById('mcpQuery').value;
    const btn = document.getElementById('mcpBtn');
    const status = document.getElementById('mcpStatus');
    const result = document.getElementById('mcpResult');

    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');

    try {
        const res = await fetch('/api/code/mcp/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queryType, query })
        });
        const data = await res.json();

        if (data.error) {
            status.className = 'status error';
            status.textContent = '查询失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;">' +
                '<div style="font-weight:600;">查询结果：' + data.resultCount + ' 个</div>' +
                '</div>';

            html += '<div class="node-list">';
            for (let i = 0; i < data.results.length; i++) {
                const n = data.results[i];
                html += '<div class="node-item ' + n.type + '">' + (n.qualifiedName || n.name) + '</div>';
            }
            html += '</div>';

            result.innerHTML = html;
            result.classList.add('show');
        }
    } catch (e) {
        status.className = 'status error';
        status.textContent = '请求失败：' + e.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

// 发送聊天消息
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML += '<div style="margin-bottom:10px;">' +
        '<div style="font-weight:600;">您：</div>' +
        '<div style="background:white;padding:10px;border-radius:8px;">' + message + '</div>' +
        '</div>';
    input.value = '';

    // 模拟 AI 回复
    setTimeout(() => {
        chatMessages.innerHTML += '<div style="margin-bottom:10px;">' +
            '<div style="font-weight:600;">AI：</div>' +
            '<div style="background:#e3f2fd;padding:10px;border-radius:8px;">这是一个模拟的 AI 回复。在实际应用中，这里会调用真实的 AI 服务来生成回复。</div>' +
            '</div>';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 页面加载时加载知识图谱
window.onload = async function() {
    console.log('页面加载完成，开始加载知识图谱数据');
    await loadGraph();
    console.log('知识图谱数据加载完成:', graph);
    // 检查是否当前标签页是可视化标签页
    const activeTab = document.querySelector('.tab.active');
    if (activeTab && activeTab.dataset.tab === 'visualize') {
        console.log('当前标签页是可视化标签页，加载知识图谱可视化');
        loadGraphVisual();
    }
};