param(
  [string]$GeneratedEnvPath = ".\e2e\maestro\.env.generated.json",
  [string]$FlowPath = ".\e2e\maestro"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command maestro -ErrorAction SilentlyContinue)) {
  throw "Maestro CLI is not installed or not on PATH. Install from https://maestro.mobile.dev before running real-device E2E."
}

$args = @("test")
if (Test-Path -LiteralPath $GeneratedEnvPath) {
  $envJson = Get-Content -LiteralPath $GeneratedEnvPath -Raw | ConvertFrom-Json
  foreach ($property in $envJson.PSObject.Properties) {
    $args += "-e"
    $args += "$($property.Name)=$($property.Value)"
  }
}

$args += $FlowPath
& maestro @args
