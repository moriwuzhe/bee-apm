$ErrorActionPreference = "Stop"

$BaseDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$DemoDir = Join-Path $BaseDir "lt-agent-test\lt-monitor-sb-demo"
$AgentJar = Join-Path $BaseDir "packages\lt-agent.jar"

$CollectorUrl = $args[0]
if ([string]::IsNullOrWhiteSpace($CollectorUrl)) { $CollectorUrl = $env:COLLECTOR_URL }
if ([string]::IsNullOrWhiteSpace($CollectorUrl)) { $CollectorUrl = "http://127.0.0.1:7001/stream" }

$App = $env:LT_APP
if ([string]::IsNullOrWhiteSpace($App)) { $App = "lt-preprod-demo" }
$EnvName = $env:LT_ENV
if ([string]::IsNullOrWhiteSpace($EnvName)) { $EnvName = "preprod" }
$Inst = $env:LT_INST
if ([string]::IsNullOrWhiteSpace($Inst)) { $Inst = "demo01" }
$Port = $env:SERVER_PORT
if ([string]::IsNullOrWhiteSpace($Port)) { $Port = "8101" }

$LoadEnable = $env:LOAD_ENABLE
if ([string]::IsNullOrWhiteSpace($LoadEnable)) { $LoadEnable = "true" }
$LoadQps = $env:LOAD_QPS
if ([string]::IsNullOrWhiteSpace($LoadQps)) { $LoadQps = "5" }
$LoadThreads = $env:LOAD_THREADS
if ([string]::IsNullOrWhiteSpace($LoadThreads)) { $LoadThreads = "2" }
$LoadDurationSeconds = $env:LOAD_DURATION_SECONDS
if ([string]::IsNullOrWhiteSpace($LoadDurationSeconds)) { $LoadDurationSeconds = "0" }

$BistouryProxyHost = $env:BISTOURY_PROXY_HOST
if ([string]::IsNullOrWhiteSpace($BistouryProxyHost)) { $BistouryProxyHost = "127.0.0.1" }
$BistouryProxyPort = $env:BISTOURY_PROXY_PORT
if ([string]::IsNullOrWhiteSpace($BistouryProxyPort)) { $BistouryProxyPort = "3333" }

if (!(Test-Path $AgentJar)) {
  Write-Host "Agent jar not found: $AgentJar"
  exit 1
}

$TargetDir = Join-Path $DemoDir "target"
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
$TmpCfg = Join-Path $TargetDir "lt-agent-preprod.yml"

@"
logger:
  console: true
  level: info
reporter:
  name: okhttp
  serverUrl: "$CollectorUrl"
  queueSize: 2000
  threadNum: 2
  idleSleep: 50
  batchSize: 50
sampling:
  rate: 10000
bistoury:
  proxy:
    host: "$BistouryProxyHost"
    port: $BistouryProxyPort
"@ | Set-Content -Encoding UTF8 $TmpCfg

Push-Location $DemoDir
mvn -DskipTests package

java -Xms256m -Xmx256m `
  "-javaagent:$AgentJar" `
  "-Dlt.config=$TmpCfg" `
  "-Dlt.app=$App" `
  "-Dlt.env=$EnvName" `
  "-Dlt.inst=$Inst" `
  "-Dlt.port=$Port" `
  "-Dlt.ip=127.0.0.1" `
  "-Dserver.ip=127.0.0.1" `
  "-Dserver.port=$Port" `
  "-Dremote.ports=$Port" `
  "-Dmax.counter=0" `
  "-Dlt.demo.load.enable=$LoadEnable" `
  "-Dlt.demo.load.qps=$LoadQps" `
  "-Dlt.demo.load.threads=$LoadThreads" `
  "-Dlt.demo.load.durationSeconds=$LoadDurationSeconds" `
  -jar target\lt-monitor-sb-demo.jar
Pop-Location

