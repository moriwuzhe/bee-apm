$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$spans = @(
    @{id="trace-002";type="HTTP";app="payment-service";serviceName="payment-service";methodName="processPayment";time=$timestamp;spend=200;success=$true},
    @{id="trace-002";type="SQL";app="order-service";serviceName="order-service";methodName="queryOrders";time=$timestamp;spend=50;success=$true},
    @{id="trace-003";type="REDIS";app="user-service";serviceName="user-service";methodName="getCache";time=$timestamp;spend=10;success=$true},
    @{id="trace-003";type="HTTP";app="user-service";serviceName="user-service";methodName="getUser";time=$timestamp;spend=100;success=$false},
    @{id="trace-004";type="RPC";app="inventory-service";serviceName="inventory-service";methodName="checkStock";time=$timestamp;spend=75;success=$true}
)
$body = ConvertTo-Json -InputObject $spans -Depth 5
Write-Host "Sending $($spans.Count) spans..."
$response = Invoke-RestMethod -Uri 'http://localhost:8081/apm/report' -Method Post -ContentType 'application/json' -Body $body
Write-Host "Response: $response"