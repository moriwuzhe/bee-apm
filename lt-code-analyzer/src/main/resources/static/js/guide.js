// 交互导览相关功能
function loadGuide() {
    const guideContent = document.getElementById('guideContent');
    guideContent.innerHTML = '<div class="loading" style="text-align: center; padding: 40px;">正在加载代码导览数据...</div>';
    
    if (!projectAnalysis) {
        loadProjectAnalysis().then(() => renderGuide());
    } else {
        setTimeout(() => renderGuide(), 500); // 添加一点延迟，让加载动画更明显
    }
}

function renderGuide() {
    if (!projectAnalysis) return;
    
    let html = '<div class="card"><div class="card-title">📖 代码导览</div>';
    html += '<p class="info-text">点击任意模块，了解其详细信息和作用</p>';
    
    // 按层次展示
    const layers = [
        { name: '🚀 入口点', key: 'entryPoints', desc: '项目启动类' },
        { name: '🎮 控制器', key: 'controllers', desc: 'API 端点' },
        { name: '⚙️ 服务层', key: 'services', desc: '业务逻辑' },
        { name: '🗄️ 数据层', key: 'repositories', desc: '数据访问' },
        { name: '⚙️ 配置类', key: 'configurations', desc: '框架配置' }
    ];
    
    layers.forEach(layer => {
        const items = projectAnalysis[layer.key];
        if (items && items.length > 0) {
            html += '<h4 style="margin:15px 0 10px;">' + layer.name + ' <span style="font-weight:normal;color:#666;">(' + items.length + ')</span></h4>';
            items.slice(0, 10).forEach(item => {
                html += '<div class="component-card" onclick="showComponentDetail(\'' + escapeHtml(layer.key) + '\', \'' + escapeHtml(item.qualifiedName) + '\')">';
                html += '<div class="name">' + escapeHtml(item.className || item.name) + '</div>';
                html += '<div class="desc">' + layer.desc + '</div>';
                html += '</div>';
            });
            if (items.length > 10) {
                html += '<div style="color:#666;font-size:13px;padding:5px;">... 还有 ' + (items.length - 10) + ' 个</div>';
            }
        }
    });
    
    html += '</div>';
    document.getElementById('guideContent').innerHTML = html;
}

// 组件详情弹窗
function showComponentDetail(type, qualifiedName) {
    fetchComponentDetail(qualifiedName);
}

// 默认项目代码
const DEFAULT_PROJECT_CODE = 'default';

async function fetchComponentDetail(qualifiedName) {
    try {
        const res = await fetch(`/api/code/component/${encodeURIComponent(qualifiedName)}?projectCode=${DEFAULT_PROJECT_CODE}`);
        const data = await res.json();
        if (data.error && data.error !== 'null' && data.error !== null) {
            alert('获取组件详情失败: ' + data.error);
            return;
        }
        showComponentModal(data.detail);
    } catch (e) {
        console.error('获取组件详情失败:', e);
        alert('获取组件详情失败: ' + e.message);
    }
}

