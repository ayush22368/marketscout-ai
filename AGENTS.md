<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Rules
- Third-party API keys (SERPAPI_API_KEY, LOVABLE_API_KEY) are read only from server env inside `src/lib/market.server.ts`; never hardcode or expose them to the client — forks must supply their own keys (see `.env.example`).
- Market research runs in one server function (`analyzeMarket`) that gathers search data then asks AI for a strict-JSON analysis; keeps all keys and prompts server-side.
- Market form option lists and budget formatting live in a browser-safe shared module so the UI and tests use one source of truth.
