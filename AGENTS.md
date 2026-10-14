# AGENTS.md — DevOS (Rizqydevos)

Aturan kerja untuk agent AI di repo ini. Bahasa komunikasi: Indonesia. Kode, nama identifier, dan pesan commit: Inggris.
Terakhir diverifikasi terhadap kode: 2026-10-14. Item bertanda **[verifikasi]** belum dikonfirmasi lewat eksekusi atau pengukuran dan tidak boleh dilaporkan sebagai fakta.

## 0. Arah proyek (revisi 2026-10-14)

DevOS adalah ruang pribadi satu developer: link, pengetahuan, prompt, password yang takut hilang, daftar proyek, status GitHub dan Vercel, dan daftar periksa keamanan. Satu pengguna, biaya nol, tanpa pendaftaran publik. Modul Docker, Analytics, Automation, AI (dilebur ke Knowledge), dan Monitoring (dilebur ke Infrastructure) dijadwalkan dibuang; Links dan brankas password dikembangkan.

Sebelum mengerjakan apa pun, baca berurutan: `docs/plans/HANDOFF.md` (keadaan terakhir dan jebakan), `docs/plans/ROADMAP.md` (fase A sampai H), `docs/vision/06-scope-update-2026-10.md` (keputusan lingkup). Bila bagian lain dokumen ini bertentangan dengan arah ini (misalnya menyebut modul yang akan dibuang), arah ini yang berlaku. Jangan memperbaiki, menambah test, atau mengoptimalkan modul yang dijadwalkan dibuang kecuali diminta. Pemilik membuat commit dan push sendiri; rencana commit ada di `docs/plans/COMMITS.md`.

## 1. Konteks proyek

DevOS adalah command center pribadi untuk developer. Monorepo Bun + Turborepo.

| Lapisan | Teknologi (versi dari package.json) |
|---|---|
| Web `apps/web` | Next.js 16.3.2 App Router (build dengan `--webpack`), React 19.2.8, Tailwind CSS 4, TanStack Query 5, Zustand 5 (persist), cmdk, sonner, motion, nuqs, Radix (dropdown-menu, tabs, slot), lucide-react |
| Auth | better-auth 1.7 (email + password, tanpa social login), session cookie, dijalankan di Next (`app/api/auth/[...all]`) |
| API `apps/api` | NestJS 11, class-validator + ValidationPipe (whitelist, forbidNonWhitelisted), helmet, throttler, pino, ioredis, Octokit |
| Data | PostgreSQL via Prisma 7.9 (`@prisma/adapter-pg`), skema di `prisma/schema.prisma`, migrasi `prisma/migrations` |
| Shared | `packages/types` (`@devos/types`) |
| Test | Vitest (api dan web), Testing Library + jsdom (web) |
| Deploy | `render.yaml` (API), `docker-compose*.yml`, health check `/api/v1/health` |

Peta modul API: `projects`, `workspace` (todo, notes, bookmarks), `knowledge` (notes, snippets), `ai` (prompts), `developer` (docker), `integrations` (github, vercel), `monitoring` (ssl, health), `secrets`, `settings`. Semua route dilindungi `AuthGuard` global kecuali `@Public()`.

Perintah (jalankan dari root):

```
bun run dev | build | lint | type-check | test
bun run --cwd apps/web test        # satu workspace
```

Fakta yang sudah terverifikasi dan sering menjebak:

* `next lint` **dihapus di Next 16** (dokumen di `apps/web/node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`); script `lint` web sudah diganti ke `eslint`, dan `next build` tidak lagi menjalankan lint. `eslint` web diturunkan ke `^9.39.5` karena `eslint-plugin-react` 7.37.5 hanya mendukung ESLint `^9.7` (ESLint 10 membuatnya crash); `bun audit` identik sebelum dan sesudah. Lint web kini berjalan: baseline awal 62 masalah, per akhir Fase 4 tinggal 33 (18 error, 15 peringatan; rincian awal di `docs/plans/baseline.md`). Jangan menambah masalah baru. Vitest web memakai runtime JSX otomatis (`vite.config.ts`) seperti Next, jadi komponen tidak perlu `import React` agar bisa diuji. `apps/api` tidak punya konfigurasi ESLint sama sekali. Test browser: `bun run build`, lalu `bun run --cwd apps/web test:e2e` (Playwright memakai Chrome sistem, tanpa unduhan browser; halaman di balik login belum tercakup karena butuh database).
* Keamanan dependensi (`bun audit`, 2026-10-14): Next dinaikkan 16.3.2 ke 16.3.8 (versi perbaikan untuk 3 advisory RCE kritis) dan `overrides.proxy-addr ^2.0.8` di root menutup advisory kritis `proxy-addr`. Temuan turun dari 50 (4 kritis) ke 38 (0 kritis); sisanya tinggi/sedang pada dependensi transitif (mis. `fast-uri`, `engine.io`, `browserslist`) belum ditangani. Versi Next di-pin tepat (tanpa `^`) bersama `eslint-config-next`; naikkan keduanya bersamaan.
* Test API hanya mencari `src/**/*.spec.ts` (`apps/api/vitest.config.ts`); sebelumnya Vitest ikut menjalankan hasil kompilasi di `dist/`.
* `src/proxy.ts` adalah pengganti `middleware.ts` di Next 16. Jangan buat `middleware.ts`.
* Sebelum menulis kode Next.js, baca panduan terkait di `apps/web/node_modules/next/dist/docs/`. API Next di repo ini bisa berbeda dari pengetahuan umum.
* `docs/engineering/standards.md` sebagian usang: menyebut pnpm, Playwright, `@/lib/api/client`, folder `features/`. Kenyataan di repo: Bun, `fetchApi` di `@/lib/api`, tanpa `features/`, tanpa Playwright. Bila bertentangan, ikuti kode yang ada lalu laporkan, jangan "memperbaiki" kode agar cocok dengan dokumen.
* `.agents/skills/devos-*` adalah skill per peran (architect, backend, frontend, security, qa, performance, ux, dll). Muat skill yang relevan sebelum bekerja di domainnya.

