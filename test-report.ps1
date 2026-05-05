$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$body = "[{`"id`":`"trace-001`",`"type`":`"HTTP`",`"app`":`"order-service`",`"serviceName`":`"order-service`",`"methodName`":`"getOrder`",`"time`":$timestamp,`"spend`":150,`"success`":true}]"
Write-Host "Sending data with timestamp: $timestamp"
$response = Invoke-RestMethod -Uri 'http://localhost:8081/apm/report' -Method Post -ContentType 'application/json' -Body $body
Write-Host "Response: $response"