// 使用向导和文档功能
async function loadWizard() {
    const wizardContent = document.getElementById('wizardContent');
    try {
        const res = await fetch('/api/code/usageGuide');
        const data = await res.json();
        if (data.error && data.error !== 'null' && data.error !== null && data.error !== 'undefined') {
            wizardContent.innerHTML = '<div class="error-text">加载失败: ' + escapeHtml(data.error) + '</div>';
            return;
        }
        renderWizard(data.guide);
    } catch (e) {
        console.error('加载使用向导失败:', e);
        wizardContent.innerHTML = '<div class="error-text">加载失败: ' + escapeHtml(e.message) + '</div>';
    }
}

function renderWizard(guide) {
    let html = '';
    if (guide && guide.steps && guide.steps.length > 0) {
        guide.steps.forEach(step => {
            html += '<div class="guide-step">';
            html += '<span class="step-num">' + step.step + '</span>';
            html += '<span class="step-title">' + escapeHtml(step.title) + '</span>';
            html += '<div class="step-content">' + escapeHtml(step.content) + '</div>';
            html += '<div class="step-action">👉 ' + escapeHtml(step.action) + '</div>';
            html += '</div>';
        });
    }
    if (guide && guide.quickStarts && guide.quickStarts.length > 0) {
        html += '<h3 style="margin:20px 0 10px;">🚀 快速入口</h3>';
        guide.quickStarts.forEach(qs => {
            html += '<div class="quick-start-card" onclick="document.querySelector(\'[data-tab=guide]\').click();">';
            html += '<div class="qs-title">' + escapeHtml(qs.title) + '</div>';
            html += '<div class="qs-desc">' + escapeHtml(qs.description) + '</div>';
            html += '</div>';
        });
    }
    document.getElementById('wizardContent').innerHTML = html || '<div style="color:#999;">暂无向导信息</div>';
}

let cachedDocumentation = null;

async function loadDocumentation() {
    const docsLoading = document.getElementById('docsLoading');
    const docsContent = document.getElementById('docsContent');
    docsLoading.style.display = 'block';
    docsContent.style.display = 'none';
    try {
        const res = await fetch('/api/code/documentation');
        const data = await res.json();
        if (data.error && data.error !== 'null' && data.error !== null && data.error !== 'undefined') {
            docsLoading.innerHTML = '<div class="error-text">加载失败: ' + escapeHtml(data.error) + '</div>';
            return;
        }
        cachedDocumentation = data.documentation;
        document.getElementById('docText').textContent = data.documentation;
        docsLoading.style.display = 'none';
        docsContent.style.display = 'block';
    } catch (e) {
        console.error('加载文档失败:', e);
        docsLoading.innerHTML = '<div class="error-text">加载失败: ' + escapeHtml(e.message) + '</div>';
    }
}

function downloadDocumentation() {
    if (!cachedDocumentation) {
        alert('请先加载文档');
        return;
    }
    const blob = new Blob([cachedDocumentation], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '项目文档.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}