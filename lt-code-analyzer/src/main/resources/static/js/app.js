let graph = null;
let projectAnalysis = null;

// 页面加载完成后执行
window.onload = async function() {
    await loadGraph();
    loadProjectAnalysis();
    loadExampleQueries();
};

// 标签页切换处理
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const tabId = this.dataset.tab;
        document.getElementById(`${tabId}-tab`).classList.add('active');
        if (tabId === 'visualize') loadGraphVisual();
        if (tabId === 'overview') loadProjectAnalysis();
        if (tabId === 'analysis') loadProjectAnalysis();
        if (tabId === 'guide') loadGuide();
        if (tabId === 'wizard') loadWizard();
        if (tabId === 'docs') loadDocumentation();
        if (tabId === 'examples') loadExampleQueries();
    });
});

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}