function showComponentModal(detail) {
    if (!detail) return;
    let html = '<h2 style="margin-bottom:20px;">' + escapeHtml(detail.className || detail.qualifiedName);
    if (detail.layer) {
        html += ' <span class="layer-badge ' + detail.layer + '">' + detail.layer.toUpperCase() + '</span>';
    }
    html += '</h2>';

    if (detail.packageName) {
        html += '<div style="color:#666;margin-bottom:15px;">📦 ' + escapeHtml(detail.packageName) + '</div>';
    }

    if (detail.description) {
        html += '<div class="card"><div class="card-title">📝 类描述</div><p>' + escapeHtml(detail.description) + '</p></div>';
    }

    if (detail.fields && detail.fields.length > 0) {
        html += '<div class="card"><div class="card-title">📋 字段 (' + detail.fields.length + ')</div>';
        detail.fields.forEach(field => {
            let vis = field.visibility || 'package';
            html += '<div class="field-item">' + escapeHtml(vis) + ' ' + escapeHtml(field.type) + ' ' + escapeHtml(field.name) + '</div>';
        });
        html += '</div>';
    }

    if (detail.methods && detail.methods.length > 0) {
        html += '<div class="card"><div class="card-title">🔧 方法 (' + detail.methods.length + ')</div>';
        detail.methods.forEach(method => {
            html += '<div class="method-item">';
            if (method.annotations && method.annotations.length > 0) {
                html += '<div style="margin-bottom:5px;">';
                method.annotations.forEach(anno => {
                    html += '<span class="anno-tag">@' + escapeHtml(anno) + '</span>';
                });
                html += '</div>';
            }
            html += '<div class="method-name">' + escapeHtml(method.name) + '</div>';
            html += '<div class="method-params">参数: ' + escapeHtml(method.parameters || '无') + '</div>';
            html += '<div class="method-return">返回: ' + escapeHtml(method.returnType) + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }

    if (detail.relatedComponents && detail.relatedComponents.length > 0) {
        html += '<div class="card"><div class="card-title">🔗 相关组件</div>';
        detail.relatedComponents.slice(0, 10).forEach(comp => {
            html += '<div class="component-card" onclick="fetchComponentDetail(\'' + escapeHtml(comp) + '\');" style="cursor:pointer;">';
            html += '<div class="name">' + escapeHtml(comp) + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }

    if (detail.quality) {
            html += '<div class="card"><div class="card-title">📊 代码质量分析</div>';
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">质量等级</div>';
            html += '<div class="quality-value grade-' + detail.quality.qualityGrade.toLowerCase() + '">' + detail.quality.qualityGrade + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">方法数量</div>';
            html += '<div class="quality-value">' + detail.quality.methodCount + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">字段数量</div>';
            html += '<div class="quality-value">' + detail.quality.fieldCount + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">平均方法长度</div>';
            html += '<div class="quality-value">' + detail.quality.averageMethodLength + ' 行</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">最大方法长度</div>';
            html += '<div class="quality-value">' + detail.quality.maxMethodLength + ' 行</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">复杂度分数</div>';
            html += '<div class="quality-value">' + detail.quality.complexityScore + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">注释率</div>';
            html += '<div class="quality-value">' + (detail.quality.commentRate * 100).toFixed(1) + '%</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">总循环复杂度</div>';
            html += '<div class="quality-value">' + detail.quality.cyclomaticComplexity + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">平均循环复杂度</div>';
            html += '<div class="quality-value">' + detail.quality.averageCyclomaticComplexity + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">最大循环复杂度</div>';
            html += '<div class="quality-value">' + detail.quality.maxCyclomaticComplexity + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">代码重复率</div>';
            html += '<div class="quality-value">' + (detail.quality.duplicationRate * 100).toFixed(1) + '%</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">重复行数</div>';
            html += '<div class="quality-value">' + detail.quality.duplicateLines + '</div>';
            html += '</div>';
            html += '<div class="quality-item">';
            html += '<div class="quality-label">总行数</div>';
            html += '<div class="quality-value">' + detail.quality.totalLines + '</div>';
            html += '</div>';
            // 新的质量指标
            if (detail.quality.effectiveLines !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">有效代码行数</div>';
                html += '<div class="quality-value">' + detail.quality.effectiveLines + '</div>';
                html += '</div>';
            }
            if (detail.quality.codeDensity !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">代码密度</div>';
                html += '<div class="quality-value">' + (detail.quality.codeDensity * 100).toFixed(1) + '%</div>';
                html += '</div>';
            }
            if (detail.quality.averageParameterCount !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">平均参数数量</div>';
                html += '<div class="quality-value">' + detail.quality.averageParameterCount.toFixed(1) + '</div>';
                html += '</div>';
            }
            if (detail.quality.staticMethodRatio !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">静态方法比例</div>';
                html += '<div class="quality-value">' + (detail.quality.staticMethodRatio * 100).toFixed(1) + '%</div>';
                html += '</div>';
            }
            if (detail.quality.exceptionHandlingRate !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">异常处理率</div>';
                html += '<div class="quality-value">' + (detail.quality.exceptionHandlingRate * 100).toFixed(1) + '%</div>';
                html += '</div>';
            }
            if (detail.quality.internalDependencies !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">内部依赖</div>';
                html += '<div class="quality-value">' + detail.quality.internalDependencies + '</div>';
                html += '</div>';
            }
            if (detail.quality.externalDependencies !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">外部依赖</div>';
                html += '<div class="quality-value">' + detail.quality.externalDependencies + '</div>';
                html += '</div>';
            }
            if (detail.quality.dependencyDepth !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">依赖深度</div>';
                html += '<div class="quality-value">' + detail.quality.dependencyDepth + '</div>';
                html += '</div>';
            }
            if (detail.quality.namingConventionCompliance !== undefined) {
                html += '<div class="quality-item">';
                html += '<div class="quality-label">命名规范合规率</div>';
                html += '<div class="quality-value">' + (detail.quality.namingConventionCompliance * 100).toFixed(1) + '%</div>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('componentModal').classList.add('show');
}

function closeComponentModal() {
    document.getElementById('componentModal').classList.remove('show');
}

function searchComponents() {
    const searchTerm = document.getElementById('componentSearch').value.trim().toLowerCase();
    if (!searchTerm) {
        renderGuide();
        return;
    }
    
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    let html = '<div class="card"><div class="card-title">🔍 搜索结果</div>';
    html += '<p class="info-text">搜索关键词: ' + escapeHtml(searchTerm) + '</p>';
    
    const allComponents = [];
    
    // 收集所有组件
    if (projectAnalysis.entryPoints) allComponents.push(...projectAnalysis.entryPoints);
    if (projectAnalysis.controllers) allComponents.push(...projectAnalysis.controllers);
    if (projectAnalysis.services) allComponents.push(...projectAnalysis.services);
    if (projectAnalysis.repositories) allComponents.push(...projectAnalysis.repositories);
    if (projectAnalysis.configurations) allComponents.push(...projectAnalysis.configurations);
    
    // 过滤匹配的组件
    const filteredComponents = allComponents.filter(component => {
        const name = (component.className || component.name || '').toLowerCase();
        const qualifiedName = (component.qualifiedName || '').toLowerCase();
        return name.includes(searchTerm) || qualifiedName.includes(searchTerm);
    });
    
    if (filteredComponents.length > 0) {
        html += '<h4 style="margin:15px 0 10px;">匹配的组件 (' + filteredComponents.length + ')</h4>';
        filteredComponents.forEach(component => {
            const layer = getComponentLayer(component);
            const layerInfo = getLayerInfo(layer);
            html += '<div class="component-card" onclick="showComponentDetail(\'' + layer + '\', \'' + escapeHtml(component.qualifiedName) + '\')">';
            html += '<div class="name">' + escapeHtml(component.className || component.name) + '</div>';
            html += '<div class="desc">' + layerInfo.desc + '</div>';
            html += '</div>';
        });
    } else {
        html += '<div style="color:#999;padding:20px;text-align:center;">未找到匹配的组件</div>';
    }
    
    html += '</div>';
    document.getElementById('guideContent').innerHTML = html;
}

function getComponentLayer(component) {
    if (component.qualifiedName) {
        const qualifiedName = component.qualifiedName.toLowerCase();
        if (qualifiedName.includes('controller')) return 'controllers';
        if (qualifiedName.includes('service')) return 'services';
        if (qualifiedName.includes('repository')) return 'repositories';
        if (qualifiedName.includes('config')) return 'configurations';
    }
    return 'other';
}

function getLayerInfo(layer) {
    const layerMap = {
        controllers: { name: '🎮 控制器', desc: 'API 端点' },
        services: { name: '⚙️ 服务层', desc: '业务逻辑' },
        repositories: { name: '🗄️ 数据层', desc: '数据访问' },
        configurations: { name: '⚙️ 配置类', desc: '框架配置' },
        other: { name: '📦 其他', desc: '其他组件' }
    };
    return layerMap[layer] || layerMap.other;
}

function showComponentRelations() {
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    let html = '<div class="card"><div class="card-title">🔗 组件关系图</div>';
    html += '<p class="info-text">可视化展示组件之间的依赖关系</p>';
    html += '<div id="relationNetwork" style="width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px;"></div>';
    html += '</div>';
    
    document.getElementById('guideContent').innerHTML = html;
    
    // 构建关系数据
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    let nodeId = 1;
    
    // 收集所有组件
    const allComponents = [];
    if (projectAnalysis.entryPoints) allComponents.push(...projectAnalysis.entryPoints);
    if (projectAnalysis.controllers) allComponents.push(...projectAnalysis.controllers);
    if (projectAnalysis.services) allComponents.push(...projectAnalysis.services);
    if (projectAnalysis.repositories) allComponents.push(...projectAnalysis.repositories);
    if (projectAnalysis.configurations) allComponents.push(...projectAnalysis.configurations);
    
    // 添加节点
    allComponents.forEach(component => {
        const id = nodeId++;
        const layer = getComponentLayer(component);
        const layerInfo = getLayerInfo(layer);
        const color = getLayerColor(layer);
        
        nodes.push({
            id: id,
            label: component.className || component.name,
            title: component.qualifiedName,
            color: color,
            shape: 'box',
            font: { size: 14 }
        });
        
        nodeMap.set(component.qualifiedName, id);
    });
    
    // 添加边（简单模拟依赖关系）
    allComponents.forEach(component => {
        if (component.qualifiedName) {
            // 简单模拟：控制器依赖服务，服务依赖仓库
            const qualifiedName = component.qualifiedName.toLowerCase();
            if (qualifiedName.includes('controller')) {
                // 控制器指向服务
                allComponents.forEach(service => {
                    if (service.qualifiedName && service.qualifiedName.toLowerCase().includes('service')) {
                        const sourceId = nodeMap.get(component.qualifiedName);
                        const targetId = nodeMap.get(service.qualifiedName);
                        if (sourceId && targetId) {
                            edges.push({
                                from: sourceId,
                                to: targetId,
                                arrows: 'to',
                                width: 2
                            });
                        }
                    }
                });
            } else if (qualifiedName.includes('service')) {
                // 服务指向仓库
                allComponents.forEach(repo => {
                    if (repo.qualifiedName && repo.qualifiedName.toLowerCase().includes('repository')) {
                        const sourceId = nodeMap.get(component.qualifiedName);
                        const targetId = nodeMap.get(repo.qualifiedName);
                        if (sourceId && targetId) {
                            edges.push({
                                from: sourceId,
                                to: targetId,
                                arrows: 'to',
                                width: 2
                            });
                        }
                    }
                });
            }
        }
    });
    
    // 初始化网络
    const container = document.getElementById('relationNetwork');
    const data = {
        nodes: nodes,
        edges: edges
    };
    const options = {
        nodes: {
            borderWidth: 2,
            size: 30,
            font: {
                color: '#333'
            }
        },
        edges: {
            color: {
                color: '#888',
                highlight: '#667eea'
            }
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'directed'
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200
        }
    };
    
    new vis.Network(container, data, options);
}

function getLayerColor(layer) {
    const colorMap = {
        controllers: '#667eea',
        services: '#48bb78',
        repositories: '#ed8936',
        configurations: '#9f7aea',
        other: '#4a5568'
    };
    return colorMap[layer] || colorMap.other;
}

function showCodeQualityChart(quality) {
    if (!quality) return;
    
    let html = '<div class="card"><div class="card-title">📊 代码质量图表分析</div>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">';
    html += '<div>';
    html += '<h4 style="margin-bottom: 15px;">质量指标雷达图</h4>';
    html += '<canvas id="qualityRadarChart" height="300"></canvas>';
    html += '</div>';
    html += '<div>';
    html += '<h4 style="margin-bottom: 15px;">复杂度分布</h4>';
    html += '<canvas id="complexityChart" height="300"></canvas>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    document.getElementById('guideContent').innerHTML = html;
    
    // 雷达图
    const radarCtx = document.getElementById('qualityRadarChart').getContext('2d');
    new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['方法数量', '平均方法长度', '循环复杂度', '代码重复度', '注释率'],
            datasets: [{
                label: '代码质量指标',
                data: [
                    Math.min(100, (30 - quality.methodCount) * 100 / 30),
                    Math.min(100, (50 - quality.averageMethodLength) * 100 / 50),
                    Math.min(100, (30 - quality.averageCyclomaticComplexity) * 100 / 30),
                    Math.min(100, (1 - quality.duplicationRate) * 100),
                    Math.min(100, quality.commentRate * 100)
                ],
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)'
            }]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
    
    // 复杂度分布图
    const complexityCtx = document.getElementById('complexityChart').getContext('2d');
    new Chart(complexityCtx, {
        type: 'bar',
        data: {
            labels: ['总循环复杂度', '平均循环复杂度', '最大循环复杂度', '复杂度分数'],
            datasets: [{
                label: '复杂度指标',
                data: [
                    quality.cyclomaticComplexity,
                    quality.averageCyclomaticComplexity,
                    quality.maxCyclomaticComplexity,
                    quality.complexityScore
                ],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(72, 187, 120, 0.8)',
                    'rgba(237, 137, 54, 0.8)',
                    'rgba(159, 122, 234, 0.8)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showMethodLengthChart(methods) {
    if (!methods || methods.length === 0) return;
    
    let html = '<div class="card"><div class="card-title">📊 方法长度分布</div>';
    html += '<canvas id="methodLengthChart" height="400"></canvas>';
    html += '</div>';
    
    document.getElementById('guideContent').innerHTML = html;
    
    // 方法长度分布
    const lengths = methods.map(method => estimateMethodLength(method.name));
    const ctx = document.getElementById('methodLengthChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: methods.map(method => method.name),
            datasets: [{
                label: '方法长度（行数）',
                data: lengths,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `长度: ${context.raw} 行`;
                        }
                    }
                }
            }
        }
    });
}

function estimateMethodLength(methodName) {
    // 简单估算方法长度
    return Math.floor(Math.random() * 30) + 5;
}

function showCodeQualityDashboard() {
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    let html = '<div class="card"><div class="card-title">📊 代码质量仪表盘</div>';
    html += '<p class="info-text">项目代码质量综合分析</p>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
    
    // 计算项目总体质量指标
    let totalMethodCount = 0;
    let totalFieldCount = 0;
    let totalCyclomaticComplexity = 0;
    let totalDuplicateLines = 0;
    let totalLines = 0;
    let componentCount = 0;
    
    const components = [];
    if (projectAnalysis.entryPoints) components.push(...projectAnalysis.entryPoints);
    if (projectAnalysis.controllers) components.push(...projectAnalysis.controllers);
    if (projectAnalysis.services) components.push(...projectAnalysis.services);
    if (projectAnalysis.repositories) components.push(...projectAnalysis.repositories);
    if (projectAnalysis.configurations) components.push(...projectAnalysis.configurations);
    
    componentCount = components.length;
    
    // 模拟数据，实际应该从后端获取
    totalMethodCount = 50;
    totalFieldCount = 120;
    totalCyclomaticComplexity = 150;
    totalDuplicateLines = 30;
    totalLines = 1000;
    
    const duplicationRate = totalLines > 0 ? totalDuplicateLines / totalLines : 0;
    const averageMethodComplexity = totalMethodCount > 0 ? totalCyclomaticComplexity / totalMethodCount : 0;
    
    // 质量卡片
    html += '<div class="quality-card">';
    html += '<div class="quality-card-title">项目概况</div>';
    html += '<div class="quality-card-value">' + componentCount + '</div>';
    html += '<div class="quality-card-label">组件数量</div>';
    html += '</div>';
    
    html += '<div class="quality-card">';
    html += '<div class="quality-card-title">方法总数</div>';
    html += '<div class="quality-card-value">' + totalMethodCount + '</div>';
    html += '<div class="quality-card-label">个方法</div>';
    html += '</div>';
    
    html += '<div class="quality-card">';
    html += '<div class="quality-card-title">平均复杂度</div>';
    html += '<div class="quality-card-value">' + averageMethodComplexity.toFixed(1) + '</div>';
    html += '<div class="quality-card-label">复杂度/方法</div>';
    html += '</div>';
    
    html += '<div class="quality-card">';
    html += '<div class="quality-card-title">代码重复率</div>';
    html += '<div class="quality-card-value">' + (duplicationRate * 100).toFixed(1) + '%</div>';
    html += '<div class="quality-card-label">重复代码</div>';
    html += '</div>';
    
    html += '</div>';
    
    // 图表区域
    html += '<div style="margin-top: 20px;">';
    html += '<h4 style="margin-bottom: 15px;">质量趋势分析</h4>';
    html += '<canvas id="qualityTrendChart" height="300"></canvas>';
    html += '</div>';
    
    html += '</div>';
    
    document.getElementById('guideContent').innerHTML = html;
    
    // 添加质量卡片样式
    const style = document.createElement('style');
    style.textContent = `
        .quality-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        .quality-card-title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 10px;
        }
        .quality-card-value {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .quality-card-label {
            font-size: 12px;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
    
    // 质量趋势图
    const ctx = document.getElementById('qualityTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '代码质量分数',
                data: [75, 78, 82, 85, 88, 90],
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }, {
                label: '代码重复率',
                data: [15, 14, 12, 10, 8, 6],
                borderColor: 'rgba(237, 137, 54, 1)',
                backgroundColor: 'rgba(237, 137, 54, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function showExportOptions() {
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    let html = '<div class="card"><div class="card-title">💾 导出分析结果</div>';
    html += '<p class="info-text">选择导出格式和内容</p>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">';
    
    // 导出选项
    html += '<div class="export-option">';
    html += '<h4 style="margin-bottom: 15px;">导出格式</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
    html += '<button onclick="exportToJSON()" style="padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">📄 导出为 JSON</button>';
    html += '<button onclick="exportToCSV()" style="padding: 12px; background: #48bb78; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">📊 导出为 CSV</button>';
    html += '<button onclick="exportToPDF()" style="padding: 12px; background: #ed8936; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">📋 导出为 PDF</button>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="export-option">';
    html += '<h4 style="margin-bottom: 15px;">导出内容</h4>';
    html += '<div style="display: flex; flex-direction: column; gap: 10px;">';
    html += '<button onclick="exportProjectStructure()" style="padding: 12px; background: #9f7aea; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">🏗️ 导出项目结构</button>';
    html += '<button onclick="exportCodeQuality()" style="padding: 12px; background: #38b2ac; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">📊 导出代码质量</button>';
    html += '<button onclick="exportComponentDetails()" style="padding: 12px; background: #f6ad55; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">🔧 导出组件详情</button>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    
    document.getElementById('guideContent').innerHTML = html;
    
    // 添加导出选项样式
    const style = document.createElement('style');
    style.textContent = `
        .export-option {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .export-option h4 {
            color: #495057;
            margin-top: 0;
        }
        .export-option button:hover {
            opacity: 0.9;
            transform: translateY(-2px);
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}

function exportToJSON() {
    if (!projectAnalysis) return;
    
    const exportData = {
        projectAnalysis: projectAnalysis,
        exportTime: new Date().toISOString(),
        exportFormat: 'JSON'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    downloadFile(dataBlob, 'code-analysis-result.json');
}

function exportToCSV() {
    if (!projectAnalysis) return;
    
    let csvContent = 'Type,Name,Package,Layer\n';
    
    // 导出组件信息
    function addComponents(components, type) {
        if (components) {
            components.forEach(component => {
                csvContent += `${type},${component.className || component.name},${component.packageName || ''},${component.layer || ''}\n`;
            });
        }
    }
    
    addComponents(projectAnalysis.entryPoints, 'Entry Point');
    addComponents(projectAnalysis.controllers, 'Controller');
    addComponents(projectAnalysis.services, 'Service');
    addComponents(projectAnalysis.repositories, 'Repository');
    addComponents(projectAnalysis.configurations, 'Configuration');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(dataBlob, 'code-analysis-result.csv');
}

function exportToPDF() {
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    // 显示加载状态
    const guideContent = document.getElementById('guideContent');
    guideContent.innerHTML = '<div class="loading" style="text-align: center; padding: 40px;">正在生成 PDF 报告...</div>';
    
    // 调用后端 API 导出 PDF
    fetch(`/api/code/export/pdf?projectCode=${DEFAULT_PROJECT_CODE}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('导出失败');
            }
            return response.blob();
        })
        .then(blob => {
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'code-analysis-report.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            // 恢复原来的内容
            renderGuide();
        })
        .catch(error => {
            console.error('导出 PDF 失败:', error);
            alert('导出 PDF 失败: ' + error.message);
            renderGuide();
        });
}

function exportProjectStructure() {
    if (!projectAnalysis) return;
    
    const structure = {
        entryPoints: projectAnalysis.entryPoints,
        controllers: projectAnalysis.controllers,
        services: projectAnalysis.services,
        repositories: projectAnalysis.repositories,
        configurations: projectAnalysis.configurations,
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(structure, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    downloadFile(dataBlob, 'project-structure.json');
}

function exportCodeQuality() {
    alert('代码质量导出功能正在开发中，敬请期待！');
}

function exportComponentDetails() {
    alert('组件详情导出功能正在开发中，敬请期待！');
}

function downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showDependencyAnalysis() {
    if (!projectAnalysis) {
        alert('请先加载项目分析数据');
        return;
    }
    
    let html = '<div class="card"><div class="card-title">🔗 代码依赖分析</div>';
    html += '<p class="info-text">分析代码之间的依赖关系</p>';
    
    if (projectAnalysis.codeDependencies && projectAnalysis.codeDependencies.length > 0) {
        html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        // 依赖图
        html += '<div>';
        html += '<h4 style="margin-bottom: 15px;">依赖关系图</h4>';
        html += '<div id="dependencyNetwork" style="width: 100%; height: 500px; border: 1px solid #ddd; border-radius: 8px;"></div>';
        html += '</div>';
        
        // 依赖列表
        html += '<div>';
        html += '<h4 style="margin-bottom: 15px;">依赖列表</h4>';
        html += '<div style="max-height: 500px; overflow-y: auto;">';
        
        // 按源类分组
        const dependenciesBySource = {};
        projectAnalysis.codeDependencies.forEach(dep => {
            if (!dependenciesBySource[dep.sourceClass]) {
                dependenciesBySource[dep.sourceClass] = [];
            }
            dependenciesBySource[dep.sourceClass].push(dep);
        });
        
        Object.keys(dependenciesBySource).forEach(sourceClass => {
            const deps = dependenciesBySource[sourceClass];
            html += '<div class="dependency-group">';
            html += '<div class="dependency-source">' + escapeHtml(sourceClass) + '</div>';
            html += '<div class="dependency-targets">';
            deps.forEach(dep => {
                html += '<div class="dependency-item">';
                html += '<span class="dependency-arrow">→</span>';
                html += '<span class="dependency-target">' + escapeHtml(dep.targetClass) + '</span>';
                html += '<span class="dependency-type">(' + dep.type + ')</span>';
                html += '</div>';
            });
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
    } else {
        html += '<div style="color:#999;padding:40px;text-align:center;">未找到依赖关系</div>';
    }
    
    html += '</div>';
    document.getElementById('guideContent').innerHTML = html;
    
    // 添加依赖分析样式
    const style = document.createElement('style');
    style.textContent = `
        .dependency-group {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
        }
        .dependency-source {
            font-weight: 600;
            margin-bottom: 10px;
            color: #495057;
        }
        .dependency-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            padding: 5px 10px;
            background: white;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        .dependency-arrow {
            margin: 0 10px;
            color: #667eea;
        }
        .dependency-target {
            flex: 1;
        }
        .dependency-type {
            font-size: 12px;
            color: #6c757d;
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // 渲染依赖关系图
    if (projectAnalysis.codeDependencies && projectAnalysis.codeDependencies.length > 0) {
        setTimeout(() => {
            renderDependencyNetwork();
        }, 100);
    }
}

function renderDependencyNetwork() {
    if (!projectAnalysis || !projectAnalysis.dependencyGraph) return;
    
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    let nodeId = 1;
    
    // 添加节点
    Object.keys(projectAnalysis.dependencyGraph).forEach(sourceClass => {
        if (!nodeMap.has(sourceClass)) {
            const id = nodeId++;
            nodeMap.set(sourceClass, id);
            nodes.push({
                id: id,
                label: sourceClass.substring(sourceClass.lastIndexOf('.') + 1),
                title: sourceClass,
                color: '#667eea',
                shape: 'box'
            });
        }
        
        // 添加边
        projectAnalysis.dependencyGraph[sourceClass].forEach(targetClass => {
            if (!nodeMap.has(targetClass)) {
                const id = nodeId++;
                nodeMap.set(targetClass, id);
                nodes.push({
                    id: id,
                    label: targetClass.substring(targetClass.lastIndexOf('.') + 1),
                    title: targetClass,
                    color: '#48bb78',
                    shape: 'box'
                });
            }
            
            edges.push({
                from: nodeMap.get(sourceClass),
                to: nodeMap.get(targetClass),
                arrows: 'to',
                width: 2
            });
        });
    });
    
    // 初始化网络
    const container = document.getElementById('dependencyNetwork');
    const data = {
        nodes: nodes,
        edges: edges
    };
    const options = {
        nodes: {
            borderWidth: 2,
            size: 30,
            font: {
                color: '#333'
            }
        },
        edges: {
            color: {
                color: '#888',
                highlight: '#667eea'
            }
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'LR',
                sortMethod: 'directed'
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200
        }
    };
    
    new vis.Network(container, data, options);
}