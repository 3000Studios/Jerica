[CmdletBinding()]
param(
    [string]$EnvFile = "C:\Users\MrJws\Documents\global.env",
    [string]$Repository = "3000Studios/Jerica",
    [switch]$SkipSong
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step([string]$Message) {
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Import-DotEnv([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "global.env not found at: $Path"
    }

    $map = @{}
    foreach ($raw in Get-Content -LiteralPath $Path -Encoding UTF8) {
        $line = $raw.Trim()
        if (-not $line -or $line.StartsWith('#')) { continue }
        $eq = $line.IndexOf('=')
        if ($eq -lt 1) { continue }
        $key = $line.Substring(0, $eq).Trim()
        $value = $line.Substring($eq + 1).Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $map[$key] = $value
    }
    return $map
}

function Get-FirstValue($Map, [string[]]$Names) {
    foreach ($name in $Names) {
        if ($Map.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace([string]$Map[$name])) {
            return [string]$Map[$name]
        }
    }
    return $null
}

function Ensure-Command([string]$Command, [string]$WingetId) {
    if (Get-Command $Command -ErrorAction SilentlyContinue) { return }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "$Command is missing and winget is unavailable. Install $WingetId and rerun."
    }
    Write-Step "Installing $Command"
    & winget install --id $WingetId --exact --accept-package-agreements --accept-source-agreements --silent
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        $env:PATH = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'User')
    }
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "$Command installation completed but the command is not on PATH yet. Restart PowerShell and rerun."
    }
}

function Set-GitHubSecret([string]$Name, [string]$Value, [string]$Repo) {
    if ([string]::IsNullOrWhiteSpace($Value)) { throw "Missing required value for $Name in global.env" }
    $Value | & gh secret set $Name --repo $Repo
    if ($LASTEXITCODE -ne 0) { throw "Failed to set GitHub secret $Name" }
}

Write-Step "Loading global environment without printing secrets"
$vars = Import-DotEnv $EnvFile
$cfToken = Get-FirstValue $vars @('CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN', 'CLOUDFLARE_TOKEN')
$cfAccount = Get-FirstValue $vars @('CLOUDFLARE_ACCOUNT_ID', 'CF_ACCOUNT_ID')
$ghToken = Get-FirstValue $vars @('GH_TOKEN', 'GITHUB_TOKEN', 'GITHUB_PAT')

if (-not $cfToken) { throw "No Cloudflare API token found. Expected CLOUDFLARE_API_TOKEN, CF_API_TOKEN, or CLOUDFLARE_TOKEN in global.env." }
if (-not $cfAccount) { throw "No Cloudflare account ID found. Expected CLOUDFLARE_ACCOUNT_ID or CF_ACCOUNT_ID in global.env." }

Write-Step "Checking required tools"
Ensure-Command git 'Git.Git'
Ensure-Command gh 'GitHub.cli'
Ensure-Command node 'OpenJS.NodeJS.LTS'
if (-not $SkipSong) { Ensure-Command ffmpeg 'Gyan.FFmpeg' }

if ($ghToken) { $env:GH_TOKEN = $ghToken }
& gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    if ($ghToken) { throw "The GitHub token in global.env was rejected." }
    Write-Step "GitHub sign-in required"
    & gh auth login --web --git-protocol https
    if ($LASTEXITCODE -ne 0) { throw "GitHub authentication failed." }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

Write-Step "Locking repository workflow to one main branch"
$expectedRemote = "https://github.com/$Repository.git"
if (-not (Test-Path (Join-Path $repoRoot '.git'))) {
    throw "This script must be run from a clone of https://github.com/$Repository"
}
if ((git remote) -contains 'origin') {
    git remote set-url origin $expectedRemote
} else {
    git remote add origin $expectedRemote
}
git fetch origin --prune
git branch -M main
$localBranches = @(git for-each-ref --format='%(refname:short)' refs/heads/ | Where-Object { $_ -and $_ -ne 'main' })
foreach ($branch in $localBranches) { git branch -D -- $branch }
$remoteHeads = @(git ls-remote --heads origin)
foreach ($line in $remoteHeads) {
    if ($line -match 'refs/heads/(.+)$') {
        $branch = $Matches[1]
        if ($branch -ne 'main') {
            Write-Host "Deleting extra remote branch: $branch" -ForegroundColor DarkYellow
            git push origin --delete -- $branch
        }
    }
}

