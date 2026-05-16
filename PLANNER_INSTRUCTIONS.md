# 🌫️ KABUT CHAT — AI PLANNER & SYSTEM INSTRUCTIONS

> **Note for AI:** You are an expert developer working on the **Kabut Chat** project. This is a high-privacy, ephemeral anonymous chat platform. You MUST follow these instructions strictly to maintain the integrity and philosophy of the project.

---

## 🎯 1. CORE PHILOSOPHY: "EPHEMERAL MIST"
- **No Database for Chats:** Messages are NEVER saved to a database. They exist only in memory during the session.
- **Broadcast Only:** Use Supabase Realtime `broadcast` for sending/receiving messages.
- **Privacy First:** No tracking, no logs, no user accounts. Identity is temporary.
- **Aesthetic:** Modern, premium, Glassmorphism, and "Ambient Glow" (emerald/mint theme).

---

## 🛠️ 2. TECH STACK & ARCHITECTURE
- **Framework:** Next.js 14 (App Router).
- **Realtime:** Supabase Realtime (`broadcast` for messages, `presence` for online users).
- **Styling:** Vanilla CSS (`app/globals.css`) for core styles, inline styles for dynamic components.
- **Main Component:** `components/AnonChat.jsx` (Contains both `HomeScreen` and `ChatScreen`).

---

## 🛑 3. STRICT EXECUTION RULES (ANTI-ROGUE LOGIC)
1. **No Refactoring Without Permission:** Do not change the core structure of `AnonChat.jsx` or `supabase.js` unless explicitly asked.
2. **Logic Preservation:** 
   - Own messages must always align to the **RIGHT**.
   - Presence counting must use unique IDs (not just names).
   - Messages must trigger `bottomRef.scrollIntoView`.
3. **Safety First:** 
   - Always use `try-catch` for Supabase/Clipboard operations.
   - All credentials must come from `.env.local` (NEVER hardcoded).
4. **Indonesian Slang:** Keep the `QUICK_SLANG` array and general UI tone in "Indonesian Street/Tech Slang" (e.g., Gaskeun, Cabut, Bross).

---

## 📝 4. CODE CONVENTIONS
- **Messaging:** 
  ```javascript
  // Schema for broadcast payload
  {
    id: string,
    sender: string,
    text: string,
    ts: number,
    reply: { sender, text } | null
  }
  ```
- **Styling:** Use variables from `:root` in `globals.css` (e.g., `--kabut-emerald`, `--glass`).
- **Presence:** Always `track` using a unique `presenceIdRef` to avoid collisions.

---

## 🚀 5. GIT WORKFLOW (MANDATORY)
Every task completion must be followed by a push using the project script or manual commands with these prefixes:
- `feat:` (New features)
- `fix:` (Bug fixes)
- `docs:` (Documentation)
- `refactor:` (Cleanup without changing logic)

**Commit Example:** `fix: resolve message alignment issue on mobile`

---

## 🔍 6. TROUBLESHOOTING / CHECKLIST
- [ ] Does it break the "No DB" rule? (If yes, STOP).
- [ ] Is the "me" message on the right?
- [ ] Is the `copyRoom` function using `navigator.clipboard`?
- [ ] Are input fields auto-focused?
- [ ] Is there a confirmation before `onLeave`?

---
**STATUS:** `AUTHORITATIVE`
**DILARANG MENGUBAH DASAR LOGIKA TANPA IZIN EKSPLISIT DARI USER.**
