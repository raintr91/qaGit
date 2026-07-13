# Install — Linux/WSL vs Windows

Repo: [raintr91/qaGit](https://github.com/raintr91/qaGit)

Mirrors artifactgraph UX: **curl** on Linux, **irm** on Windows (prefers WSL).

## Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash
qa-git version
qa-git install --target=cursor --yes
cp ~/.qa-git/qa-git.example.yml ~/.qa-git.yml   # edit member_name
```

Uninstall:

```bash
bash ~/.qa-git/install.sh --uninstall
# or:
curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash -s -- --uninstall
```

Defaults: install → `~/.qa-git`, link → `~/.local/bin/qa-git`.

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/raintr91/qaGit/main/install.ps1 | iex
```

- If **WSL** is available: runs Linux `install.sh`, then wires Cursor MCP with `--wsl`.
- Else: native clone under `%LOCALAPPDATA%\qa-git` (needs Node ≥ 22).

Force native Win: `$env:QA_GIT_USE_WSL='0'; irm … | iex`

## Per product repo

```bash
cp /path/to/qa-git/qa-git.example.yml ~/workspace/portal/.qa-git.yml
# edit member_name / parent_default
```

## Cursor MCP (dev checkout)

```bash
cd ~/workspace/qa-git
npm install && npm run build
./bin/qa-git.mjs install --target=cursor --yes --wsl \
  --mcp-file /mnt/c/Users/<you>/.cursor/mcp.json
```

Restart Cursor → tools `qa_git_*`.

Copy skill:

```bash
mkdir -p ~/.cursor/skills/qa-task
cp examples/cursor/SKILL.md ~/.cursor/skills/qa-task/SKILL.md
```

## Skill

`/qa-task` — see [examples/cursor/SKILL.md](../examples/cursor/SKILL.md)
