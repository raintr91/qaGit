# qa-git

Local MCP for **BQA / Tester**: safe git branches for `spec` · `update-spec` · `test` · `update-test` — no force-push, no hard reset.

- GitHub: [raintr91/qaGit](https://github.com/raintr91/qaGit)
- **Install:** [docs/INSTALL.md](./docs/INSTALL.md)
- **Cursor skill:** [examples/cursor/SKILL.md](./examples/cursor/SKILL.md) → `/qa-task`

---

## Quick install

**Linux / WSL**

```bash
curl -fsSL https://raw.githubusercontent.com/raintr91/qaGit/main/install.sh | bash
qa-git version
qa-git install --target=cursor --yes
```

**Windows (PowerShell)** — prefers WSL

```powershell
irm https://raw.githubusercontent.com/raintr91/qaGit/main/install.ps1 | iex
```

Requires **Node ≥ 22**.

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

Config: `.qa-git.yml` or `~/.qa-git.yml` — see `qa-git.example.yml`.

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
| `examples/cursor/SKILL.md` | `/qa-task` skill |

---

## License

MIT
