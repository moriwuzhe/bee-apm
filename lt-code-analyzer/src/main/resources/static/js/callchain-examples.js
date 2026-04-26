// 调用链追踪和快速查询
async function loadMethodsForCallChain() {
    await loadGraph();
    const select = document.getElementById('callchainNodeSelect');
    select.innerHTML = '<option value="">-- 选择方法 --</option>';
    if (graph && graph.nodes) {
        let count = 0;
        for (const nodeId in graph.nodes) {
            const node = graph.nodes[nodeId];
            if (node.type === 'METHOD') {
                select.innerHTML += '<option value="' + nodeId + '">' + (node.qualifiedName || node.name) + '</option>';
                count++;
                if (count >= 100) break;
            }
        }
    }
}

async function getCallChain() {
    const nodeId = document.getElementById('callchainNodeId').value;
    const btn = document.getElementById('callchainBtn');
    const status = document.getElementById('callchainStatus');
    const result = document.getElementById('callchainResult');
    if (!nodeId) { status.className = 'status error'; status.textContent = '请输入或选择节点 ID'; status.style.display = 'block'; return; }
    btn.disabled = true;
    status.style.display = 'none';
    result.classList.remove('show');
    try {
        const res = await fetch('/api/code/callChain/' + nodeId);
        const data = await res.json();
        if (data.error) {
            status.className = 'status error';
            status.textContent = '查询失败：' + data.error;
            status.style.display = 'block';
        } else {
            let html = '<div style="margin-bottom:15px;"><div style="font-weight:600;">起点：</div><div class="node-item ' + (data.startNode.type || 'CLASS') + '">' + escapeHtml(data.startNode.qualifiedName || data.startNode.name) + '</div></div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">⬆ 上游调用链：谁调用它？</div>';
            if (data.upstreamChain && data.upstreamChain.length > 0) {
                data.upstreamChain.forEach(item => {
                    html += '<div class="call-chain">' + '&nbsp;&nbsp;'.repeat(item.depth || 0) + escapeHtml(item.path || '') + '</div>';
                });
            } else { html += '<div style="color:#999;">无上游调用</div>'; }
            html += '</div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">⬇ 下游调用链：它调用谁？</div>';
            if (data.downstreamChain && data.downstreamChain.length > 0) {
                data.downstreamChain.forEach(item => {
                    html += '<div class="call-chain">' + '&nbsp;&nbsp;'.repeat(item.depth || 0) + escapeHtml(item.path || '') + '</div>';
                });
            } else { html += '<div style="color:#999;">无下游调用</div>'; }
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

// 快速查询示例
async function loadExampleQueries() {
    try {
        const res = await fetch('/api/code/exampleQueries');
        const data = await res.json();
        let html = '';
        if (data.examples && data.examples.length > 0) {
            data.examples.forEach((ex, idx) => {
                html += '<div class="example-query" onclick="runExampleQuery(' + idx + ')">';
                html += '<div class="name">' + escapeHtml(ex.name) + '</div>';
                html += '<div class="desc">' + escapeHtml(ex.description) + '</div>';
                html += '</div>';
            });
        }
        document.getElementById('exampleQueriesList').innerHTML = html || '<div style="color:#999;">无示例查询</div>';
        window.exampleQueriesData = data.examples || [];
    } catch (e) {
        console.error('加载示例查询失败:', e);
        document.getElementById('exampleQueriesList').innerHTML = '<div class="error-text">加载失败</div>';
    }
}

function runExampleQuery(idx) {
    const ex = window.exampleQueriesData[idx];
    if (!ex) return;
    document.querySelector('[data-tab="context"]').click();
    document.getElementById('nodeId').value = ex.queryKeyword || ex.query || '';
}