$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$spans = @(
    @{id="trace-web-001";type="HTTP";app="web-service";serviceName="web-service";methodName="GET /api/users";time=$timestamp;spend=150;success=$true},
    @{id="trace-db-001";type="SQL";app="web-service";serviceName="web-service";methodName="SELECT * FROM users";time=$timestamp;spend=50;success=$true},
    @{id="trace-redis-001";type="REDIS";app="web-service";serviceName="web-service";methodName="GET user:123";time=$timestamp;spend=10;success=$true},
    @{id="trace-rpc-001";type="RPC";app="order-service";serviceName="order-service";methodName="getOrderById";time=$timestamp;spend=200;success=$true}
)
$body = ConvertTo-Json -InputObject $spans -Depth 5
Write-Host "Sending $($spans.Count) spans..."
$response = Invoke-RestMethod -Uri 'http://localhost:8081/apm/report' -Method Post -ContentType 'application/json' -Body $body
Write-Host "Response: $response"