// 项目分析相关功能
// 默认项目代码
const DEFAULT_PROJECT_CODE = 'default';

async function loadProjectAnalysis() {
    const overviewLoading = document.getElementById('overviewLoading');
    const overviewContent = document.getElementById('overviewContent');
    const analysisLoading = document.getElementById('analysisLoading');
    const analysisContent = document.getElementById('analysisContent');
    
    overviewLoading.style.display = 'block';
    overviewContent.style.display = 'none';
    if (analysisLoading) analysisLoading.style.display = 'block';
    if (analysisContent) analysisContent.style.display = 'none';
    
    try {
        const res = await fetch(`/api/code/projectAnalysis?projectCode=${DEFAULT_PROJECT_CODE}`);
        const data = await res.json();
        
        if (data.error && data.error !== 'null' && data.error !== null && data.error !== 'undefined') {
            overviewLoading.innerHTML = '<div class="error-text">' + escapeHtml(data.error) + '</div>';
            return;
        }
        
        projectAnalysis = data.analysis;
        renderProjectOverview(projectAnalysis);
        renderAnalysisDetails(projectAnalysis);
        
        overviewLoading.style.display = 'none';
        overviewContent.style.display = 'block';
        if (analysisLoading) analysisLoading.style.display = 'none';
        if (analysisContent) analysisContent.style.display = 'block';
        
    } catch (e) {
        console.error('加载项目分析失败:', e);
        overviewLoading.innerHTML = '<div class="error-text">加载失败: ' + escapeHtml(e.message) + '</div>';
    }
}

