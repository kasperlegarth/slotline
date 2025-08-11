# Slotline

Slotline er OddBeasts’ interne planlægnings- og analyseværktøj til social media content.  
I første fase fokuserer værktøjet på **X (Twitter)**, men er bygget skalerbart, så vi senere kan tilføje integrationer til TikTok og YouTube Shorts.

## 📌 Formål
- Gøre det nemt at oprette, gemme, planlægge og publicere opslag eller tråde direkte til X.
- Holde styr på kø, quotas og performance-metrics.
- Bygge en solid teknisk base, der senere kan gøres til et kommercielt produkt.

## ✨ Nøglefunktioner (MVP)
- Draft-editor til enkeltopslag og tråde
- Køvisning med mulighed for at omrokere eller slette planlagte opslag
- Integration med X API (free tier – 100 posts/måned)
- Automatisk publicering via cron-jobs
- Simpel analytics (visninger, likes, reposts, replies)
- Quota-tracking pr. bruger

## 🛠 Tech Stack

### Frontend
- **Nuxt 3 (Vue 3)** – SSR/SPA hybrid for fleksibilitet og performance
- **Tailwind CSS** – Utility-first styling
- **shadcn-vue** – Genanvendelige, tilpassede UI-komponenter
- **Histoire** – Dokumentation og komponent-playground

### Backend / Infrastruktur
- **Supabase (PostgreSQL)** – Database, auth, RLS, realtime
- **Supabase Edge Functions** – API-facade, posting, metrics-fetch
- **Supabase Scheduler (Cron)** – Automatiseret posting og dataopdatering
- **X API v2 (OAuth 2.0)** – Brugerautentifikation og post-publicering

### Hosting / DevOps
- **Vercel** – Frontend-hosting, previews for hver PR
- **GitHub** – Versionskontrol og CI
- **Renovate** – Afhængighedsstyring
- **Playwright + axe-core** – Accessibility-tests
