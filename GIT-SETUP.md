# Git setup (Windows)

This repo includes a PowerShell helper to configure Git quickly.

## 1) Install Git for Windows

- Download: https://git-scm.com/download/win
- During setup:
  - Enable "Git from the command line"
  - Line endings: "Checkout Windows-style, commit Unix-style (recommended)"
  - Enable OpenSSH if you plan to use SSH

## 2) Configure global Git

Open Windows PowerShell and run (replace with your info):

```powershell
cd "G:\Otros ordenadores\Mi portátil\Escritorio\Frenos\frenos-hugo"
./scripts/setup-git.ps1 -Name "Tu Nombre" -Email "tu@email.com"
```

For SSH instead of HTTPS:

```powershell
./scripts/setup-git.ps1 -Name "Tu Nombre" -Email "tu@email.com" -UseSSH
```

## 3) Initialize or connect the repo

If this folder is not yet connected to a remote, create one on GitHub/GitLab and then:

```powershell
# Initialize (if needed)
git init -b main

# First commit (if needed)
git add .
git commit -m "chore: initial commit"

# Add remote (GitHub example)
git remote add origin https://github.com/<usuario>/<repo>.git
# or SSH
# git remote add origin git@github.com:<usuario>/<repo>.git

# Push
git push -u origin main
```

## 4) Recommended protections

- Enable branch protection on main (require PR, status checks)
- Set up Dependabot or Renovate for npm updates
- Enable 2FA on your Git hosting

## 5) Common commands

```powershell
git status
git switch -c feature/<tema>
git add -A
git commit -m "feat: ..."
git pull --rebase
git push -u origin HEAD
```