function renderProjectOverview(analysis) {
    let html = '';
    
    html += '<div class="architecture-box">';
    html += '<h3 style="margin-bottom:10px;">🏗️ 项目架构概览</h3>';
    if (analysis.mavenInfo) {
        html += '<div><strong>项目名称:</strong> ' + escapeHtml(analysis.mavenInfo.artifactId || '未知') + '</div>';
        html += '<div><strong>Group ID:</strong> ' + escapeHtml(analysis.mavenInfo.groupId || '未知') + '</div>';
        html += '<div><strong>版本:</strong> ' + escapeHtml(analysis.mavenInfo.version || '未知') + '</div>';
    }
    html += '</div>';
    
    html += '<div class="card-grid" style="margin-bottom:20px;">';
    if (analysis.packages) {
        html += '<div class="stat-box"><div class="number">' + analysis.packages.length + '</div><div class="label">包数量</div></div>';
    }
    if (analysis.controllers) {
        html += '<div class="stat-box"><div class="number">' + analysis.controllers.length + '</div><div class="label">控制器</div></div>';
    }
    if (analysis.services) {
        html += '<div class="stat-box"><div class="number">' + analysis.services.length + '</div><div class="label">服务类</div></div>';
    }
    if (analysis.repositories) {
        html += '<div class="stat-box"><div class="number">' + analysis.repositories.length + '</div><div class="label">数据访问</div></div>';
    }
    html += '</div>';
    
    document.getElementById('projectSummary').innerHTML = html;
    
    // 技术栈
    let techHtml = '<div class="card"><div class="card-title">🛠️ 技术栈</div>';
    if (analysis.springDependencies && analysis.springDependencies.length > 0) {
        techHtml += '<div style="margin-bottom:10px;"><strong>Spring:</strong><div class="tech-stack">';
        analysis.springDependencies.slice(0, 8).forEach(dep => {
            techHtml += '<span class="dep-tag">' + escapeHtml(dep.artifactId) + '</span>';
        });
        techHtml += '</div></div>';
    }
    if (analysis.databaseDependencies && analysis.databaseDependencies.length > 0) {
        techHtml += '<div style="margin-bottom:10px;"><strong>数据库:</strong><div class="tech-stack">';
        analysis.databaseDependencies.forEach(dep => {
            techHtml += '<span class="dep-tag">' + escapeHtml(dep.artifactId) + '</span>';
        });
        techHtml += '</div></div>';
    }
    if (analysis.webDependencies && analysis.webDependencies.length > 0) {
        techHtml += '<div><strong>Web:</strong><div class="tech-stack">';
        analysis.webDependencies.forEach(dep => {
            techHtml += '<span class="dep-tag">' + escapeHtml(dep.artifactId) + '</span>';
        });
        techHtml += '</div></div>';
    }
    techHtml += '</div>';
    document.getElementById('techStackSection').innerHTML = techHtml;
    
    // 架构层次
    let layerHtml = '<div class="card"><div class="card-title">📦 项目结构层次</div>';
    if (analysis.packages) {
        const layerMap = {};
        analysis.packages.forEach(pkg => {
            const desc = pkg.description || '其他模块';
            if (!layerMap[desc]) layerMap[desc] = [];
            layerMap[desc].push(pkg);
        });
        
        const order = ['API 控制器层 - 处理 HTTP 请求', '业务逻辑层 - 核心业务处理', '数据访问层 - 数据库操作', 
                      '数据模型层 - 数据结构定义', '配置层 - 框架配置', '其他模块'];
        
        order.forEach(desc => {
            if (layerMap[desc] && layerMap[desc].length > 0) {
                layerHtml += '<div style="margin-bottom:15px;"><strong>' + desc.split(' - ')[0] + '</strong>';
                layerMap[desc].slice(0, 5).forEach(pkg => {
                    layerHtml += '<div style="font-size:13px;color:#666;padding:4px 0;">📁 ' + escapeHtml(pkg.name) + '</div>';
                });
                if (layerMap[desc].length > 5) {
                    layerHtml += '<div style="font-size:12px;color:#999;">... 还有 ' + (layerMap[desc].length - 5) + ' 个</div>';
                }
                layerHtml += '</div>';
            }
        });
    }
    layerHtml += '</div>';
    document.getElementById('architectureLayers').innerHTML = layerHtml;
    
    // 代码变更历史分析
    if (analysis.codeChangeStats) {
        let changeHtml = '<div class="card"><div class="card-title">📊 代码变更历史分析</div>';
        changeHtml += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">';
        changeHtml += '<div class="quality-item">';
        changeHtml += '<div class="quality-label">总变更文件数</div>';
        changeHtml += '<div class="quality-value">' + analysis.codeChangeStats.totalFilesChanged + '</div>';
        changeHtml += '</div>';
        changeHtml += '<div class="quality-item">';
        changeHtml += '<div class="quality-label">新增行数</div>';
        changeHtml += '<div class="quality-value">' + analysis.codeChangeStats.totalLinesAdded + '</div>';
        changeHtml += '</div>';
        changeHtml += '<div class="quality-item">';
        changeHtml += '<div class="quality-label">删除行数</div>';
        changeHtml += '<div class="quality-value">' + analysis.codeChangeStats.totalLinesDeleted + '</div>';
        changeHtml += '</div>';
        changeHtml += '<div class="quality-item">';
        changeHtml += '<div class="quality-label">修改行数</div>';
        changeHtml += '<div class="quality-value">' + analysis.codeChangeStats.totalLinesModified + '</div>';
        changeHtml += '</div>';
        changeHtml += '</div>';
        
        // 变更类型分布
        if (analysis.codeChangeStats.changeTypeDistribution) {
            changeHtml += '<div style="margin-top: 15px;"><h4>变更类型分布</h4>';
            changeHtml += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            for (const [type, count] of Object.entries(analysis.codeChangeStats.changeTypeDistribution)) {
                changeHtml += '<div class="dep-tag">' + type + ': ' + count + '</div>';
            }
            changeHtml += '</div></div>';
        }
        
        // 文件类型分布
        if (analysis.codeChangeStats.fileTypeDistribution) {
            changeHtml += '<div style="margin-top: 15px;"><h4>文件类型分布</h4>';
            changeHtml += '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
            for (const [type, count] of Object.entries(analysis.codeChangeStats.fileTypeDistribution)) {
                changeHtml += '<div class="dep-tag">.' + type + ': ' + count + '</div>';
            }
            changeHtml += '</div></div>';
        }
        
        // 变更最多的文件
        if (analysis.codeChangeStats.mostChangedFiles && analysis.codeChangeStats.mostChangedFiles.length > 0) {
            changeHtml += '<div style="margin-top: 15px;"><h4>变更最多的文件</h4>';
            changeHtml += '<ul style="list-style-type: none; padding: 0;">';
            analysis.codeChangeStats.mostChangedFiles.forEach(file => {
                changeHtml += '<li style="padding: 5px 0; border-bottom: 1px solid #eee;">' + file + '</li>';
            });
            changeHtml += '</ul></div>';
        }
        changeHtml += '</div>';
        document.getElementById('codeChanges').innerHTML = changeHtml;
    }
    
    // 代码变更历史列表
    if (analysis.codeChangeHistory && analysis.codeChangeHistory.length > 0) {
        let historyHtml = '<div class="card"><div class="card-title">📋 代码变更历史</div>';
        historyHtml += '<div style="max-height: 400px; overflow-y: auto;">';
        analysis.codeChangeHistory.forEach(change => {
            const date = new Date(change.changeTime).toLocaleString();
            const totalChanges = change.linesAdded + change.linesDeleted + change.linesModified;
            historyHtml += '<div class="component-card">';
            historyHtml += '<div class="name">' + change.fileName + '</div>';
            historyHtml += '<div class="desc">';
            historyHtml += '变更类型: ' + change.changeType + ' | ';
            historyHtml += '时间: ' + date + ' | ';
            historyHtml += '作者: ' + change.author + '<br>';
            historyHtml += '新增: ' + change.linesAdded + ' 行 | ';
            historyHtml += '删除: ' + change.linesDeleted + ' 行 | ';
            historyHtml += '修改: ' + change.linesModified + ' 行 | ';
            historyHtml += '总计: ' + totalChanges + ' 行<br>';
            historyHtml += '提交信息: ' + change.commitMessage;
            historyHtml += '</div>';
            historyHtml += '</div>';
        });
        historyHtml += '</div>';
        historyHtml += '</div>';
        document.getElementById('changeHistory').innerHTML = historyHtml;
    }
}

