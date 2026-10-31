param([switch]$IncludeProfile)

$ErrorActionPreference = 'Stop'

function Invoke-GitChecked {
  param([string]$Root, [string[]]$Arguments)
  $result = & git -C $Root @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Git failed: $($Arguments -join ' ')" }
  return $result
}

function Publish-Repository {
  param([string]$Root, [string]$ExpectedRemote)
  if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) { throw "Repository missing: $Root" }
  $remote = Invoke-GitChecked -Root $Root -Arguments @('remote', 'get-url', 'origin')
  if ($remote.TrimEnd('/') -ne $ExpectedRemote) { throw "Unexpected remote: $remote" }
  $dirty = Invoke-GitChecked -Root $Root -Arguments @('status', '--porcelain')
  if ($dirty) { throw "Working tree must be clean before publishing: $Root" }
  $branch = Invoke-GitChecked -Root $Root -Arguments @('branch', '--show-current')
  if ($branch -ne 'main') { throw "Expected main branch, found $branch" }
  Invoke-GitChecked -Root $Root -Arguments @('fetch', 'origin', 'main') | Out-Null
  Invoke-GitChecked -Root $Root -Arguments @('merge-base', '--is-ancestor', 'origin/main', 'main') | Out-Null
  $commits = @(Invoke-GitChecked -Root $Root -Arguments @('rev-list', '--reverse', 'origin/main..main'))
  foreach ($commit in $commits) {
    $label = Invoke-GitChecked -Root $Root -Arguments @('show', '-s', '--format=%h %s', $commit)
    Write-Host "Publishing milestone: $label"
    # Fast-forward only. Never force-push or rewrite another person's changes.
    Invoke-GitChecked -Root $Root -Arguments @('push', 'origin', "${commit}:refs/heads/main") | Out-Null
  }
  if ($commits.Count -eq 0) { Write-Host "Already synchronized: $ExpectedRemote" }
}

$login = & gh api user --jq .login
if ($LASTEXITCODE -ne 0 -or $login -ne 'prapulinet') { throw 'Use the terminal authenticated as prapulinet. No token needs to be shared.' }
$projectRoot = Split-Path -Parent $PSScriptRoot
Publish-Repository -Root $projectRoot -ExpectedRemote 'https://github.com/prapulinet/qualitypilot.git'
if ($IncludeProfile) {
  $profileRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot '..\prapulinet-profile'))
  Publish-Repository -Root $profileRoot -ExpectedRemote 'https://github.com/prapulinet/prapulinet.git'
}
Write-Host 'Publishing complete. Check GitHub Actions for the new head commit.'
