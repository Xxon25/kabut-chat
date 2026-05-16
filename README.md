# anonchat

Chat anonim berbasis room. Tanpa akun, tanpa database. Pesan berjalan lewat Supabase Realtime Broadcast dan hilang saat tab ditutup.

## Setup

```bash
git clone https://github.com/username/anonchat.git
cd anonchat
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan kredensial dari Supabase Dashboard → Project Settings → API.

Aktifkan Realtime di Supabase: **Database → Replication → ON**. Tidak perlu buat tabel apapun.

```bash
npm run dev
```

## Deploy

Set GitHub Secrets:

| Secret | Sumber |
|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel dashboard |
| `VERCEL_PROJECT_ID` | Vercel dashboard |

Push ke `main` → GitHub Actions otomatis build + deploy ke Vercel.

Atau manual:

```bash
bash scripts/deploy.sh "feat: deskripsi perubahan"
```

## Struktur

```
anonchat/
├── app/
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── components/
│   └── AnonChat.jsx
├── lib/
│   └── supabase.js
├── scripts/
│   └── deploy.sh
└── .github/workflows/deploy.yml
```
