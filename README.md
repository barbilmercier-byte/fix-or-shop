# Fix or Shop

Describe what's wrong with your car, add a photo, and find out the likely cause, whether you can fix it
yourself, and what a shop would charge if you can't. DIY fixes come with a step-by-step guide and an
"I'm stuck" helper; every repair is logged with what you spent and saved.

## Stack

| Part | What it does |
| --- | --- |
| Next.js (`src/`) | Web app, hosted on Vercel, auto-deployed from GitHub |
| Supabase Postgres (`supabase/migrations`) | Cars, diagnoses, guides, repairs, all with row-level security |
| Supabase Auth | Email magic link, Google and Apple sign-in |
| Supabase Storage | Private `symptom-photos` bucket, one folder per user |
| Edge Function `diagnose` | Calls Claude, applies safety rules, attaches NHTSA recalls, saves the result |
| Edge Function `guide` | Writes the step-by-step guide (cached) and answers "I'm stuck" questions |
| Cloudflare | Domain, DNS, SSL and WAF in front of the Vercel app |

The Claude API key lives only in Supabase secrets. The iOS and Android apps will call the same two
functions and tables, so nothing is rebuilt per platform.

### Safety rules (enforced in code)

`supabase/functions/_shared/safety.ts` forces a **Take it to a shop** verdict for brakes, steering,
suspension, airbags, seatbelts, fuel system and hybrid/EV high-voltage work, and for anything rated
difficulty 5. The `guide` function refuses DIY guides for those causes. Guides never state torque
values, fluid capacities or part numbers as facts; they list them under "Look these up in your manual".

## Set up

1. **Supabase**: create a project, then from this folder:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   npx supabase functions deploy diagnose
   npx supabase functions deploy guide
   ```
   Optional secrets: `CLAUDE_MODEL` (default `claude-opus-5-5`) and `DAILY_DIAGNOSIS_LIMIT` (default `10`).
2. **Auth**: in Supabase > Authentication > URL Configuration, set the Site URL to your domain and add
   `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs.
   Enable the Google and Apple providers if you want those buttons to work.
3. **Vercel**: import the GitHub repo and add the two variables from `.env.example`
   (Supabase > Project Settings > API).
4. **Cloudflare**: point your domain at Vercel (CNAME to `cname.vercel-dns.com`).

## Develop

```bash
cp .env.example .env.local   # fill in your Supabase URL and publishable key
npm install
npm run dev
```

Edge Function checks (needs [Deno](https://deno.com)):

```bash
cd supabase/functions
deno check diagnose/index.ts guide/index.ts
deno test _shared/
```
