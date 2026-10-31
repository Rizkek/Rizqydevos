# Roadmap DevOS (disusun ulang 2026-10-14, direvisi 2026-10-30)

Menggantikan rencana "Fase 0-7" sebelumnya. Fase lama yang sudah selesai dicatat di [HANDOFF.md](./HANDOFF.md); bagian yang masih relevan dari Fase 5 sampai 7 lama dimasukkan ke fase baru di bawah (ditandai "dari Fase lama").

Revisi 2026-10-30 (hasil review ulang codebase): ditambah **Fase S** (stabilisasi, dikerjakan paling awal karena API lokal tidak bisa start) dan **Fase P** (siap produksi, sebelumnya tidak ada di rencana). Temuan lain disisipkan ke fase yang ada dan ditandai "(review 10-30)". Nama fase A sampai H tidak diubah agar rujukan di AGENTS.md dan HANDOFF.md tetap berlaku.

### Tiga penomoran fase yang pernah dipakai

| Penomoran | Lokasi | Status |
|---|---|---|
| Phase 0-5 produk (Juli 2026) | dulu `docs/vision/04-goals.md` (dihapus 2026-11-01) | Usang. Docker, terminal, AI chat, dan Automation dibatalkan; lingkup kini di `docs/product/overview.md` |
| Fase 0-7 perbaikan hasil audit | HANDOFF.md bagian 4 | Fase 0-4 selesai (baseline, backend dan frontend integrasi, auth dan kontrol mati, aksesibilitas, throttler, pendaftaran ditutup, patch Next), sudah di commit `5295ea4`. Fase 5-7 dipindah ke E, F, H |
| Fase S, A-H, P (dokumen ini) | di bawah | Belum ada yang dimulai per 2026-10-30 |

## Tujuan proyek (hasil brainstorm)

DevOS adalah **ruang pribadi seorang developer**: tempat menyimpan hal-hal yang takut hilang dan ingin cepat ditemukan.

1. Link dan bookmark yang berguna.
2. Pengetahuan: snippet, catatan, dan prompt.
3. Password dan secret yang takut hilang, dengan cadangan terenkripsi.
4. Daftar proyek dan statusnya (repo, URL deploy, stack).
5. Sekilas status: aktivitas GitHub, deployment Vercel, uptime dan masa berlaku SSL situs sendiri.
6. Poin penting keamanan sebagai daftar periksa per proyek.

Batasan: satu pengguna, biaya nol (hanya layanan gratis: Supabase, Redis yang sudah ada, API GitHub dan Vercel), tanpa pendaftaran publik, tanpa Docker, tanpa AI berbayar.

Ukuran keberhasilan: setiap modul menjawab satu pertanyaan yang Anda ajukan tiap minggu. Modul yang tidak punya pertanyaan itu dibuang.

## Struktur modul tujuan

| Modul | Keputusan |
|---|---|
| Dashboard | Tetap. Widget: tugas, catatan cepat, aktivitas GitHub, deployment, snippet |
| Projects | Tetap |
| Links | **Baru** (backend `Bookmark` sudah ada, UI belum) |
| Knowledge | Tetap; menyerap AI sebagai tab "Prompts" |
| Developer | Tetap hanya sisi GitHub; Docker dibuang |
| Infrastructure | Tetap; menyerap Monitoring (uptime dan SSL) |
| Security | Menjadi daftar periksa per proyek dan brankas password |
| Workspace | Tetap (todo, catatan, scratchpad) |
| Settings | Tetap |
| AI, Monitoring, Analytics, Automation, Docker | Dibuang sebagai modul berdiri sendiri |

Navigasi akhir sekitar 8 item: Dashboard, Projects, Links, Knowledge, Developer, Infrastructure, Security, Settings.

## Urutan fase

Perkiraan ukuran: K kecil (sebagian sesi), S sedang (satu sesi), B besar (beberapa sesi).

### Fase S: Stabilisasi (review 10-30) (K)

Dikerjakan pertama. Tanpa ini API tidak bisa start, `bun run lint` dan `bun run test` merah, dan dokumen arah hanya ada di satu laptop.

**Status 2026-10-30:** butir 4-8, 11, 12 selesai oleh agen. Butir 1-3 menunggu pemilik (isi `.env`). Butir 9 dan 10 menunggu keputusan pemilik.

