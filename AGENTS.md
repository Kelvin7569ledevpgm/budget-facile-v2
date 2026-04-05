<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🛡️ Safe Update Workflow (MANDATORY)
For every feature, bug fix, or modification, you MUST:
1. **Branching**: Create a separate test branch (e.g., `fix/name` or `feature/name`) first.
2. **Preview**: Verify changes on the Vercel Preview URL after pushing the branch.
3. **Merge**: Only merge into `main` after user validation to update the production site.
