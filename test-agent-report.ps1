# Agent数据上报测试脚本
$baseUrl = "http://localhost:8081/apm/report"

Write-Host "=== 测试Agent注册 ==="
$registerBody = @{
    app = "order-service"
    env = "production"
    inst = "instance-01"
    ip = "192.168.1.100"
    port = 8080
    agentVersion = "2.0.1"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/register" -Method POST -Body $registerBody -ContentType "application/json" -UseBasicParsing
    Write-Host "注册成功: $($response.Content)"
} catch {
    Write-Host "注册失败: $_"
}

Write-Host "`n=== 测试Agent心跳 ==="
$heartbeatBody = @{
    app = "order-service"
    ip = "192.168.1.100"
    inst = "instance-01"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/heartbeat" -Method POST -Body $heartbeatBody -ContentType "application/json" -UseBasicParsing
    Write-Host "心跳成功: $($response.Content)"
} catch {
    Write-Host "心跳失败: $_"
}

Write-Host "`n=== 测试Span上报 ==="
$spanBody = @(
    @{
        id = "trace-001"
        type = "HTTP"
        app = "order-service"
        env = "production"
        inst = "instance-01"
        ip = "192.168.1.100"
        pid = "12345"
        gid = "group-01"
        spend = 150
        port = "8080"
        time = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        tags = @{
            serviceName = "order-service"
            methodName = "createOrder"
            parentId = ""
            success = $true
        }
    },
    @{
        id = "trace-002"
        type = "JDBC"
        app = "order-service"
        env = "production"
        inst = "instance-01"
        ip = "192.168.1.100"
        pid = "12345"
        gid = "group-01"
        spend = 50
        port = "8080"
        time = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        tags = @{
            serviceName = "order-service"
            methodName = "saveOrder"
            parentId = "trace-001"
            success = $true
        }
    },
    @{
        id = "trace-003"
        type = "HTTP"
        app = "payment-service"
        env = "production"
        inst = "instance-02"
        ip = "192.168.1.101"
        pid = "12346"
        gid = "group-01"
        spend = 200
        port = "8081"
        time = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
        tags = @{
            serviceName = "payment-service"
            methodName = "payOrder"
            parentId = "trace-001"
            success = $true
        }
    }
) | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl" -Method POST -Body $spanBody -ContentType "application/json" -UseBasicParsing
    Write-Host "Span上报成功: $($response.Content)"
} catch {
    Write-Host "Span上报失败: $_"
}

Write-Host "`n=== 验证数据 ==="
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/apm/traces" -Method GET -UseBasicParsing
    Write-Host "获取Trace数据成功，数量: $($response.Content | ConvertFrom-Json | Select-Object -ExpandProperty data | Measure-Object).Count"
} catch {
    Write-Host "获取Trace数据失败: $_"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/apm/agent" -Method GET -UseBasicParsing
    Write-Host "获取Agent数据成功: $($response.Content)"
} catch {
    Write-Host "获取Agent数据失败: $_"
}

Write-Host "`n=== 测试完成 ==="
