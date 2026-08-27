# Signal Check

Upload an MP3, get real measured audio metrics (peak, loudness, dynamic
range, clipping, frequency balance, estimated BPM, stereo width), plus
AI-written mixing notes and an original AI lyrics generator.

All audio analysis runs client-side in the browser (Web Audio API — no
audio file ever leaves the user's machine). Two small serverless
functions call the Anthropic API on the server side, so your API key is
never exposed to the browser.

## Project structure

```
index.html          the whole frontend (single file)
api/mix-feedback.js  serverless function -> AI mixing notes
api/lyrics.js         serverless function -> AI lyrics generator
package.json
```

## Deploy to Vercel

**1. Get an Anthropic API key**
Sign up / log in at https://console.anthropic.com and create an API key
under Settings -> API Keys. Note: this requires billing set up on your
Anthropic account — API usage is billed separately from any Claude.ai
subscription.

**2. Push this folder to a GitHub repo** (or deploy directly with the CLI, see below).

**3. Import into Vercel**
- Go to https://vercel.com/new and import the repo (or run `vercel` from
  this folder with the Vercel CLI installed: `npm i -g vercel`).
- Framework preset: choose **Other** — no build step is needed.

**4. Add your API key as an environment variable**
In the Vercel project: **Settings -> Environment Variables**, add:

```
ANTHROPIC_API_KEY = sk-ant-...your key...
```

Apply it to Production (and Preview/Development if you'll test those).
Redeploy after adding it — env vars only apply to new deployments.

**5. Done**
Your site will be live at `your-project.vercel.app`. Both the mixing
notes and lyrics generator call `/api/mix-feedback` and `/api/lyrics` on
your own domain, so there's no CORS issue and the key stays server-side.

## Local development

```bash
npm i -g vercel
vercel dev
```

This serves `index.html` and the `/api` functions together on
`localhost:3000`, using a `.env` file (or `vercel env pull`) for
`ANTHROPIC_API_KEY`.

## Notes

- The model used server-side is `claude-sonnet-5`. Change it in
  `api/mix-feedback.js` and `api/lyrics.js` if you want a different
  model — see https://docs.claude.com for current model names and
  pricing.
- The BPM estimate is a lightweight autocorrelation-based guess, not a
  professional beat detector — it's fine for a rough read, not for
  syncing to a DAW.
- Session history (past scores) is stored in the browser's
  `localStorage`, per-device — it isn't shared across users or devices.
