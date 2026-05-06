$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$spans = @(
    @{id="trace-http-001";type="HTTP";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="GET /hello";time=$timestamp;spend=150;success=$true},
    @{id="trace-sql-001";type="SQL";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="SELECT * FROM users";time=$timestamp;spend=50;success=$true},
    @{id="trace-redis-001";type="REDIS";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="GET user:123";time=$timestamp;spend=10;success=$true},
    @{id="trace-http-002";type="HTTP";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="POST /api/users";time=$timestamp;spend=200;success=$true},
    @{id="trace-rpc-001";type="RPC";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="orderService.getOrder";time=$timestamp;spend=120;success=$true},
    @{id="trace-http-003";type="HTTP";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="GET /api/dogs";time=$timestamp;spend=80;success=$true},
    @{id="trace-sql-002";type="SQL";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="INSERT INTO orders";time=$timestamp;spend=60;success=$false},
    @{id="trace-http-004";type="HTTP";app="lt-apm-sb-demo";serviceName="lt-apm-sb-demo";methodName="PUT /api/user/1";time=$timestamp;spend=180;success=$true}
)
$body = ConvertTo-Json -InputObject $spans -Depth 5
Write-Host "Sending $($spans.Count) spans..."
$response = Invoke-RestMethod -Uri 'http://localhost:8081/apm/report' -Method Post -ContentType 'application/json' -Body $body
Write-Host "Response: $response"