**Env (dikerjakan pemilik; agen tidak membaca atau mengubah `.env`):**
1. `ENCRYPTION_KEY` di `.env` root dan `apps/api/.env` panjangnya 33 karakter. Validasi menolaknya, jadi API gagal start (terbukti dengan menjalankan `envValidation` terhadap file itu). Kode lama (`86c0cd4`) memotong kunci ke 32 karakter pertama, jadi **hapus karakter terakhir**, jangan membuat kunci baru. Verifikasi: buka (reveal) satu secret lama dan pastikan integrasi GitHub/Vercel yang tersimpan masih terbaca. Cadangkan kunci di luar repo.
2. Hapus variabel yang tidak dipakai kode dari `.env` lokal: `MEILI_*`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_*`, `GITHUB_CLIENT_*`, `R2_*`, `NEXT_PUBLIC_APP_URL`. `GITHUB_CLIENT_ID/SECRET` terisi di `apps/api/.env`: bila OAuth App itu tidak dipakai di tempat lain, cabut di GitHub.
3. Pastikan `DATABASE_URL` di ketiga file memakai TLS ke Supabase (`sslmode` belum diset) **[verifikasi setelan "Enforce SSL" di Supabase]**. Migrasi (Prisma CLI, root `.env`) memakai port 5432 (session pooler), bukan 6543.

**Konfigurasi (dikerjakan agen):**
4. `.env.example`: tambah `BETTER_AUTH_URL` (wajib di API, tidak ada di contoh) dan `LOG_LEVEL`; `ENCRYPTION_KEY=` kosong dijadikan komentar (string kosong ditolak validasi); hapus variabel yang tidak dipakai (lihat butir 2); tulis per variabel siapa yang membacanya (`apps/api/.env`, `apps/web/.env`, root `.env` untuk Prisma CLI). Jelaskan bahwa token GitHub dan Vercel **tidak** ada di env, melainkan dimasukkan di Settings dan disimpan terenkripsi.
5. `env.validation.ts`: hapus `GITHUB_CLIENT_*`, `GOOGLE_CLIENT_*`, `R2_*`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (keputusan AGENTS.md bagian 9: OAuth tidak diimplementasikan). Perlakukan string kosong sebagai tidak diisi. Pertimbangkan `BETTER_AUTH_SECRET` yang diwajibkan API padahal tidak dibaca kode API.
6. `turbo.json` `globalEnv`: tambah `NEXT_PUBLIC_API_URL` (ditanam saat build; tanpa ini cache turbo bisa menyajikan build dengan URL API lama).

**Test dan lint:**
7. `throttling.http.spec.ts:55` kena batas waktu 5 detik saat `turbo test` berjalan paralel; lulus bila dijalankan sendiri. Naikkan timeout test itu (atau `testTimeout` API), jangan ubah logika throttler.
8. `apps/api` punya script `lint` (ESLint 10) tanpa konfigurasi, sehingga `bun run lint` selalu gagal. Tambah `eslint.config.mjs` minimal memakai `@typescript-eslint/*` yang sudah terpasang (dari Fase F butir 1; bila butuh paket `typescript-eslint`, minta persetujuan). Catat jumlah masalah awal di `baseline.md`; jangan mewajibkan nol.

**Bug kecil tanpa migrasi:**
9. Secret yang dihapus memblokir pembuatan ulang: `remove` hanya mengisi `deletedAt`, sedangkan `@@unique([userId, key])` tetap berlaku (hapus `GITHUB_TOKEN` lalu buat lagi menghasilkan 409). Ciphertext juga tersimpan selamanya. Usulan: hapus permanen baris secret (audit log tetap mencatat), dengan regression test yang gagal sebelum dan lulus sesudah. Alternatif dengan migrasi ada di Fase C butir 4. **Keputusan pemilik:** hapus permanen atau tunggu Fase C.

**Dokumen dan git:**
10. `docs/` ada di `.gitignore`, sehingga `docs/plans/` dan dokumen baru 2026-11-01 (`docs/product/overview.md`, `docs/design/design-system.md`) tidak terlacak kecuali ditambahkan dengan `git add -f`, padahal README dan AGENTS.md merujuknya. **Keputusan pemilik:** hapus `docs/` dari `.gitignore` atau `git add -f` file tertentu.
11. `docs/README.md` (perubahan belum di-commit) berisi balasan chat agen yang tertempel; kembalikan ke isi indeks.
12. HANDOFF.md bagian 9 masih menulis "belum ada yang di-commit"; perbarui ke keadaan setelah `5295ea4`.

Selesai bila: API start dengan `.env` lokal, `bun run type-check`, `bun run lint` (tanpa crash konfigurasi), dan `bun run test` hijau dari root, dan dokumen arah terlacak git.

### Fase A: Penyempitan lingkup dan pembersihan (K-S)

Dikerjakan pertama karena menghapus risiko terbesar (kontrol Docker) dan mengurangi kode yang harus dirawat.

**Status 2026-10-30:** butir 1-4, 6-8 selesai; butir 9 selesai kecuali bagian yang butuh persetujuan atau keputusan. Butir 5 (`bun remove`) menunggu persetujuan. Navigasi kini 8 item termasuk Settings: Workspace tetap ada karena modulnya dipertahankan, dan Links ditambahkan di Fase B.

1. Hapus modul Docker: `apps/api/src/modules/developer/docker*`, tab Docker di halaman Developer, kunci query `dockerContainers`, test terkait.
2. Hapus halaman Analytics dan Automation (hanya placeholder), entri nav dan command palette.
3. Lebur AI ke Knowledge sebagai tab "Prompts" (model `AiPrompt` tetap; rute `/ai` dialihkan ke `/knowledge?tab=prompts`).
4. Lebur Monitoring ke Infrastructure (cek SSL dan uptime).
   - (review 10-30) Halaman Security memanggil `GET /monitoring/audit`; pindahkan endpoint audit log (mis. ke `/security/audit` atau `/settings/audit`) sebelum modul Monitoring dihapus.
   - (review 10-30) Infrastructure kini memeriksa `vercel.com`, `github.com`, `api.github.com`, `registry.npmjs.org` tiap 30 detik (`infrastructure/page.tsx:18`), bukan situs pemilik. Ganti sumbernya dengan `Project.deployUrl` dan tampilkan juga masa berlaku SSL per proyek.
5. Hapus dependensi yang terbukti tidak dipakai (verifikasi dengan `depcheck`; butuh persetujuan): lihat daftar di AGENTS.md bagian 9. Redis dipertahankan (sudah ada dan gratis).
6. Perbarui README dan dokumentasi sesuai struktur baru. **Selesai 2026-11-01**, lebih jauh dari rencana awal (penanda saja):
   - Ditulis ulang dari kode: README root, `apps/web/README.md` (dulu template create-next-app), `apps/api/README.md`, `docs/README.md`, `docs/architecture/{overview,frontend,backend,database}.md`, `docs/engineering/standards.md`.
   - Baru: `docs/product/overview.md` (menggabungkan vision 01-06, information architecture, module breakdown, ditambah alur bisnis per modul) dan `docs/design/design-system.md` (menggantikan tujuh dokumen design).
   - Dihapus: `docs/vision/`, `docs/product/information-architecture.md`, `docs/product/module-breakdown.md`, tujuh dokumen `docs/design/`, `docs/agents/agent-spec.md`, `docs/backend-audit/`, `docs/frontend-audit/`. Cadangan lokal sementara ada di scratchpad sesi 2026-11-01.
   - ADR-001 sampai 004 diberi catatan keadaan nyata; ADR-005 berstatus akan digantikan setelah Fase P. `apps/web/CLAUDE.md` kini hanya merujuk AGENTS.md (isinya dulu memuat placeholder dan aturan yang sudah ada di AGENTS.md). Ke-12 skill di `.agents/skills/` ditulis ulang singkat: peran, aturan yang berlaku di kode, checklist, dan rujukan ke docs (dua skill, product dan reviewer, sebelumnya punya teks nyasar sebelum frontmatter). `docs/plans/COMMITS.md` dihapus; perintah commit diberikan di chat.
7. (review 10-30) Konfigurasi sisa lingkup lama: hapus Meilisearch dari `docker-compose.yml` dan `docker-compose.dev.yml`; tombol "Bookmarks" dan "Reading List" di Knowledge (`knowledge/page.tsx:136`, tanpa fungsi) dihapus atau diarahkan ke `/links` setelah Fase B.
8. (review 10-30) Developer: endpoint `GET /integrations/github/prs` dan `/github/repos` sudah ada dan teruji tetapi tidak dipanggil UI mana pun, sementara README menjanjikan PR dan repo. Tampilkan sebagai tab di Developer menggantikan tab Docker (pola sama dengan tab GitHub: `IntegrationNotice`, `ListSkeleton`).

9. (review 10-30) **Sapu bersih sisa**, dikerjakan setelah butir 1-8 agar sisa dari modul yang dibuang ikut tertangkap. Prinsip: yang sudah dibuat dan memang dimaksudkan untuk dipakai **diselesaikan pemakaiannya**, yang benar-benar sisa dibuang.
   - Dipakai sampai tuntas: `components/shared/loading-state.tsx` (belum diimpor di mana pun) menjadi keadaan memuat standar untuk halaman yang belum punya skeleton; endpoint PR dan repo GitHub (butir 8).
   - Dibuang: `components/shared/module-placeholder.tsx` (hanya dipakai Analytics dan Automation), `apps/web/public/noise.svg`, query key dan entri store milik modul yang dibuang.
   - Butuh persetujuan atau keputusan pemilik: dependensi ganda di `package.json` root (`better-auth`, `@prisma/client`, `pg`, `@vercel/speed-insights`, `lucide-react`); dua set CRUD catatan (`workspace/notes` dan `knowledge/notes`) yang menulis ke tabel `Note` yang sama; model `Widget` dan enum `WidgetSize` yang tidak dipakai (butuh migrasi); widget Pomodoro yang tidak ada di daftar widget tujuan.
   - Syarat selesai: pemindaian impor ulang (file tanpa pengimpor, export tanpa pemakai) dan `depcheck` tidak menunjukkan sisa yang belum diputuskan.

Selesai bila: tidak ada kode Docker, nav 8 item, semua test hijau, `bun audit` tidak bertambah, dan tidak ada dokumen di `docs/architecture` atau `docs/vision` yang menyebut modul terbuang tanpa penanda.

### Fase P: Siap produksi (review 10-30) (S)

Dikerjakan setelah A (agar modul Docker tidak ikut ter-deploy) dan sebelum password asli dimasukkan di Fase C. Agen menyiapkan konfigurasi dan langkah; **agen tidak men-deploy**, dan migrasi database butuh persetujuan.

Masalah yang ditemukan:
- **Cookie sesi tidak sampai ke API bila domain berbeda.** Cookie dibuat Next di domain web; API (`AuthGuard`) membacanya dari request browser (`fetchApi` memakai `credentials: 'include'`). Tidak ada `rewrites` di `next.config.ts` dan tidak ada `crossSubDomainCookies` di `lib/auth.ts`. Di lokal berjalan karena cookie berlaku per host, bukan per port. Dengan web di `*.vercel.app` dan API di `*.onrender.com` (keduanya di Public Suffix List) setiap panggilan API akan 401.
- `render.yaml` hanya berisi API; tidak ada definisi web Next, padahal web butuh `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_API_URL`.
- Tidak ada langkah `prisma migrate deploy` di mana pun.
- `docker-compose.yml` merujuk `apps/web/Dockerfile` dan `apps/api/Dockerfile` yang tidak ada.
- `render.yaml` memakai `runtime: node` dengan `bun install` dan `rootDir: apps/api` **[verifikasi: bun tersedia di runtime Node Render; `postinstall` root (`prisma generate`) ikut berjalan dari `rootDir`]**.

Langkah:
1. **Keputusan pemilik: platform.** Diputuskan 2026-10-31: (a), web di Vercel dan API di Render. Pilihan yang ditimbang:
   - (a) Web di Vercel Hobby, API di Render Free. Render Free tidur setelah tidak aktif sehingga permintaan pertama lambat **[verifikasi ketentuan terbaru]**.
   - (b) Web dan API di Render.
   - (c) VPS dengan Coolify (sesuai ADR-005 lama; hanya bila VPS sudah dimiliki dan gratis).
2. **Keputusan pemilik: cara cookie sampai ke API.**
   - Rekomendasi: Next mem-proxy `/api/v1/:path*` ke API lewat `rewrites` sehingga browser hanya bicara dengan satu origin. CORS dan `NEXT_PUBLIC_API_URL` lintas domain tidak diperlukan lagi. Konsekuensi: IP klien di API menjadi IP proxy, jadi `TRUST_PROXY_HOPS` dan throttler perlu ditinjau **[verifikasi: header cookie dan `X-Forwarded-For` diteruskan oleh rewrite eksternal]**.
   - Alternatif: domain sendiri dengan subdomain `app.` dan `api.` plus `advanced.crossSubDomainCookies` di better-auth.
3. Konfigurasi platform: `render.yaml` (atau setara) untuk kedua layanan, daftar env per layanan dengan placeholder, health check `/api/v1/health/readiness`.
4. Migrasi: tentukan siapa dan kapan `prisma migrate deploy` dijalankan (manual oleh pemilik atau sebagai langkah build). Pakai koneksi session pooler (5432).
5. `docker-compose.yml`: putuskan buat Dockerfile atau hapus compose produksi (compose dev untuk Postgres/Redis lokal tetap berguna).
6. Pembuatan akun pemilik di produksi: `create-owner` dijalankan pemilik terhadap database produksi.
7. Uji asap setelah deploy (dikerjakan pemilik, agen menyiapkan daftar): login, satu panggilan API terautentikasi, readiness, sambung GitHub dan Vercel di Settings, buka satu secret, logout.
8. Catat batas layanan gratis: Supabase gratis bisa dijeda bila lama tidak aktif, Render Free tidur **[verifikasi ketentuan terbaru keduanya]**.

Selesai bila: login dan satu panggilan API terautentikasi berhasil di URL produksi, migrasi terdokumentasi, ADR deploy baru menggantikan ADR-005.

### Fase B: Links (S)

Fitur yang paling Anda inginkan, dan yang saat ini hanya punya backend (tombol "Bookmarks" dan "Reading List" di Knowledge tidak berfungsi).

1. Halaman `/links`: daftar, tambah, ubah, hapus, pin, tag, pencarian, filter tag. Keadaan loading, kosong, dan galat.
2. Impor file bookmark HTML (format ekspor Chrome, Edge, dan Firefox), pratinjau sebelum simpan, deduplikasi per URL.
3. Ekspor ke HTML dan JSON.
4. Tambah cepat: halaman `/links/add?url=&title=` plus bookmarklet yang membukanya. Tanpa ekstensi browser, tanpa biaya.
5. Pengecekan link rusak (manual, bukan otomatis di latar).
6. Daftar bacaan menjadi tag atau flag "baca nanti", bukan modul terpisah.

Selesai bila: impor bookmark nyata dari Chrome berhasil, dan test mencakup impor, deduplikasi, dan batas input.

### Fase C: Brankas password dan secret (B)

Ini fase paling berisiko karena menyimpan data paling sensitif. Urutannya sengaja mengamankan akses dulu, baru mengisi data.

**Prasyarat keamanan (sebelum memasukkan password asli):**
1. Login dua faktor (TOTP) atau passkey lewat plugin better-auth. README sudah merencanakan passkey.
2. Verifikasi ulang (masukkan password lagi) untuk melihat nilai (`reveal`), batas laju khusus, nilai tersembunyi otomatis setelah N detik, dan hapus clipboard setelah N detik.
3. Sesi lebih pendek untuk halaman brankas.

**Model data v2 (butuh migrasi Prisma dan persetujuan):**
4. Tambah `url`, `username`, `notes`, `tags`, `type` (password, api-key, ssh, dll). Ubah keunikan: sekarang `@@unique([userId, key])`, yang menolak dua login berbeda untuk situs yang sama. (review 10-30) Keunikan baru juga tidak boleh berlaku untuk baris yang sudah dihapus (lihat Fase S butir 9; bila soft delete dipertahankan, butuh indeks unik parsial `WHERE "deletedAt" IS NULL` lewat SQL di migrasi karena Prisma tidak mendukungnya di skema), dan nilai terenkripsi dihapus saat secret dihapus.
5. Nilai tetap AES-256-GCM di sisi server. Catatan: jika database dan `ENCRYPTION_KEY` bocor bersamaan, semua terbuka.

**Masuk dan keluar data:**
6. Impor CSV dari Chrome atau Google Password Manager dan Bitwarden, dengan pratinjau, deduplikasi, dan tanpa mencatat nilai ke log.
7. Ekspor cadangan terenkripsi dengan passphrase (file `.devos-backup`), plus pemulihan. Uji pemulihan penuh pada database kosong.
8. Alat rotasi `ENCRYPTION_KEY` (dekripsi dengan kunci lama, enkripsi ulang dengan kunci baru) dan panduan pemulihan. **Hilang `ENCRYPTION_KEY` berarti hilang semua nilai**, jadi kunci itu juga harus dicadangkan.

**Keputusan yang masih terbuka di fase ini:** enkripsi sisi klien (zero-knowledge dengan master password, sehingga bocor database saja tidak cukup, tetapi lupa master password berarti data hilang selamanya) atau tetap di sisi server dengan 2FA. Rekomendasi: mulai dari sisi server dengan 2FA dan verifikasi ulang; nilai ulang zero-knowledge setelah Fase C selesai.

### Fase D: Daftar periksa keamanan per proyek (S)

1. Item per proyek: 2FA aktif, tanggal terakhir rotasi key, tanggal domain kedaluwarsa, backup ada, dan sejenisnya. Bisa dicentang dan diberi tanggal.
2. Masa berlaku SSL dicek otomatis (sudah ada di Monitoring, dipindah).
3. Tautan ke brankas: item yang merujuk secret tertentu.
4. Widget dashboard: "yang perlu perhatian" (SSL hampir habis, rotasi terlambat).

### Fase E: Performa dan Core Web Vitals (dari Fase 5 lama) (S-B)

Dikerjakan setelah modul dirapikan, supaya tidak mengoptimalkan kode yang dibuang.

0. **Baseline halaman di balik login:** fixture Playwright memakai akun uji dari lingkungan (`E2E_EMAIL`, `E2E_PASSWORD`, milik Anda, tidak dibaca agen). Tes bersifat baca-saja, sebaiknya dengan akun terpisah.
1. Tema ditentukan sebelum paint (`next-themes` sudah terpasang tapi tidak dipakai).
2. Font: nyalakan preload, bandingkan LCP dan CLS.
3. Cache sesi: `session.cookieCache` di better-auth dan cache singkat di `AuthGuard` API.
4. Gambar: `next/image` dengan `remotePatterns`.
5. CLS dashboard: skeleton `WidgetGrid` harus sama jumlahnya dengan widget aktif.
6. Air terjun data: Server Component dengan prefetch untuk halaman yang berat, hanya jika baseline menunjukkan manfaat.
7. Evaluasi `next build --webpack` (apakah masih perlu).
8. Ukur ulang dengan skrip yang sama (lihat `docs/plans/baseline.md` bagian 4). `/reset-password` LCP 2080 ms masih dekat batas.

### Fase F: Penguatan dan CI (dari Fase 6 lama) (S)

1. Konfigurasi ESLint untuk `apps/api` (konfigurasi minimal dibuat di Fase S butir 8; di sini aturan dirapikan dan temuannya dikurangi) dan kurangi `any` yang tersisa. Status 2026-10-30: error lint web sudah 0 (termasuk semua `any`); yang tersisa 23 peringatan `any` di API dan 8 peringatan di web.
2. CI (GitHub Actions gratis): lint, type-check, test, build; test browser opsional. (review 10-30) Repo belum punya folder `.github/` sama sekali; tanpa CI, test hanya berjalan bila dijalankan manual.
3. Tutup celah SSRF di cek uptime: resolusi DNS lalu blokir IP privat, dan tolak redirect ke jaringan privat. (review 10-30) Temuan spesifik di `monitoring.controller.ts:11` dan `ssl.service.ts:109`: pola `\[?fc|\[?fd` juga menolak host sah seperti `fcc.gov` dan `fdic.gov`; `fetch` mengikuti redirect; alamat IPv6 yang memetakan IPv4 (`[::ffff:127.0.0.1]`) lolos. Kerjakan bersama perpindahan ke Infrastructure (Fase A butir 4) dan beri test.
4. Reset password tanpa email: skrip `reset-owner-password` yang dijalankan pemilik, karena penyedia email berarti layanan tambahan. Pesan di UI diperbarui. (review 10-30) Saat ini tautan reset (berisi token) dicetak ke log server (`lib/auth.ts:21`); di platform hosting log itu tersimpan, jadi hentikan pencetakan begitu skrip ini ada.
5. Sisa temuan `bun audit` (38, tidak ada yang kritis).
6. Sinkronkan `docs/architecture/*` dengan kenyataan (rincian di Fase A butir 6; bagian yang bergantung pada platform deploy diselesaikan setelah Fase P).
7. Opsional: counter Throttler di Redis jika API dijalankan lebih dari satu instance.
8. (review 10-30) Test untuk service yang belum punya test: `projects`, `knowledge` (notes, snippets), `bookmarks` (jika belum tercakup di Fase B), `workspace/notes`, `settings`, `prompts`. Prioritas: kepemilikan data (pengguna A tidak bisa membaca atau mengubah milik B), soft delete, pagination.
9. (review 10-30) Redis: `CacheService` hanya dipakai health readiness, dan klien ioredis tidak punya listener `error` (Redis yang mati menghasilkan log "Unhandled error event" berulang). Tambah listener dan batas percobaan ulang, atau keluarkan Redis dari readiness bila tetap tidak dipakai untuk hal lain.

### Fase G: Penangkapan otomatis dari browser (opsional, B)

Jawaban atas keinginan "login lalu tersimpan di sini". Hanya dikerjakan setelah Fase C selesai dan terbukti aman.

- Ekstensi browser (Manifest V3) yang mendeteksi form login dan mengirimkan ke API DevOS lewat token berumur pendek.
- Risiko: skrip konten membaca password di setiap situs, jadi ekstensi harus minimal, tanpa pihak ketiga, dengan izin sesempit mungkin, dan dipasang hanya secara lokal (tanpa toko ekstensi).
- Alternatif yang jauh lebih ringan: impor CSV berkala (Fase C) dan ekspor ulang dari Chrome.

### Fase H: Verifikasi akhir (dari Fase 7 lama) (K)

Jalankan ulang seluruh baseline, bandingkan, dan susun laporan: yang diperbaiki, yang belum, yang tidak bisa diverifikasi. Perbarui bagian "terkonfirmasi" dan "[verifikasi]" di AGENTS.md.

## Ringkasan urutan

| Urutan | Fase | Isi | Ukuran | Bergantung pada |
|---|---|---|---|---|
| 1 | S | Stabilisasi: env, lint, test flaky, bug secret, docs ke git | K | - |
| 2 | A | Penyempitan lingkup dan pembersihan | K-S | S |
| 3 | P | Siap produksi: platform, cookie ke API, migrasi, konfigurasi | S | A; keputusan pemilik soal platform |
| 4 | B | Links | S | A |
| 5 | C | Brankas password dan secret | B | A; P bila brankas dipakai di produksi |
| 6 | D | Daftar periksa keamanan | S | A, C (tautan ke brankas) |
| 7 | F | Penguatan dan CI | S | A (butir 2 CI bisa lebih awal, setelah S) |
| 8 | E | Performa dan Core Web Vitals | S-B | A, B, C |
| 9 | G | Penangkapan dari browser (opsional) | B | C |
| 10 | H | Verifikasi akhir | K | semua |

B dan C bisa digarap berurutan tanpa saling menunggu setelah A. E sebaiknya sesudah B dan C agar halaman barunya ikut terukur. P bisa dikerjakan paralel dengan B karena menyentuh konfigurasi, bukan fitur.

### Keputusan pemilik yang menahan pekerjaan

| Keputusan | Menahan | Lokasi |
|---|---|---|
| Hapus permanen secret atau tunggu Fase C | Fase S butir 9 | Fase S |
| `docs/` dilacak git atau tidak | Fase S butir 10 | Fase S |
| Platform deploy | **Diputuskan 2026-10-31: web di Vercel, API di Render.** Render Free tidur saat sepi; ping berkala atau platform lain masih dipertimbangkan (GitHub Student Pack tidak bisa dipakai) | Fase P butir 1 |
| Proxy lewat Next atau subdomain dengan cookie lintas subdomain | Fase P | Fase P butir 2 |
| Brankas sisi server + 2FA atau zero-knowledge | Fase C | Fase C |
| Satukan `workspace/notes` dan `knowledge/notes`, atau beri pembeda | Fase A butir 9 | Fase A |
| Hapus model `Widget` (migrasi) | Fase A butir 9 | Fase A |
| Pertahankan atau buang widget Pomodoro | Fase A butir 9 | Fase A |
| Hapus dependensi tak terpakai dan ganda (`bun remove`) | Fase A butir 5 dan 9 | Fase A |
