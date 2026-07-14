# Install — Linux/WSL vs Windows

Repo: [raintr91/qaGit](https://github.com/raintr91/qaGit)

Mirrors artifactgraph UX: **curl** on Linux, **irm** on Windows (prefers WSL).

Sau khi cài xong → [USAGE.md](./USAGE.md).

## Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash
qa-git version
qa-git install --target=auto --yes    # hoặc cursor,claude,kilo
```

Trong mỗi **product repo**:

```bash
cd ~/workspace/<product>
qa-git init
# ↑↓ · space · enter  (Kilo = not supported)
# sửa member_name trong .qa-git.yml
```

```bash
qa-git init --target=cursor,claude --yes
qa-git install --target=auto --yes
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

## Cursor MCP (Win Cursor + code in WSL)

Khi **Cursor chạy Windows** và terminal/`qa-git` chạy **trong WSL**, `install` / `init` sẽ:

1. Ghi **`/mnt/c/Users/<you>/.cursor/mcp.json`** (file Cursor Win đọc) — không phải WSL `~/.cursor/mcp.json`
2. Spawn qua **`wsl.exe`** → absolute Linux `node` + `qa-git-mcp.mjs`

```bash
# Từ WSL — đủ cho Cursor Win (không cần --mcp-file tay)
qa-git install --target=cursor --yes
# hoặc trong product repo:
qa-git init --target=cursor --yes
```

Force wrapper: `--wsl` hoặc `QA_GIT_MCP_WSL=1`. Restart Cursor → tools `qa_git_*`.

Dev checkout (tương đương):

```bash
cd ~/workspace/qa-git && npm run build
./bin/qa-git.mjs install --target=cursor --yes
```

## Next

[Usage guide](./USAGE.md) — `qa-git init`, daily flow, branch rules.
