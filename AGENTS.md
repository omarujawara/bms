<!-- BEGIN:nextjs-agent-rules -->

<!-- # This is NOT the Next.js you know -->

<!-- This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. -->
<!-- END:nextjs-agent-rules -->

# AGENTS.md

## Before Writing Any Code

- Read `CLAUDE.md` for full project architecture, conventions, and Supabase rules
- Check `node_modules/next/dist/docs/` before using any Next.js routing, caching, or server action APIs — this project uses Next.js 16 which has breaking changes from older versions

## Permissions

- Read and write all files within the project
- Run bash commands scoped to this project directory
- Use MCP tools (Supabase)

## Off Limits

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code
- Never import `lib/supabase/admin.ts` outside of server-only contexts
- Never edit `components/ui/` manually — use `npx shadcn add <component>`
- Never edit `lib/supabase/database.types.ts` by hand — run `npm run types:gen`
- Never query Supabase directly from components or actions — use the `db/` layer
- Never use `admin.ts` as a workaround for RLS issues — fix the RLS policy instead
