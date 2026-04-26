// Context 查询和 Impact 分析
async function loadNodesForContext() {
    await loadGraph();
    const select = document.getElementById('contextNodeSelect');
    select.innerHTML = '<option value="">-- 选择节点 --</option>';
    if (graph && graph.nodes) {
        let count = 0;
        for (const nodeId in graph.nodes) {
            const node = graph.nodes[nodeId];
            const label = (node.qualifiedName || node.name) + ' (' + node.type + ')';
            select.innerHTML += '<option value="' + nodeId + '">' + label + '</option>';
            count++;
            if (count >= 100) break;
        }
    }
}

async function loadNodesForImpact() {
    await loadGraph();
    const select = document.getElementById('impactNodeSelect');
    select.innerHTML = '<option value="">-- 选择节点 --</option>';
    if (graph && graph.nodes) {
        let count = 0;
        for (const nodeId in graph.nodes) {
            const node = graph.nodes[nodeId];
            const label = (node.qualifiedName || node.name) + ' (' + node.type + ')';
            select.innerHTML += '<option value="' + nodeId + '">' + label + '</option>';
            count++;
            if (count >= 100) break;
        }
    }
}

async function getContext() {
    const nodeId = document.getElementById('nodeId').value;
    const btn = document.getElementById('contextBtn');
    const status = document.getElementById('contextStatus');
    const result = document.getElementById('contextResult');
    if (!nodeId) { status.className = 'status error'; status.textContent = '请输入或选择节点 ID'; status.style.display = 'block'; return; }
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
            let html = '<div style="margin-bottom:15px;"><div style="font-weight:600;">节点信息：</div><div>ID: ' + escapeHtml(data.node.id) + '</div><div>类型: ' + escapeHtml(data.node.type) + '</div><div>名称: ' + escapeHtml(data.node.name) + '</div>';
            if (data.node.qualifiedName) html += '<div>完整名称: ' + escapeHtml(data.node.qualifiedName) + '</div>';
            if (data.node.filePath) html += '<div>文件: ' + escapeHtml(data.node.filePath) + '</div>';
            html += '</div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">入边（谁调用/包含它）：</div>';
            if (data.incomingEdges && data.incomingEdges.length > 0) {
                data.incomingEdges.forEach(e => { html += '<div class="edge-item">' + escapeHtml(e.type) + ' from ' + escapeHtml(e.sourceId) + '</div>'; });
            } else { html += '<div style="color:#999;">无</div>'; }
            html += '</div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">出边（它调用/包含谁）：</div>';
            if (data.outgoingEdges && data.outgoingEdges.length > 0) {
                data.outgoingEdges.forEach(e => { html += '<div class="edge-item">' + escapeHtml(e.type) + ' to ' + escapeHtml(e.targetId) + '</div>'; });
            } else { html += '<div style="color:#999;">无</div>'; }
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

async function getImpact() {
    const nodeId = document.getElementById('impactNodeId').value;
    const btn = document.getElementById('impactBtn');
    const status = document.getElementById('impactStatus');
    const result = document.getElementById('impactResult');
    if (!nodeId) { status.className = 'status error'; status.textContent = '请输入或选择节点 ID'; status.style.display = 'block'; return; }
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
            let html = '<div style="margin-bottom:15px;"><div style="font-weight:600;">节点信息：</div><div>ID: ' + escapeHtml(data.node.id) + '</div><div>类型: ' + escapeHtml(data.node.type) + '</div><div>名称: ' + escapeHtml(data.node.name) + '</div></div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">上游影响：谁依赖它？</div>';
            if (data.upstreamImpact && data.upstreamImpact.length > 0) {
                data.upstreamImpact.forEach(n => { html += '<div class="node-item ' + (n.type || 'CLASS') + '">' + escapeHtml(n.qualifiedName || n.name) + '</div>'; });
            } else { html += '<div style="color:#999;">无</div>'; }
            html += '</div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">下游影响：它依赖谁？</div>';
            if (data.downstreamImpact && data.downstreamImpact.length > 0) {
                data.downstreamImpact.forEach(n => { html += '<div class="node-item ' + (n.type || 'CLASS') + '">' + escapeHtml(n.qualifiedName || n.name) + '</div>'; });
            } else { html += '<div style="color:#999;">无</div>'; }
            html += '</div>';
            html += '<div style="margin-bottom:15px;"><div style="font-weight:600;">影响评估：</div><div>总影响范围：' + (data.totalImpactCount || 0) + '</div><div>风险等级：' + (data.riskLevel || 'LOW') + '</div></div>';
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