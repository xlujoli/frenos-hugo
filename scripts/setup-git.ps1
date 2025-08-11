param(
  [Parameter(Mandatory=$true)][string]$Name,
  [Parameter(Mandatory=$true)][string]$Email,
  [switch]$UseSSH
)

Write-Host "Configuring Git for $Name <$Email>..." -ForegroundColor Cyan

# Ensure git is available
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
  Write-Error "Git is not installed or not in PATH. Install Git for Windows from https://git-scm.com/download/win and re-run."
  exit 1
}

# Core config
& git config --global user.name $Name
& git config --global user.email $Email
& git config --global init.defaultBranch main
& git config --global core.autocrlf true
& git config --global core.longpaths true
& git config --global credential.helper manager
& git config --global pull.rebase false
& git config --global fetch.prune true
& git config --global rebase.autostash true

# Helpful defaults
& git config --global push.autoSetupRemote true
& git config --global merge.ff only
& git config --global diff.tool vscode
& git config --global difftool.vscode.cmd "code --wait --diff $LOCAL $REMOTE"
& git config --global merge.tool vscode
& git config --global mergetool.vscode.cmd "code --wait $MERGED"

if ($UseSSH) {
  # Ensure OpenSSH client exists (Windows 10+ usually has it)
  $ssh = Get-Command ssh -ErrorAction SilentlyContinue
  if (-not $ssh) { Write-Warning "OpenSSH client not found in PATH. Install 'OpenSSH Client' optional feature or install Git Bash." }
  # Generate an SSH key if none exists
  $sshDir = Join-Path $HOME ".ssh"
  if (-not (Test-Path $sshDir)) { New-Item -ItemType Directory -Path $sshDir | Out-Null }
  $keyPath = Join-Path $sshDir "id_ed25519"
  if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -C $Email -f $keyPath -N ""
    Write-Host "SSH key generated at $keyPath" -ForegroundColor Green
  }
  & git config --global url."ssh://git@github.com/".insteadOf "https://github.com/"
}

Write-Host "Global Git config complete." -ForegroundColor Green
