---
name: qa-task
description: >-
  BQA/Tester git flow via qa-git MCP: start spec|update-spec|test|update-test
  branches, autosave dirty work, confirm reuse by task_id, commit and push.
  Use when user invokes /qa-task or asks to start/commit/push a QA task branch.
disable-model-invocation: true
---

# /qa-task

Package MCP: **qa-git** ([raintr91/qaGit](https://github.com/raintr91/qaGit))

Dành cho **BQA / Tester** — không cần biết Git. Dev flow (feature/fixbug) ngoài scope.

## Config (product repo)

Trong product repo: `qa-git init` → keyboard chọn agent (như codegraph; Kilo = not supported) → `.qa-git.yml`. Member sửa `member_name`:

```yaml
parent_default: main
member_name: your_name
remote: origin
```

## Commands (natural language)

| Member nói | Agent làm |
|------------|-----------|
| bắt đầu task `{id}` phân tích spec / viết spec | `qa_git_start_task` type=`spec` |
| cập nhật spec task `{id}` | type=`update-spec` |
| bắt đầu task `{id}` viết test / testcase | type=`test` |
| cập nhật test task `{id}` | type=`update-test` |
| commit / lưu / commit và push | `qa_git_commit` rồi `qa_git_push` |

`repoPath` = absolute path của product repo đang mở.

## start_task protocol

1. Gọi `qa_git_start_task` với `repoPath`, `taskId`, `type`.
2. MCP **tự commit** nếu working tree bẩn (không hỏi).
3. Nếu trả `needsConfirm: true` → liệt kê `candidates[].branch` cho member chọn:
   - dùng lại → gọi lại với `reuseBranch="<tên>"`
   - tạo mới → gọi lại với `forceNew=true` (tên `…/{taskId}-1`, `-2`, …)
4. Base luôn `parent_default`. Nhánh module đặc biệt → **gọi dev support** (không tự cover).

## commit + push

1. `qa_git_commit` — message mặc định: `{type} {task_id}` (+ `summary` nếu có).
2. `qa_git_push` — `git push -u {remote} HEAD`.

## Tools

`qa_git_status` · `qa_git_start_task` · `qa_git_list_task_branches` · `qa_git_commit` · `qa_git_push`

## Branch rule

```text
spec|update-spec|test|update-test/{member_name}/{task_id}[-N]
```
