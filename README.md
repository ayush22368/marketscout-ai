# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Your own API keys

This repo contains **no API keys** — only `.env.example`, which lists the names you need.
To run the app locally, supply your own keys as environment variables **before** starting the dev server:

```sh
# macOS / Linux
SERPAPI_API_KEY=your_key_here LOVABLE_API_KEY=your_key_here npm run dev
```

```powershell
# Windows (PowerShell)
$env:SERPAPI_API_KEY = "your_key_here"
$env:LOVABLE_API_KEY = "your_key_here"
npm run dev
```

Where to get them:

- `SERPAPI_API_KEY` — create your own key at <https://serpapi.com/manage-api-key>. The app's search code reads it from the server environment only, so it is never shipped to the browser.
- `LOVABLE_API_KEY` — your own Lovable API key, used for the AI analysis step.

`.env` and `.env.*` are already ignored by git (`.env.example` is the exception), so a key you save locally is never committed. Never paste a key into `README.md`, source files, or a commit message — anything committed stays in the repository's history and can be read by anyone who clones it.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
