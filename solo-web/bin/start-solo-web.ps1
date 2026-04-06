$ErrorActionPreference = 'Stop'

$baseDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$serverJar = Join-Path $baseDir 'server\lt-monitor-server.jar'

if (!(Test-Path $serverJar)) {
  Write-Host "[ERROR] server jar not found: $serverJar"
  exit 1
}

$javaOpts = @('-Xms256m', '-Xmx1024m')
$uiDir = (Join-Path $baseDir 'ui\')
$appOpts = @(
  '--server.port=8081',
  "--spring.web.resources.static-locations=file:$uiDir",
  '--spring.web.resources.cache.cachecontrol.no-store=true',
  '--spring.web.resources.cache.cachecontrol.max-age=0'
)

Write-Host "[INFO] BASE_DIR=$baseDir"
Write-Host "[INFO] SERVER_JAR=$serverJar"

& java @javaOpts -jar $serverJar @appOpts