Write-Step "Installing Cloudflare deployment credentials into GitHub Actions"
Set-GitHubSecret 'CLOUDFLARE_API_TOKEN' $cfToken $Repository
Set-GitHubSecret 'CLOUDFLARE_ACCOUNT_ID' $cfAccount $Repository

if (-not $SkipSong) {
    Write-Step "Importing Maybe I'll Try It"
    $songPath = Get-FirstValue $vars @('JERICA_SONG_PATH', 'MAYBE_ILL_TRY_IT_PATH')
    if ($songPath -and -not (Test-Path -LiteralPath $songPath)) { $songPath = $null }

    if (-not $songPath) {
        $roots = @(
            (Join-Path $HOME 'Downloads'),
            (Join-Path $HOME 'Desktop'),
            (Join-Path $HOME 'Documents')
        ) | Where-Object { Test-Path -LiteralPath $_ }

        foreach ($root in $roots) {
            $match = Get-ChildItem -LiteralPath $root -File -Recurse -Depth 4 -ErrorAction SilentlyContinue |
                Where-Object { $_.Extension -match '^\.(wav|mp3|m4a|flac)$' -and $_.BaseName -match "Maybe.*I.*Try.*It" } |
                Sort-Object LastWriteTime -Descending |
                Select-Object -First 1
            if ($match) { $songPath = $match.FullName; break }
        }
    }

    if ($songPath) {
        $assetDir = Join-Path $repoRoot 'public\assets'
        New-Item -ItemType Directory -Force -Path $assetDir | Out-Null
        $target = Join-Path $assetDir 'maybe-ill-try-it.mp3'
        & ffmpeg -hide_banner -loglevel error -y -i $songPath -vn -codec:a libmp3lame -b:a 192k -ar 44100 $target
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $target)) { throw "FFmpeg could not create the production MP3." }
        Write-Host "Music asset prepared: public/assets/maybe-ill-try-it.mp3" -ForegroundColor Green
    } else {
        Write-Warning "Could not locate 'Maybe I'll Try It' automatically. Set JERICA_SONG_PATH in global.env and rerun."
    }
}

Write-Step "Committing and pushing production changes"
git add --all
$hasChanges = -not [string]::IsNullOrWhiteSpace((git status --porcelain))
if ($hasChanges) {
    git commit -m "deploy: sync production assets and local configuration"
}
git push -u origin main

Write-Step "Running an immediate Cloudflare deployment"
$env:CLOUDFLARE_API_TOKEN = $cfToken
$env:CLOUDFLARE_ACCOUNT_ID = $cfAccount
& npx --yes wrangler@latest deploy
if ($LASTEXITCODE -ne 0) {
    throw "Cloudflare deployment failed. Confirm the API token can edit Workers and Custom Domains for jerica.pro."
}

Write-Step "Verifying the latest GitHub deployment run"
Start-Sleep -Seconds 2
$runId = (& gh run list --repo $Repository --workflow deploy.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId' 2>$null).Trim()
if ($runId) {
    & gh run watch $runId --repo $Repository --exit-status
    if ($LASTEXITCODE -ne 0) { throw "GitHub Actions deployment failed. Open the run log for details." }
}

Write-Step "Checking jerica.pro"
$live = $false
for ($i = 0; $i -lt 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri 'https://jerica.pro/' -Method Head -TimeoutSec 12 -MaximumRedirection 4
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { $live = $true; break }
    } catch {
        Start-Sleep -Seconds 4
    }
}
if (-not $live) { throw "Deployment completed, but https://jerica.pro did not return a successful response yet." }

Write-Host "`njerica.pro is live. main is the only branch and every future push to main auto-deploys through Cloudflare." -ForegroundColor Green
