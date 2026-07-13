# qa-git

Local MCP for **BQA / Tester**: safe git branches for `spec` · `update-spec` · `test` · `update-test` — no force-push, no hard reset.

- GitHub: [raintr91/qaGit](https://github.com/raintr91/qaGit)
- **Install:** [docs/INSTALL.md](./docs/INSTALL.md) (Linux / WSL / Windows)
- **Usage:** [docs/USAGE.md](./docs/USAGE.md)
- **Cursor skill:** [examples/cursor/SKILL.md](./examples/cursor/SKILL.md) → `/qa-task`

---

## Quick install

**Linux / WSL**

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash
qa-git version
qa-git install --target=auto --yes
```

**Windows (PowerShell)** — prefers WSL

```powershell
irm https://raw.githubusercontent.com/raintr91/qaGit/main/install.ps1 | iex
```

Requires **Node ≥ 22**. Restart Cursor → MCP tools `qa_git_*`.

Trong **product repo**:

```bash
cd ~/workspace/<product>
qa-git init
# ↑↓ di chuyển · space chọn · enter xác nhận
# Kilo hiện (not supported) — không chọn được
```

Non-interactive:

```bash
qa-git init --target=cursor,claude --yes
qa-git init --target=auto --yes
```

---

## How to use

1. `qa-git init` → keyboard chọn agent → sửa `member_name` trong `.qa-git.yml`.
2. Restart agent, nói tự nhiên (hoặc `/qa-task`):

| Bạn nói | Kết quả |
|---------|---------|
| bắt đầu task `{id}` viết spec | nhánh `spec/{member}/{id}` |
| cập nhật spec / viết test / cập nhật test | `update-spec` · `test` · `update-test` |
| commit và push | `qa_git_commit` → `qa_git_push` |

Nếu đã có nhánh cùng `task_id`, agent hỏi **dùng lại** hoặc **tạo mới** (`…-1`, `-2`, …).

Full guide: [docs/USAGE.md](./docs/USAGE.md).

---

## What it does

| Step | MCP tool |
|------|----------|
| Status | `qa_git_status` |
| Start task (autosave → fetch → confirm/create) | `qa_git_start_task` |
| List branches by task_id | `qa_git_list_task_branches` |
| Commit | `qa_git_commit` |
| Push `-u` | `qa_git_push` |

Branch: `{type}/{member_name}/{task_id}[-N]`  
Base: always `parent_default` (module-base exceptions = dev support).

---

## Dev checkout

```bash
cd ~/workspace/qa-git
npm install && npm run build
./bin/qa-git.mjs version
./bin/qa-git.mjs install --target=cursor --yes
```

---

## Source map

| Path | Meaning |
|------|---------|
| `install.sh` / `install.ps1` | curl / irm entrypoints |
| `bin/qa-git*.mjs` | PATH launchers |
| `src/mcp/*` | MCP stdio + tools |
| `src/git/ops.ts` | git wrappers |
| `src/install/cursor-mcp.ts` | merge `~/.cursor/mcp.json` |
| `docs/INSTALL.md` | Linux / Windows install |
| `docs/USAGE.md` | daily usage for BQA/Tester |
| `src/install/init.ts` | `qa-git init` (config + agents) |
| `src/install/targets/*` | cursor / claude / kilo |
| `examples/cursor/SKILL.md` | `/qa-task` skill |
---

## License

MIT
