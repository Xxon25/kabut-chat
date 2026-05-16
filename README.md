# 🌫️ kabut. (Kabut Chat)

Aplikasi pesan anonim premium dengan privasi tingkat tinggi. Tidak ada riwayat, tidak ada jejak, hanya obrolan yang menguap di balik kabut.

Built with **Next.js 14**, **Supabase Realtime**, and **Vanilla CSS**.

---

## ✨ Fitur Sultan
- **Anonymous Session:** Gak butuh login, gak butuh akun. Datang, chat, lenyap.
- **Realtime Presence:** Tahu siapa yang lagi online di room secara akurat.
- **Voice Notes (VN):** Kirim pesan suara dengan timer rekaman.
- **Image Sharing:** Berbagi foto secara anonim.
- **Reply System:** Balas pesan tertentu dengan fitur *double-click*.
- **Cyber-Sleek UI:** Desain minimalis-editorial yang gelap, tajam, dan mewah.

---

## 🚀 Gaskeun Jalankan Lokal

1. **Clone & Install:**
   ```bash
   git clone https://github.com/Xxon25/kabut-chat.git
   cd kabut-chat
   npm install
   ```

2. **Setup Environment:**
   Buat file `.env.local` dan isi dengan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Setup Supabase Storage:**
   - Buat bucket bernama `chat-assets` di Supabase Storage.
   - Set bucket ke **Public**.
   - Atur **CORS** ke `*` agar upload lancar.

4. **Run Dev Server:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

---

## 🌍 Cara Deploy (Agar Bisa Dites Orang Lain)

Aplikasi ini paling pas di-deploy ke **Vercel**.

1. Masuk ke [Vercel Dashboard](https://vercel.com).
2. Klik **Add New Project** > **Import** dari GitHub repositori ini.
3. Masukkan **Environment Variables** (`NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`) di setting Vercel.
4. Klik **Deploy**. Selesai! Anda akan dapat URL publik yang bisa disebar.

---

**Status:** `AKTIF & MENGIKAT` — Dibuat dengan ❤️ untuk komunitas anonim Indonesia.
