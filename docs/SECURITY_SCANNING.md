# Security scanning (free)

This repo runs **Semgrep**, **Trivy**, **Gitleaks**, and **CodeQL** on GitHub Actions.
Repo: https://github.com/Kjm517/Hamel (public → CodeQL is free).

| Tool | What it checks | Where results appear |
|------|----------------|----------------------|
| **Gitleaks** | Secrets / API keys in files + git history | Action fails if a secret is found |
| **Semgrep** | App code bugs (XSS, injection, insecure patterns) | Action log |
| **Trivy** | Vulnerable npm packages (lockfiles) | Action log + Security tab (SARIF) |
| **CodeQL** | Deeper SAST for JS/TS | GitHub **Security → Code scanning** |

---

## 1. Use on GitHub (recommended)

### First-time setup

1. Commit and push the workflows under `.github/workflows/`.
2. On GitHub: **Settings → Code security → Code scanning**  
   - CodeQL should activate from the workflow.  
   - Optionally enable **Dependency graph** / **Dependabot alerts**.
3. Open **Actions** → run **Security** or **CodeQL** via **Run workflow** (workflow_dispatch).

### Everyday use

- Every **push** to `main` and every **pull request** runs the scans.
- Weekly Monday schedule also runs them.
- Open a PR → wait for green checks (or read the failing job log).
- CodeQL / Trivy findings: **Security** tab on the repo.

### If a check fails

| Job | Typical fix |
|-----|-------------|
| Gitleaks | Remove the secret, rotate the key, add to `.gitignore`, rewrite history if it was committed |
| Semgrep | Fix the flagged code, or add a narrow `nosemgrep` comment with a reason |
| Trivy | `npm update <pkg>` / bump the vulnerable dependency |
| CodeQL | Fix the alert in the Security tab |

---

## 2. Run locally (optional)

GitHub Actions is enough for most teams. Local runs help before you push.

### Option A — Docker (easiest on Windows)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/), then from the `Main` folder:

```powershell
# Semgrep (app code)
docker run --rm -v "${PWD}:/src" semgrep/semgrep semgrep scan --config p/javascript --config p/typescript --config p/react --config p/nodejs --config p/owasp-top-ten --error /src

# Trivy (dependencies / filesystem)
docker run --rm -v "${PWD}:/src" aquasec/trivy:latest fs --severity CRITICAL,HIGH --exit-code 1 /src

# Gitleaks (secrets — current files)
docker run --rm -v "${PWD}:/src" zricethezav/gitleaks:latest detect --source=/src --no-git -c /src/.gitleaks.toml

# Gitleaks (full git history)
docker run --rm -v "${PWD}:/src" zricethezav/gitleaks:latest detect --source=/src -c /src/.gitleaks.toml
```

Or use the helper script:

```powershell
.\scripts\security-scan.ps1
```

### Option B — Native installs

- **Gitleaks:** https://github.com/gitleaks/gitleaks/releases  
  `gitleaks detect -v -c .gitleaks.toml`
- **Trivy:** https://github.com/aquasecurity/trivy/releases  
  `trivy fs --severity CRITICAL,HIGH --exit-code 1 .`
- **OSV-Scanner** (Trivy alternative for lockfiles only):  
  https://github.com/google/osv-scanner  
  `osv-scanner -r .`
- **Semgrep:** best via Docker on Windows; on Mac/Linux: `pip install semgrep` then same `semgrep scan ...` flags.
- **CodeQL:** use GitHub Actions (local CLI is heavy; not required).

### npm shortcuts

From `Main`:

```bash
npm run security:semgrep
npm run security:trivy
npm run security:gitleaks
npm run security:scan
```

These call Docker under the hood.

---

## 3. Config files in this repo

| File | Purpose |
|------|---------|
| `.github/workflows/security.yml` | Gitleaks + Semgrep + Trivy |
| `.github/workflows/codeql.yml` | CodeQL |
| `.semgrepignore` | Skip generated folders |
| `.gitleaks.toml` | Allowlist noisy paths |
| `.trivyignore` | Ignore specific CVEs if needed |

---

## 4. Good habits

1. Never commit `.env` (keep it in `.gitignore`).
2. Rotate any key that ever landed in git history.
3. Fix **CRITICAL/HIGH** Trivy and CodeQL alerts before release.
4. Re-run **Actions → Security** after dependency upgrades.
