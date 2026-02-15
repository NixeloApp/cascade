## 2025-02-18 - [Consistency] Directory Naming in `src/components`

**Learning:** `src/components/ui` is an exception to the PascalCase directory naming convention due to shadcn/ui tooling and community standards.
**Action:** When enforcing PascalCase for component directories, explicitly exclude `ui` to avoid conflicts with external tooling while standardizing custom feature directories (e.g., `Auth`, `Layout`).