function renderAnalysisDetails(analysis) {
    // Maven 依赖
    let mavenHtml = '<div class="card"><div class="card-title">📦 Maven 依赖详情</div>';
    if (analysis.springDependencies && analysis.springDependencies.length > 0) {
        mavenHtml += '<h4 style="margin:10px 0;">Spring 技术栈</h4><div class="tech-stack">';
        analysis.springDependencies.forEach(dep => {
            mavenHtml += '<span class="dep-tag">' + escapeHtml(dep.artifactId) + '</span>';
        });
        mavenHtml += '</div>';
    }
    if (analysis.databaseDependencies && analysis.databaseDependencies.length > 0) {
        mavenHtml += '<h4 style="margin:10px 0;">数据库相关</h4><div class="tech-stack">';
        analysis.databaseDependencies.forEach(dep => {
            mavenHtml += '<span class="dep-tag">' + escapeHtml(dep.artifactId) + '</span>';
        });
        mavenHtml += '</div>';
    }
    mavenHtml += '</div>';
    document.getElementById('mavenDeps').innerHTML = mavenHtml;
    
    // 应用配置
    let configHtml = '<div class="card"><div class="card-title">⚙️ 应用配置</div>';
    if (analysis.applicationConfig) {
        for (const [key, value] of Object.entries(analysis.applicationConfig)) {
            configHtml += '<div class="config-item"><span class="key">' + escapeHtml(key) + '</span><span class="value">' + escapeHtml(value) + '</span></div>';
        }
    } else {
        configHtml += '<div style="color:#666;">未找到配置文件</div>';
    }
    configHtml += '</div>';
    document.getElementById('springConfig').innerHTML = configHtml;
    
    // 组件列表
    let compHtml = '<div class="card"><div class="card-title">🎯 核心组件</div>';
    
    if (analysis.controllers && analysis.controllers.length > 0) {
        compHtml += '<h4 style="margin:10px 0;">🎮 控制器 (' + analysis.controllers.length + ')</h4>';
        analysis.controllers.forEach(ctrl => {
            compHtml += '<div class="component-card" onclick="selectComponent(\'' + escapeHtml(ctrl.qualifiedName) + '\')">';
            compHtml += '<div class="name">' + escapeHtml(ctrl.className) + '</div>';
            if (ctrl.description) {
                compHtml += '<div class="desc">' + escapeHtml(ctrl.description.substring(0, 100)) + '</div>';
            }
            compHtml += '</div>';
        });
    }
    
    if (analysis.services && analysis.services.length > 0) {
        compHtml += '<h4 style="margin:10px 0;">⚙️ 服务类 (' + analysis.services.length + ')</h4>';
        analysis.services.slice(0, 10).forEach(svc => {
            compHtml += '<div class="component-card" onclick="selectComponent(\'' + escapeHtml(svc.qualifiedName) + '\')">';
            compHtml += '<div class="name">' + escapeHtml(svc.className) + '</div>';
            if (svc.description) {
                compHtml += '<div class="desc">' + escapeHtml(svc.description.substring(0, 100)) + '</div>';
            }
            compHtml += '</div>';
        });
    }
    
    compHtml += '</div>';
    document.getElementById('componentLists').innerHTML = compHtml;
}

function selectComponent(qualifiedName) {
    document.querySelector('[data-tab="context"]').click();
    document.getElementById('nodeId').value = qualifiedName;
}