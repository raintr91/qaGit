from pathlib import Path

root = Path("/home/vutv/workspace/qa-git")
skip = {"node_modules", "dist", ".git"}
exts = {".mjs", ".ts", ".sh", ".ps1", ".md", ".yml", ".json"}

for p in root.rglob("*"):
    if not p.is_file():
        continue
    if any(s in p.parts for s in skip):
        continue
    if p.suffix not in exts and p.name != ".gitignore":
        continue
    data = p.read_bytes()
    if b"\r" in data:
        p.write_bytes(data.replace(b"\r\n", b"\n").replace(b"\r", b""))
        print("fixed", p.relative_to(root))

print("done")