## 2. Rahasia dan file env (tidak bisa ditawar)

* Jangan membaca, mencetak, menyalin, atau menaruh di commit isi `.env`, `.env.*` selain `.env.example`, token, kunci API, `ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `DATABASE_URL`.
* Untuk mengetahui variabel apa yang ada, baca `.env.example` atau `apps/api/src/config/env.validation.ts` (nama saja). Jangan `cat .env`.
* Contoh dan test memakai placeholder (`<token>`, `test-token`). Jangan menempel token asli ke log, test, snapshot, atau pesan.
* Token integrasi disimpan terenkripsi (`encryption.util.ts`, kunci tepat 32 byte). Jangan pernah mengembalikan token, terenkripsi maupun terdekripsi, di respons API.
* Temuan rahasia yang bocor: hentikan, laporkan lokasinya (file dan baris, tanpa nilainya), sarankan rotasi.

## 3. Cara kerja agent

Komunikasi:

* Langsung ke inti. Tanpa pembuka ("Tentu...") dan penutup ("Semoga membantu"). Tanpa emoji.
* Ringkas bukan berarti menghilangkan isi wajib. Bila template di bagian 4 meminta penjelasan, daftar file, atau langkah verifikasi, itu wajib hadir, dalam bentuk paling padat.
* Pisahkan **bukti** (dibaca di kode, output perintah) dari **dugaan**. Tandai dugaan dengan jelas. Jangan menyatakan "sudah diperbaiki" atau "lebih cepat" tanpa verifikasi atau pengukuran.
* Gunakan format tautan `[file.ts:12](path#L12)` untuk referensi kode.

Izin eksekusi:

* Boleh langsung: membaca file, `grep`, `bun run type-check`, `bun run lint`, `bun run test`, build lokal. Ini verifikasi, bukan efek samping.
* Wajib persetujuan sebelum: `bun add/remove/install`, operasi Git yang menulis (commit, push, reset, checkout file), migrasi database, menjalankan container, deploy, apa pun yang mengirim data ke layanan luar. Berikan snippet perintah dengan satu kalimat deskripsi.
* Jangan ubah file di luar lingkup permintaan. Tidak ada refactor atau pembersihan "sekalian".

Saat error:

* Satu perbaikan, verifikasi, lalu berhenti bila gagal beruntun (dua kali percobaan berbeda tanpa kemajuan). Jelaskan akar masalah dalam 1-2 kalimat, sebutkan log atau data yang kurang, tunggu instruksi.

Kode:

* Periksa utilitas bawaan bahasa/framework/dependensi yang sudah terpasang sebelum menulis fungsi baru. Reuse dulu (`cn`, `fetchApi`, `createQueryOptions`, `queryKeys`, komponen di `components/ui` dan `components/shared`).
* Sederhana, bukan sependek mungkin. Satu baris yang sulit dibaca lebih buruk daripada tiga baris yang jelas. Tanpa over-engineering.
* Penamaan: variabel camelCase, komponen PascalCase, konstanta SCREAMING_SNAKE_CASE, folder kebab-case.
* Komentar hanya untuk menjelaskan **mengapa** (aturan bisnis, workaround, algoritma non-trivial).
* TypeScript: tanpa `any` baru (gunakan `unknown` atau tipe dari `@devos/types`), tanpa `!` non-null assertion baru, tanpa `@ts-ignore`. Kode lama masih banyak `any` (hutang teknis, lihat bagian 9); jangan menambah, kurangi saat menyentuh file itu.
* Server Component secara default. `'use client'` hanya bila perlu state, effect, atau event handler.
* Data fetching lewat `fetchApi` + TanStack Query dengan kunci dari `queryKeys`. Jangan `fetch` langsung di komponen dan jangan `useEffect` untuk fetch.
* Definisi selesai (DoD): `type-check` hijau, test relevan hijau, tidak ada `console.log` baru, keadaan loading/error/empty ada, bisa dioperasikan keyboard, tidak ada rahasia di diff. Bila ada yang tidak dijalankan, tulis "belum dijalankan" beserta perintahnya.

## 4. Protokol prompt

Ini adalah pola permintaan yang valid dan efektif karena memberi konteks, batas lingkup, kriteria sukses, dan cara verifikasi. Prinsipnya benar; tiga catatan agar tidak keliru dipakai:

1. Itu template bagi penulis prompt, bukan aturan otomatis. Tanda kurung siku harus diisi. Placeholder yang lolos (seperti `[React / Next.js App Router]` di AGENTS.md lama) menjadi instruksi yang salah.
2. "Perbaikan terkecil" tidak boleh berarti menambal gejala. Untuk bug, akar masalah dulu, lalu perbaikan seminimal mungkin pada akar itu.
3. Template menuntut penjelasan dan verifikasi, yang bertabrakan dengan gaya "tanpa basa-basi" bila dibaca mentah. Aturannya: tanpa basa-basi, tetapi isi wajib template tetap ada.

Bila permintaan pengguna cocok dengan salah satu jenis di bawah, agent mengikuti kolom "Perilaku agent". Bila permintaan kurang detail, agent mengisi sendiri dari kode; hanya bertanya bila jawabannya mengubah hasil build, maksimal tiga pertanyaan.

| # | Jenis | Perilaku agent | Keluaran wajib |
|---|---|---|---|
| 1 | Pahami proyek | Baca-saja. Telusuri layar, logika, alur data. Jangan edit. | File terkait, kode yang bisa dipakai ulang, file yang perlu diubah, pendekatan terkecil, istilah asing dijelaskan singkat, hal yang tidak bisa diverifikasi |
| 2 | Ide jadi spesifikasi | Tulis spesifikasi yang bisa dibangun dengan teknologi dan batasan repo ini. | Langkah pengguna, input, kriteria sukses, state loading/empty/error, checklist penerimaan |
| 3 | Bangun fitur | Ikuti struktur dan gaya yang ada, reuse yang terpasang, fokus. | State loading/gagal/sukses, penjelasan dependensi baru (butuh persetujuan), daftar file berubah, langkah verifikasi |
| 4 | Diagnosis error | Telusuri penyebab. Pisahkan bukti dan dugaan. Minta log spesifik bila kurang. | Penyebab, perbaikan terkecil pada akar, alasan berhasil, langkah reproduksi dan verifikasi |
| 5 | Bug berulang | Reproduksi dulu, jelaskan mengapa perbaikan lama gagal, perbaiki akar. | Regression test yang **gagal sebelum** dan **lulus sesudah** perbaikan (jalankan keduanya) |
| 6 | Layout mobile | Temukan aturan layout penyebab. Jaga desktop. Tanpa offset acak. | Cek teks panjang, scroll, keyboard virtual; penjelasan dan langkah verifikasi di lebar 320 dan 390 px |
| 7 | Perbaiki form | Error per field, input terjaga saat gagal, cegah submit ganda, sukses jelas, label dan keyboard tetap benar. | Daftar validasi yang juga wajib di server |
| 8 | Hubungkan API | Pakai endpoint dan field yang terdokumentasi. Tangani loading, kosong, gagal, rate limit. Kredensial tidak masuk kode browser. | Placeholder konfigurasi, langkah verifikasi, asumsi API yang belum terpastikan |
| 9 | Halaman lambat | Peringkatkan hambatan berdasarkan bukti. Sebut pengukuran yang kurang. Perbaiki yang paling terbukti tanpa mengubah perilaku. | Pengukuran sebelum dan sesudah pada kondisi sama; klaim hanya bila terukur (lihat bagian 7) |
| 10 | Tulis test | Pakai Vitest yang ada. Normal, batas, kegagalan realistis. Assert hasil yang teramati, bukan implementasi. Layanan luar di-mock. | Penjelasan apa yang dilindungi tiap test; jalankan, atau tandai "belum dijalankan" + perintah |
| 11 | Refactor aman | Pertahankan input, output, error, perilaku. Pastikan ada test pelindung dulu. Tanpa dependensi baru, tanpa pembersihan tak terkait. | Manfaat, bukti pemanggil lama masih jalan |
| 12 | Review sebelum merge | Prioritas: bug, regresi, data terekspos, penanganan gagal yang hilang. | Tiap temuan: lokasi, skenario pemicu konkret, perbaikan terfokus. Pisahkan **terkonfirmasi** dari **pertanyaan terbuka**. Lewati selera kosmetik |
| 13 | Siapkan deploy | Periksa build, konfigurasi, env, kebutuhan server. Selesaikan penghalang level proyek. **Jangan deploy.** | Langkah deploy persis, lokasi konfigurasi, cek alur kritis, placeholder rahasia, detail platform yang perlu diverifikasi |

Tambahan khusus repo:

* Jenis 8 dan 13: lihat bagian 6 (integrasi) dan `render.yaml`, `docker-compose.yml`. Variabel env yang wajib ada di `apps/api/src/config/env.validation.ts`; jangan menebak nama.
* Jenis 9: selalu ukur di build produksi (`bun run build` lalu `bun run --cwd apps/web start`), bukan `next dev`.
* Jenis 12: gunakan skill `devos-reviewer` dan `devos-security`.

## 5. UI dan styling

Gaya (berlaku untuk kode baru; kode lama yang melanggar dicatat di bagian 9):

* Flat design, warna solid dari token di `globals.css` (`--color-*`). Tanpa gradient, tanpa teks berwarna-warni tanpa alasan semantik, tanpa emoji atau ikon dekoratif klise (sparkles dan sejenisnya).
* Loading: skeleton (`components/ui/skeleton`) atau teks status. Tanpa spinner berputar. Alasan ganda: rapi secara visual dan lebih mudah dibuat aksesibel.
* Salinan teks (copy) lugas dan fungsional. Hindari istilah dramatis ("Initialize identity", "Override?", "Email Node"); pakai "Sign in", "Create account", "Forgot password?", "Email".
* Tanpa gaya inline. Nilai Tailwind arbitrer (`text-[12px]`, `w-[347px]`) hanya bila token belum ada; ukuran teks minimal 12px (lihat bagian 7).
* `components/ui/*` adalah komponen dasar. Perubahan harus kecil dan berlaku untuk semua pemakai.
* Jangan menandai warna sebagai satu-satunya pembawa makna (status connected/disconnected harus punya teks).

## 6. Integrasi GitHub dan Vercel

Alur saat ini: Settings (`settings/page.tsx`) menyimpan token (PAT GitHub / token Vercel) lewat `POST /api/v1/integrations/:provider` → `IntegrationsService.upsert` mengenkripsi dan menyimpan di tabel `Integration` (unik per `userId, provider`). Widget GitHub (`github-widget.tsx`), halaman Developer, Infrastructure, dan widget server-health memanggil `GET /integrations/github/{activity,prs,repos}` dan `GET /integrations/vercel/deployments`. Tidak ada OAuth: `GITHUB_CLIENT_ID/SECRET` ada di env validation tetapi tidak dipakai `lib/auth.ts` (tanpa `socialProviders`) maupun kode lain.

### Status per 2026-10-14: backend (Fase 1) dan frontend (Fase 2) diperbaiki

Sisi `apps/api` untuk butir 1, 2, 4, 5, 6, 7, 8 di bawah sudah diperbaiki dan diuji (99 test API lulus, termasuk test HTTP end-to-end terhadap pipe, filter, dan interceptor yang sama dengan `main.ts`). Sisi `apps/web` untuk butir 3, 4, 8 (grafik palsu), dan 9 juga selesai (108 test web lulus): `fetchApi` membawa `code` dan `retryAfter` pada `ApiError`; `lib/integrations.ts` memetakan kode ke pesan dan tindakan (`describeIntegrationError`) dan menghentikan retry untuk galat permanen; `IntegrationNotice` dan `ListSkeleton` dipakai bersama oleh widget GitHub, widget deployments, tab GitHub di Developer, dan halaman Infrastructure; `IntegrationCard` (Settings) memvalidasi di sisi klien, menampilkan galat token pada field, mencegah submit ganda, dan mengumumkan hasil lewat `role="status"`. Yang masih terbuka: pagination Vercel di UI, penghapusan field lama `url`/`project` dari respons Vercel, scope token GitHub yang belum terdokumentasi, dan pengujian terhadap API Vercel/GitHub sungguhan. Perilaku API yang wajib dipakai frontend:

| Kode galat | HTTP | Arti | Tindakan UI |
|---|---|---|---|
| `INTEGRATION_NOT_CONFIGURED` | 404 | Belum terhubung | Ajak ke Settings |
| `INTEGRATION_DISABLED` | 409 | Dimatikan pengguna | Tawarkan aktifkan |
| `TOKEN_UNREADABLE` | 409 | Token tersimpan tak bisa dibaca (kunci enkripsi berubah) | Minta sambungkan ulang |
| `TOKEN_REJECTED` | 424 | Provider menolak token tersimpan | Minta perbarui token |
| `INTEGRATION_TOKEN_INVALID` | 422 | Token ditolak saat disimpan | Tampilkan di field token |
| `RATE_LIMITED` | 429 | Batas provider; `error.retryAfter` (detik) dan header `Retry-After` | Tampilkan waktu tunggu |
| `UPSTREAM_UNAVAILABLE` | 502/504 | Provider tidak tersedia atau timeout | Tombol coba lagi |

401 kini hanya berarti sesi aplikasi habis. Endpoint baru atau berubah: `GET /integrations` mengembalikan `{ id, provider, enabled, metadata: { accountLogin?, teamId? }, updatedAt }`; `POST /integrations/:provider` menerima `{ accessToken, teamId? }` (hanya Vercel untuk `teamId`) dan memvalidasi token ke provider; `PATCH /integrations/:provider` menerima `{ enabled }`; `DELETE` selalu 204; provider selain `github` dan `vercel` dijawab 400. Field Vercel `url` (host saja) dan `project` dipertahankan agar UI lama tidak rusak; hapus keduanya bersama migrasi UI di Fase 2 dan pakai `href` dan `environment`.

Hal yang sengaja tidak diubah di Fase 1: cache Redis untuk respons GitHub (React Query sudah menyimpan 60 detik, dan Redis yang macet dapat menahan request; tambahkan hanya bila ada ukuran yang menunjukkan perlu), pagination kursor Vercel (UI belum memakainya; `fetchApi` membuang `meta`), dan throttler (lihat bagian 8).

Daftar cacat awal (temuan sebelum Fase 1), berurutan menurut dampak:

1. **Token tidak divalidasi saat disimpan.** `upsert` hanya mengenkripsi dan menyimpan. UI menampilkan "Successfully connected" dan badge "Connected" untuk token yang salah atau kedaluwarsa. Perbaikan: panggil `GET /user` (GitHub) dan endpoint identitas Vercel **[verifikasi path di dokumentasi Vercel]** sebelum menyimpan; simpan hasilnya (login, teamId) di `metadata`; tolak dengan 422 dan kode galat yang jelas.
2. **Semua kegagalan hulu menjadi 401.** `github.service.ts` dan `vercel.service.ts` membungkus setiap error (rate limit 403/429, 5xx, timeout, gagal dekripsi akibat `ENCRYPTION_KEY` berubah, bug sendiri) menjadi `UnauthorizedException("... Check your token")`. 401 berarti sesi aplikasi habis. Perbaikan: petakan galat hulu ke kode terpisah (token ditolak, rate limit + `retry-after`, hulu tidak tersedia/timeout, integrasi belum dikonfigurasi) dan jangan pernah mengembalikan 401 untuk kegagalan hulu.
3. **Frontend menelan penyebab.** `github-widget.tsx` mengganti semua error menjadi "Integration not configured". `fetchApi` tidak menangani 401/429 secara khusus. Perbaikan: baca `ApiError.status` dan kode galat, tampilkan pesan sesuai (belum terhubung, token ditolak, rate limit, coba lagi), dengan tombol coba lagi.
4. **Status "Connected" salah.** UI memakai `integrations.some(provider)` dan mengabaikan `enabled`. Tidak ada endpoint untuk mengubah `enabled`, padahal `UpdateIntegrationDto` ada. `GET /integrations` tidak mengembalikan `metadata`, sehingga UI tidak bisa menampilkan akun yang terhubung.
5. **`:provider` tanpa whitelist.** `POST /integrations/apa-saja` menyimpan baris baru. DTO menerima `provider` opsional lalu ditimpa dari param; `metadata` bertipe `any` tanpa validasi. Perbaikan: `ParseEnumPipe`/whitelist (`github`, `vercel`), validasi `metadata`.
6. **Disconnect tidak idempoten.** `remove` memakai `delete`; bila baris tidak ada, Prisma melempar P2025 dan controller mengubahnya jadi 500. Gunakan `deleteMany` atau tangani P2025 sebagai 204/404.
7. **Vercel hanya akun pribadi.** Request tanpa `teamId` tidak menampilkan deployment milik team. Field `project` diisi `dep.target` (sebenarnya production/preview), nama proyek ada di `name`. `url` tanpa skema `https://`. Tidak ada pagination. Respons bertipe `any`. Verifikasi bentuk respons v6 (`state` atau `readyState`) terhadap dokumentasi **[verifikasi]**.
8. **GitHub.** `repositoryUrl` PR berupa URL API mentah, bukan nama repo. Grafik kontribusi di widget adalah data palsu dari `Math.random()` yang berubah tiap render; hapus atau ganti data nyata. Scope token yang dibutuhkan belum didokumentasikan; placeholder "classic or fine-grained" menyesatkan tanpa daftar izin minimal **[verifikasi scope]**. Setiap request membuat `Octokit` baru dan membaca + mendekripsi token dari DB; `CacheService` (Redis) sudah ada tetapi tidak dipakai di sini.
9. **Form token tidak aksesibel** (lihat bagian 7): input hanya punya placeholder, tanpa `<label>`; hasil tidak diumumkan ke pembaca layar.

Aturan untuk perubahan di area ini:

* Kontrak galat harus punya test (Vitest, Octokit dan `fetch` di-mock). Titik awal: `integrations.http.spec.ts` (kontrak HTTP), `github.service.spec.ts`, `vercel.service.spec.ts`.
* Jangan log token, header `Authorization`, atau objek error Octokit mentah (bisa membawa header permintaan). Log hanya status dan flag.
* Octokit 22 tidak punya opsi `request.timeout`; satu-satunya batas waktu adalah `request.signal: AbortSignal.timeout(ms)`. Opsi lama membuat permintaan menggantung tanpa batas (terbukti terhadap server yang tidak menjawab). Pembatalan muncul sebagai `HttpError` status 500, jadi timeout GitHub terlihat sebagai 502, bukan 504.
* Connect/toggle/disconnect ditulis ke `AuditService` lewat `IntegrationConnectionService`. Jangan memasukkan token atau metadata mentah ke audit log.
* Endpoint Vercel `GET /v2/user` dan `GET /v6/deployments` diuji hanya dengan mock; belum dicoba terhadap API sungguhan karena agent tidak memegang token. Verifikasi manual pertama oleh pemilik repo.
* Verifikasi manual memakai token uji milik pengguna di sesi lokal; agent tidak pernah meminta atau menyimpan token.

Auth dan kontrol mati (Fase 3), status per 2026-10-14:

* **Selesai: `redirectTo`.** Login membaca `?redirectTo=` lewat `safeRedirectPath` (`lib/auth-guard.ts`), yang hanya menerima path internal dan menolak `//host`, `/\host`, URL absolut, karakter kontrol, dan `/login`. Proxy sebelumnya menggandakan query string (`/p?x=1` menjadi `redirectTo=/p?x=1?x=1`); `getRedirectUrl` kini menerima path lengkap dan tidak menambah lagi. Terverifikasi pada server produksi.
* **Selesai: pendaftaran ditutup (2026-10-14).** DevOS satu pengguna dan pendaftaran publik adalah non-goal (`docs/vision/05-non-goals.md`); semua pengguna yang login bisa mengakses modul Docker dan secrets. Hanya `OWNER_EMAIL` yang bisa membuat akun, dipaksa di better-auth lewat `databaseHooks.user.create.before` (`lib/signup-policy.ts`) sehingga berlaku untuk semua jalur pembuatan user. Tanpa `OWNER_EMAIL` tidak ada yang bisa mendaftar (gagal tertutup). UI login tidak lagi punya mode daftar. Akun pemilik dibuat dengan `OWNER_EMAIL=... OWNER_PASSWORD=... bun run --cwd apps/web create-owner`, dijalankan sendiri oleh pemilik; agent tidak menjalankannya dan tidak membaca nilainya. Jangan menambah social login atau plugin yang membuat user tanpa melewati hook ini.
* **Selesai: kontrol mati dihapus.** Tombol notifikasi dan menu pengguna di Topbar (avatar kini gambar ber-nama, bukan tombol), grup "Quick Actions" di command palette (hanya `console.log`), pintasan "⌘B / G lalu D / G lalu W" di Settings (tidak ada implementasinya), dan tombol "Edit Profile". Profil di Settings memakai data sesi (sebelumnya "Rizqy" dan "dev@rizqy.me" ditulis keras).
* **Belum, sengaja:** reset password tetap hanya `console.log` tautan di server (tidak ada pengiriman email); pesannya sudah jujur ("Check the server console"). Jangan menyebut fitur ini berfungsi di produksi sebelum ada penyedia email. Teks login disederhanakan, tetapi gaya visual login (gradient, blur, animasi tak terbatas, ikon dekoratif) belum disentuh: itu Fase 4 dan 5.

## 7. Aksesibilitas (WCAG 2.2 AA) dan Core Web Vitals

### 7.1 Aksesibilitas

Target: WCAG 2.2 level AA di semua halaman `(app)` dan `login`. Aturan untuk kode baru dan kode yang disentuh:

* Setiap input punya `<label htmlFor>` yang terhubung (placeholder bukan label). Galat form: `aria-invalid`, `aria-describedby` ke pesan, fokus dipindah ke field bermasalah. Hasil async diumumkan lewat `role="status"` atau `aria-live="polite"`.
* Setiap kontrol ikon-saja punya nama aksesibel (`aria-label`). Toggle punya `aria-pressed`/`aria-expanded`.
* Fokus selalu terlihat. Elemen yang disembunyikan dengan `opacity-0 group-hover:` juga harus muncul pada `group-focus-within:`/`focus-visible:`.
* Overlay (command palette, modal) memakai primitif dialog (Radix Dialog sudah terpasang, `cmdk` punya `Command.Dialog`): `role="dialog"`, `aria-modal`, jebakan fokus, Escape menutup, fokus kembali ke pemicu.
* Landmark: `<nav aria-label>` untuk sidebar, `<main id="main">`, tautan "Lewati ke konten" sebagai elemen fokus pertama, `aria-current="page"` pada tautan aktif.
* Target sentuh minimal 24x24 px (WCAG 2.5.8), usahakan 32+ px.
* Kontras: teks 4.5:1, teks besar dan komponen UI 3:1. Jangan memakai `--color-text-muted` untuk teks informatif sebelum diperbaiki.
* Teks tidak boleh kurang dari 12px dan jangan memakai `px` untuk teks baru bila bisa `rem`; tata letak harus tetap utuh pada zoom 200% dan lebar 320 px (reflow, 1.4.10).
* Animasi: hormati `prefers-reduced-motion`. Aturan CSS di `globals.css` tidak memengaruhi animasi `motion` (JS); bungkus dengan `<MotionConfig reducedMotion="user">`.
* Jangan andalkan warna sendirian; status selalu disertai teks atau ikon bernama.

Status Fase 4 (2026-10-14). Pemeriksaan otomatis: `src/a11y.test.tsx` (axe di jsdom: login, reset sandi, sidebar, drawer, topbar, palet, Settings, widget, Sheet), `src/app/globals.contrast.test.ts` (kontras dihitung dari `globals.css`, 2 tema x 5 aksen), dan `e2e/public-pages.spec.ts` (axe penuh di Chrome untuk /login dan /reset-password, 2 tema x 5 aksen, reflow 320 px, urutan Tab).

| Area | Status | Catatan |
|---|---|---|
| Kontras token | Selesai, ada test | `--color-text-muted` 62% (gelap) dan 42% (terang); aksen gelap 72%; semantik per tema; `--color-on-solid` untuk teks di atas isian solid; `--color-input-border` 3:1; cincin fokus buram |
| Pemilih aksen | Diperbaiki | `data-accent` ditulis tetapi tidak ada CSS-nya, jadi pilihan aksen tidak berfungsi. Kini ada 5 aksen x 2 tema |
| Ukuran teks | Selesai | semua `text-[9..11px]` menjadi 12px. Basis `html` masih 13px |
| Label form | Selesai di login, reset sandi, Settings, panel Projects/Knowledge | komponen `TextField`/`PasswordField`; input placeholder-saja di halaman lain diberi `aria-label` |
| Nama kontrol | Selesai | tombol ikon berlabel; tombol mati dihapus (grip seret, "Expand", "+" di Tasks) |
| Fokus | Selesai | kontrol hover-only juga tampil saat fokus; fokus kembali ke pembuka dialog (`lib/use-return-focus.ts`: Radix hanya melakukannya untuk `Dialog.Trigger`) |
| Dialog | Selesai | palet perintah, drawer mobile, `Sheet` memakai Radix Dialog |
| Landmark | Selesai | `<nav>`, skip link, `<main id>`, `aria-current` |
| Status loading | Selesai | skeleton atau teks `role="status"`; tanpa spinner |
| Keyboard | Diperbaiki | tugas di widget Tasks tidak bisa di-toggle dengan keyboard (klik ada di `div`); kini satu tombol |
| Reflow | Selesai untuk login dan reset sandi (teruji 320 px); layout aplikasi memakai drawer di bawah `md` dan `h-dvh` | **belum diuji di browser**: halaman `(app)` butuh sesi |
| Gerak | Selesai | `MotionConfig reducedMotion="user"`; latar login animatif dihapus; lebar sidebar memakai transisi CSS yang mati saat reduced motion |
| Masih terbuka | | basis `html` 13px (belum mengikuti pengaturan ukuran font browser); halaman `(app)` belum diaudit axe di browser; tabel dan daftar panjang di Monitoring/Security/Workspace belum ditinjau; `confirm()` bawaan browser untuk hapus; label ikon di grafik/ikon status hanya diperiksa lewat pola kode |

Verifikasi aksesibilitas: jalankan `bun run --cwd apps/web test` dan `test:e2e`. Otomatis tidak cukup: tetap uji manual navigasi keyboard penuh (Tab, Shift+Tab, Enter, Space, Escape), pembaca layar bila menyentuh dialog atau form, dan zoom 200%. Sebut apa yang diuji manual dan apa yang tidak.

### 7.2 Performa dan Core Web Vitals

Target (persentil 75, data lapangan): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. `@vercel/speed-insights` sudah dipasang di `app/layout.tsx`; pastikan ingest aktif di lingkungan deploy sebelum mengandalkannya **[verifikasi]**.

Aturan:

* Ukur sebelum mengubah. Lighthouse pada build produksi, throttling CPU 4x dan jaringan 4G lambat, minimal 3 kali per kondisi, simpan angka sebelum dan sesudah. Gunakan Performance panel untuk INP. Jangan klaim perbaikan tanpa angka.
* Gambar: `next/image` dengan `width`/`height` (atau `fill` + wadah berukuran). Avatar eksternal butuh `images.remotePatterns` di `next.config.ts`.
* Tidak ada pergeseran tata letak: sediakan ruang untuk konten async (skeleton dengan tinggi sama), hindari konten yang jumlahnya berubah setelah mount.
* Tema ditentukan **sebelum paint** (skrip inline kecil atau `next-themes`, yang sudah terpasang tetapi tidak dipakai), bukan di `useEffect`.
* Animasikan `transform`/`opacity` saja. Jangan animasikan `width`, `height`, `top`, `left`. Hindari `blur` besar, `mix-blend-mode`, dan animasi tak terbatas di jalur kritis.
* Pecah kode untuk widget dan halaman berat (`dynamic()` sudah dipakai di `widget-grid.tsx`); jangan impor pustaka besar di layout.
* Handler interaksi ringan; tunda kerja berat dengan `startTransition`/`useDeferredValue`.

Temuan:

| Area | Temuan | Status |
|---|---|---|
| Font | `next/font/google` dengan `preload: false` pada Geist dan Geist Mono dapat menunda render teks | **[verifikasi]** ukur LCP dan CLS dengan preload nyala |
| Tema | `<html data-theme="dark">` ditulis keras, tema sebenarnya diterapkan di `useEffect` (`providers.tsx`) sesudah hidrasi. Pengguna tema terang melihat kilat gelap | Terkonfirmasi dari kode |
| Tata letak | `WidgetGrid` merender 6 skeleton, lalu jumlah widget aktif setelah mount dari store persist; jumlah bisa berbeda, berisiko CLS | Terkonfirmasi dari kode; ukur CLS |
| Latensi sesi | `proxy.ts` melakukan fetch ke `/api/auth/get-session` pada setiap navigasi halaman terproteksi; `AuthGuard` API melakukan HTTP ke Next pada setiap request API tanpa cache. better-auth `session.cookieCache` tidak dikonfigurasi | Terkonfirmasi dari kode; besar dampak **[verifikasi]** |
| Air terjun data | Semua halaman `(app)` kecuali dashboard/analytics/automation adalah Client Component yang memuat data setelah JS dan hidrasi | Terkonfirmasi dari kode |
| Animasi | Lebar sidebar dianimasikan via `motion` (memicu layout tiap frame). Latar login: dua blob `blur-[140px]` + `mix-blend-screen` beranimasi tak terbatas + overlay `noise.svg` | Terkonfirmasi dari kode; dampak **[verifikasi]** |
| Gambar | `<img>` mentah tanpa dimensi di Topbar dan Developer | Terkonfirmasi dari kode |
| Viewport | `h-screen` (100vh) pada layout aplikasi; gunakan `h-dvh` | Terkonfirmasi dari kode |
| Build | `next build --webpack` dipaksa, alasan tidak terdokumentasi | **[verifikasi]** apakah masih perlu |
| Dashboard | Grafik "kontribusi" di widget GitHub memakai `Math.random()` setiap render | Terkonfirmasi dari kode |

Urutan kerja yang disarankan untuk sesi performa: ukur baseline → tema sebelum paint → font preload → cache sesi → gambar → animasi sidebar/login → ukur ulang.

## 8. Backend

* Pola: Controller hanya routing; logika di Service; semua input lewat DTO class-validator; respons dipetakan, jangan kembalikan model Prisma mentah.
* Respons sukses dibungkus `ResponseTransformInterceptor` (`{ success, data }`), galat lewat `GlobalExceptionFilter`. `fetchApi` membuka bungkus itu; jaga kontraknya tetap sinkron.
* `ValidationPipe` global memakai `whitelist` dan `forbidNonWhitelisted`; DTO baru harus menandai setiap properti dengan decorator, kalau tidak request ditolak.
* `enableImplicitConversion` aktif: string `"false"` pada properti boolean diubah menjadi `true` sebelum validasi. Untuk DTO boolean pakai `@Transform(({ obj }) => obj.field)` agar nilai mentah yang divalidasi (contoh: `UpdateIntegrationDto`). Permintaan "nonaktifkan" bisa berakhir "aktifkan" bila ini terlewat.
* `ThrottlerGuard` global aktif (`app.module.ts`, dipasang sebelum `AuthGuard` agar banjir request tak terautentikasi ditolak sebelum panggilan HTTP ke Next): 100 request/menit per IP, `POST /integrations/:provider` 10/menit, `/health` dikecualikan (`@SkipThrottle`). Galat 429 berkode `RATE_LIMITED` dengan header `Retry-After`. IP klien bergantung pada `TRUST_PROXY_HOPS` (0 bila API terbuka langsung seperti docker-compose; 1 di `render.yaml` **[verifikasi jumlah hop di Render]**). Nilai terlalu kecil di belakang proxy membuat semua pengguna berbagi satu jatah; nilai terlalu besar membuat header `X-Forwarded-For` palsu bisa menghindari batas. Penyimpanan counter di memori proses: tidak dibagi antar instance. Teruji di `shared/throttling.http.spec.ts`.
* Operasi multi-langkah memakai transaksi. Endpoint daftar memakai `PaginationQueryDto`.
* Permintaan keluar ke URL buatan pengguna (monitoring) harus melewati validasi host. Filter saat ini berbasis regex nama host dan tidak menangani resolusi DNS ke IP privat atau pengalihan; anggap itu celah SSRF yang belum tertutup **[verifikasi]** sebelum memperluas.
* Perubahan skema: ubah `prisma/schema.prisma`, buat migrasi, jangan edit migrasi yang sudah ada. Persetujuan pengguna wajib sebelum menjalankan migrasi.
* Env baru: tambahkan ke `env.validation.ts` (Zod), `.env.example` (placeholder), `render.yaml`/`docker-compose.yml` bila relevan, dan `turbo.json` `globalEnv` bila memengaruhi build.

## 9. Hutang teknis yang diketahui

Jangan memperluas; bereskan hanya bila diminta atau saat menyentuh file itu.

* **Dependensi tidak diimpor sama sekali di `src`** (hasil grep per 2026-10-14; konfirmasi dengan `depcheck` sebelum menghapus, penghapusan butuh persetujuan):
  * web: `next-themes`, `xterm`, `@xterm/addon-fit`, `socket.io-client`, `recharts`, `react-hook-form`, `@hookform/resolvers`, `zod`, `date-fns`, `@radix-ui/react-{dialog,select,popover,tooltip,switch,scroll-area,avatar,separator}`.
  * api: `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `@nestjs/bullmq`, `bullmq`, `@nestjs/jwt`, `@nestjs/schedule`, `better-auth`.
  * Dependensi tak terpakai tidak membesarkan bundle, tetapi menambah waktu install dan permukaan serangan rantai pasok. `better-auth`, `@prisma/client`, `pg`, `@vercel/speed-insights`, `lucide-react` juga diduplikasi di `package.json` root dan workspace.
* Pelanggaran gaya di kode lama: 12 pemakaian `any` eksplisit tersisa di web (lint); gaya login dan spinner sudah dibersihkan di Fase 4.
* `docs/engineering/standards.md` dan `docs/architecture/*` perlu disinkronkan dengan kenyataan (lihat bagian 1).
* Perilaku `GITHUB_CLIENT_*` / `GOOGLE_CLIENT_*` di env tanpa implementasi: hapus dari konfigurasi atau implementasikan OAuth, putuskan bersama pengguna.

## 10. Pesan commit dan PR

Conventional Commits: `type(scope): deskripsi huruf kecil tanpa titik`, baris pertama maksimal 72 karakter, badan menjelaskan **mengapa**. Scope = nama modul (`integrations`, `dashboard`, `auth`). Jangan commit atau push kecuali diminta.
