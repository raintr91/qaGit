# Usage — BQA / Tester

Repo: [raintr91/qaGit](https://github.com/raintr91/qaGit)

Sau khi [cài đặt](./INSTALL.md), làm theo các bước dưới. Không cần biết Git sâu — agent gọi MCP `qa_git_*`.

## 1. Init product repo

Trong thư mục product (portal, …):

```bash
cd ~/workspace/<product>
qa-git init
```

Giống **codegraph**: keyboard multiselect (`↑↓` · `space` · `enter`).

| Agent | Trạng thái |
|-------|------------|
| Claude Code, Cursor, Codex, opencode, Hermes, Gemini, Antigravity, Kiro | hỗ trợ |
| **Kilo** | `(not supported)` — hiện trong list nhưng disabled |

Detected agents được pre-check. Enter xác nhận.

```bash
qa-git init --target=cursor,claude --yes
qa-git init --target=auto --yes       # chỉ agent đã cài
qa-git init --target=all --yes
qa-git init --target=none --yes       # chỉ .qa-git.yml
qa-git init --force                   # ghi đè skill / config
qa-git init --skip-skill              # MCP only
```

Luôn tạo `./.qa-git.yml` — **sửa `member_name`**. Skill sync cho Cursor/Claude khi chọn.

Sửa `.qa-git.yml`:

```yaml
parent_default: main
member_name: your_name   # bắt buộc — nằm trong tên nhánh
remote: origin
```

Ưu tiên: `.qa-git.yml` trong product repo → rồi `~/.qa-git.yml`.

## 2. Restart agent

Sau `init` / `install`, restart Cursor / Claude Code / Kilo → tools `qa_git_*`.

## 3. Dùng hàng ngày

Mở **product repo** trong Cursor. Nói tự nhiên hoặc gọi `/qa-task`:

| Bạn nói | MCP |
|---------|-----|
| bắt đầu task `{id}` phân tích / viết spec | `qa_git_start_task` · type=`spec` |
| cập nhật spec task `{id}` | type=`update-spec` |
| bắt đầu task `{id}` viết test / testcase | type=`test` |
| cập nhật test task `{id}` | type=`update-test` |
| commit / lưu | `qa_git_commit` |
| commit và push | `qa_git_commit` rồi `qa_git_push` |
| đang ở nhánh nào / status | `qa_git_status` |

### Ví dụ

```text
Bắt đầu task PORTAL-123 viết spec
```

Agent sẽ:

1. Gọi `qa_git_start_task` (`repoPath` = path repo đang mở, `taskId`, `type`).
2. Nếu working tree bẩn → MCP **tự commit** (autosave), không hỏi.
3. Fetch → tạo hoặc hỏi reuse nhánh (xem dưới).
4. Bạn làm việc trên nhánh đó.
5. Khi xong: “commit và push” → `qa_git_commit` + `qa_git_push` (`git push -u`).

### Khi có nhánh cũ cùng `task_id`

Nếu MCP trả `needsConfirm: true`, agent liệt kê `candidates` — bạn chọn:

- **Dùng lại** → gọi lại với `reuseBranch="<tên nhánh>"`
- **Tạo mới** → `forceNew=true` → tên dạng `…/{taskId}-1`, `-2`, …

## 4. Quy tắc nhánh

```text
{type}/{member_name}/{task_id}[-N]
```

Ví dụ: `spec/vutv/PORTAL-123`, `test/vutv/PORTAL-123-1`

- Base luôn `parent_default` (thường `main`).
- Không force-push, không hard reset.
- Nhánh module đặc biệt (không theo rule này) → gọi **dev support**, không tự cover.

## 5. Tools

| Tool | Việc |
|------|------|
| `qa_git_status` | Branch / dirty / remote |
| `qa_git_start_task` | Autosave → fetch → confirm/create nhánh |
| `qa_git_list_task_branches` | Liệt kê nhánh theo `task_id` |
| `qa_git_commit` | Commit (message mặc định `{type} {task_id}`) |
| `qa_git_push` | `git push -u {remote} HEAD` |

Chi tiết protocol cho agent: [examples/cursor/SKILL.md](../examples/cursor/SKILL.md).
