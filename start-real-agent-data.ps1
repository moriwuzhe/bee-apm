# 模拟真实Agent数据上报脚本
# 持续向后端上报Span数据，模拟真实业务场景

$baseUrl = "http://localhost:8081/apm/report"
$apps = @("order-service", "payment-service", "user-service", "inventory-service", "api-gateway")
$methods = @("createOrder", "updateOrder", "getOrder", "payOrder", "refundOrder", "createUser", "getUser", "updateUser", "checkInventory", "deductInventory")
$types = @("HTTP", "JDBC", "RPC", "CACHE", "MQ")
$errors = @($null, $null, $null, $null, "TimeoutException", "NullPointerException", $null, $null, "ConnectionException", $null)

Write-Host "=== 启动模拟Agent数据上报 ==="
Write-Host "后端地址: $baseUrl"
Write-Host "按 Ctrl+C 停止`n"

# 注册所有应用
foreach ($app in $apps) {
    $registerBody = @{
        app = $app
        env = "production"
        inst = "instance-01"
        ip = "192.168.1.100"
        port = 8080
        agentVersion = "2.0.1"
    } | ConvertTo-Json

    try {
        Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $registerBody -ContentType "application/json" -UseBasicParsing | Out-Null
        Write-Host "已注册应用: $app"
    } catch {
        Write-Host "注册失败: $app - $_"
    }
}

Write-Host "`n=== 开始持续上报数据 ==="

$counter = 0
while ($true) {
    $counter++
    
    # 生成一批Span数据
    $spanBatch = @()
    $groupId = "trace-group-" + [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    
    for ($i = 0; $i -lt 5; $i++) {
        $app = $apps | Get-Random
        $method = $methods | Get-Random
        $type = $types | Get-Random
        $error = $errors | Get-Random
        $success = $error -eq $null
        
        $span = @{
            id = "trace-" + [DateTimeOffset]::Now.ToUnixTimeMilliseconds() + "-$i"
            type = $type
            app = $app
            env = "production"
            inst = "instance-01"
            ip = "192.168.1.100"
            pid = "12345"
            gid = $groupId
            spend = Get-Random -Minimum 5 -Maximum 500
            port = "8080"
            time = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
            tags = @{
                serviceName = $app
                methodName = $method
                parentId = if ($i -eq 0) { "" } else { "trace-parent-$i" }
                success = $success
                errorMsg = $error
            }
        }
        
        $spanBatch += $span
    }
    
    $body = $spanBatch | ConvertTo-Json
    
    try {
        Invoke-WebRequest -Uri "$baseUrl" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
        Write-Host "批次 ${counter}: 上报了 5 条Span数据"
    } catch {
        Write-Host "上报失败: $_"
    }
    
    # 发送心跳
    foreach ($app in $apps) {
        $heartbeatBody = @{
            app = $app
            ip = "192.168.1.100"
            inst = "instance-01"
        } | ConvertTo-Json
        
        try {
            Invoke-WebRequest -Uri "$baseUrl/heartbeat" -Method POST -Body $heartbeatBody -ContentType "application/json" -UseBasicParsing | Out-Null
        } catch {
            Write-Host "心跳失败: $app"
        }
    }
    
    Start-Sleep -Seconds 2
}
