# run-candidate.ps1 — generate one IP candidate and save it next to this script.
#
#   pwsh -File run-candidate.ps1 A1
#
# Reads prompts\<Label>.txt, posts it through the AutoGLM text-to-image skill
# (C:\Users\coldstonestudio\.agents\skills\autoglm-generate-image\generate-image.py),
# then downloads data.image_url to <Label>.png.
#
# The skill script needs a bearer token from the local broker on 127.0.0.1:53699.
# When that broker is not running the script exits non-zero with
# "ERROR: 无法从本地服务获取 token" and this wrapper stops there — it never
# substitutes another model and never writes a placeholder image.

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^[ABC][12]$')]
    [string]$Label
)

$ErrorActionPreference = 'Stop'

$here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$promptPath = Join-Path $here "prompts\$Label.txt"
$outPath    = Join-Path $here "$Label.png"
$skillScript = 'C:\Users\coldstonestudio\.agents\skills\autoglm-generate-image\generate-image.py'

if (-not (Test-Path -LiteralPath $promptPath)) { throw "prompt file missing: $promptPath" }
if (-not (Test-Path -LiteralPath $skillScript)) { throw "image skill script missing: $skillScript" }

Write-Output "prompt file : $promptPath"
Write-Output "output file : $outPath"
Write-Output 'requesting image ...'

# The whole prompt goes through as one argv entry (it contains newlines, which is
# legal on Windows; PowerShell quotes the argument for us).
$raw = (& python $skillScript (Get-Content -Raw -LiteralPath $promptPath) 2>&1) -join "`n"
Write-Output '--- raw skill output ---'
Write-Output $raw
Write-Output '------------------------'

$json = $null
try { $json = $raw | ConvertFrom-Json } catch {
    throw "skill did not return JSON — is the token broker on 127.0.0.1:53699 running?"
}

if ($null -eq $json.code -or $json.code -ne 0) {
    throw "image API rejected the request (code=$($json.code)): $($json.msg)"
}
if (-not $json.data.image_url) { throw 'response carried no data.image_url' }

Invoke-WebRequest -Uri $json.data.image_url -OutFile $outPath -TimeoutSec 180
$file = Get-Item -LiteralPath $outPath
if ($file.Length -le 0) { throw "downloaded file is empty: $outPath" }

[pscustomobject]@{
    label      = $Label
    path       = $file.FullName
    bytes      = $file.Length
    sourceUrl  = $json.data.image_url
    promptFile = $promptPath
} | ConvertTo-Json -Depth 4
