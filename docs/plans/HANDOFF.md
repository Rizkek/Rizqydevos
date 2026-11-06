# Serah-terima (per 2026-10-30)

Dokumen ini ditulis agar pekerjaan bisa dilanjutkan setelah percakapan di-compact atau di-reset. Baca urutannya: AGENTS.md (aturan kerja), dokumen ini (keadaan), [ROADMAP.md](./ROADMAP.md) (rencana), [baseline.md](./baseline.md) (angka pengukuran).

## 1. Proyek ini untuk apa

Ruang pribadi seorang developer (Rizky) untuk menyimpan link, pengetahuan, prompt, dan password yang takut hilang, plus daftar proyek, status GitHub dan Vercel, dan daftar periksa keamanan. Satu pengguna, biaya nol, tanpa pendaftaran publik, tanpa Docker, tanpa AI berbayar. Detail dan struktur modul tujuan ada di ROADMAP.md.

Stack: monorepo Bun + Turborepo. Web: Next.js 16.3.8, React 19, Tailwind 4, TanStack Query, Zustand, better-auth. API: NestJS 11. Data: Postgres di **Supabase** (Prisma 7) dan **Redis**, keduanya sudah dimiliki pemilik dan gratis. Deploy: README menyebut Coolify, repo punya `render.yaml`; target sebenarnya belum dipastikan.

## 2. Cara kerja yang sudah disepakati

- Bahasa percakapan Indonesia; kode, identifier, dan pesan commit Inggris.
- **Jangan membaca atau mencetak `.env`**, token, atau kunci. Lihat `.env.example` dan `apps/api/src/config/env.validation.ts` untuk nama variabel.
- Agen boleh menjalankan type-check, test, lint, dan build. **Wajib persetujuan** untuk: menambah atau menghapus dependensi, operasi Git yang menulis, migrasi database, deploy, apa pun yang mengirim data keluar.
- **Pemilik membuat commit dan push sendiri.** Agen hanya memberikan perintah commit di chat.
- Jangan klaim "lebih cepat" atau "sudah diperbaiki" tanpa pengukuran atau test. Pisahkan bukti dari dugaan; tandai yang belum diverifikasi dengan **[verifikasi]**.

## 3. Lingkungan

- Windows 10, Git Bash dan PowerShell. Bun 1.3.13 (repo menyebut 1.4.0), Node 24. Python tidak terpasang.
- **Tidak ada Postgres, Redis, atau Docker lokal.** Halaman di balik login belum pernah dibuka di browser oleh agen. Fixture Playwright untuk itu dijadwalkan di Fase E (butuh `E2E_EMAIL` dan `E2E_PASSWORD` dari lingkungan pemilik).
- Chrome sistem dipakai Playwright (`channel: 'chrome'`), tanpa unduhan browser.
- Banyak file memakai akhir baris CRLF. Penggantian teks otomatis yang mencocokkan `\n` gagal diam-diam pada file seperti itu; periksa hasilnya (satu kasus `vite.config.ts` hampir lolos).
- `docs/` ada di `.gitignore`, tetapi sebagian filenya sudah terlacak. File baru di `docs/plans/` tidak akan ter-commit kecuali memakai `git add -f` atau `.gitignore` diubah. Putuskan apakah docs memang sengaja disembunyikan.

## 4. Yang sudah dikerjakan (Fase 0 sampai 4 lama, plus tambahan)

Angka per 2026-11-01, setelah Fase P, B, D, F, E dan sebagian C: web **461 test** (33 file) lulus; API **266 test** (21 file) lulus; `bun run type-check`, `lint`, `test`, dan `build` dari root semua hijau. Test browser: 28 lulus (halaman publik dan tema sebelum paint) pada build terbaru; 31 test halaman di balik login dilewati karena belum ada akun uji. Lint: 0 error; API 17 peringatan (`any` lama), web 6 peringatan. Rincian pekerjaan 2026-10-30 ada di ROADMAP (status Fase S dan A).

Angka akhir Fase 0-4 (2026-10-14): web **313 test** (12 file) lulus; API **105 test** (11 file) lulus; **26 test browser** lulus; type-check dan build web dan API lulus; lint web 62 → 33 masalah; `bun audit` 50 → 38 temuan, kritis 4 → 0.

**Fase 0, baseline.** Lint web diperbaiki (`next lint` dihapus di Next 16; `eslint` diturunkan ke `^9.39.5` karena ESLint 10 membuat `eslint-plugin-react` crash). Vitest API hanya menjalankan `src/**/*.spec.ts` (sebelumnya ikut menjalankan `dist/`). Angka awal di `baseline.md`.

**Fase 1, backend integrasi GitHub dan Vercel.** Kode galat bertipe (tidak ada lagi 401 untuk kegagalan hulu), token diverifikasi sebelum disimpan, whitelist provider, disconnect idempoten, enable/disable, dukungan team Vercel, audit log, timeout GitHub yang benar-benar bekerja (Octokit 22 mengabaikan `request.timeout`, hanya `AbortSignal` yang berlaku; terbukti dengan server yang tidak menjawab). Lokasi: `apps/api/src/modules/integrations/`.

**Fase 2, frontend integrasi.** `lib/integrations.ts` memetakan kode galat ke pesan dan tindakan; `IntegrationCard` di Settings; widget dan halaman memakai `IntegrationNotice` dan `ListSkeleton`.

**Fase 3, auth dan kontrol mati.** `redirectTo` aman (`safeRedirectPath`, tanpa open redirect), proxy tidak lagi menggandakan query string, kontrol yang tidak melakukan apa pun dihapus (notifikasi, menu pengguna, Quick Actions, pintasan palsu, grafik kontribusi palsu `Math.random()`).

**Throttler.** `ThrottlerGuard` ternyata tidak pernah terpasang. Kini global (sebelum `AuthGuard`), 10/menit untuk connect integrasi, `/health` dikecualikan, 429 berkode `RATE_LIMITED`. IP klien bergantung `TRUST_PROXY_HOPS` (0 lokal, 1 di `render.yaml` **[verifikasi jumlah hop di platform deploy]**).

**Keamanan dependensi.** Next 16.3.2 → 16.3.8 (3 advisory RCE kritis), `overrides.proxy-addr ^2.0.8`.

**Fase 4, aksesibilitas.** Token kontras dihitung ulang dan dijaga `globals.contrast.test.ts` (2 tema × 5 aksen); pemilih aksen yang sebelumnya tidak berfungsi kini bekerja; navigasi dengan `<nav>`, skip link, drawer mobile; palet perintah, drawer, dan `Sheet` memakai Radix Dialog dengan fokus kembali ke pembuka (`lib/use-return-focus.ts`); `TextField`/`PasswordField`; tombol ikon berlabel; spinner diganti skeleton atau teks; teks minimal 12px; warna palet tetap diganti token; tugas di widget Tasks kini bisa dioperasikan keyboard. Pemeriksaan: `src/a11y.test.tsx` (axe di jsdom), `e2e/public-pages.spec.ts` (axe penuh di Chrome untuk `/login` dan `/reset-password`).

**Pendaftaran publik ditutup.** Hanya `OWNER_EMAIL` yang bisa membuat akun (`lib/signup-policy.ts`, hook database better-auth, teruji dengan better-auth sungguhan). Akun pemilik dibuat dengan `OWNER_EMAIL=... OWNER_PASSWORD=... bun run --cwd apps/web create-owner`, dijalankan sendiri oleh pemilik.

**Docs diperbarui (2026-10-14):** `AGENTS.md` (aturan dan status), `docs/engineering/standards.md`, `docs/design/color.md`, status di dua `*-audit/*-remediation-plan.md`, `baseline.md`. Pada 2026-11-01 seluruh `docs/` ditulis ulang dari kode dan dokumen 2026-07 dihapus; daftar lengkapnya di ROADMAP Fase A butir 6.

## 5. Hasil pengukuran terpenting

Halaman publik, build produksi, CPU 4x, Slow 4G, 3 run (skrip di `baseline.md` bagian 4):

| Halaman | LCP | TBT | Axe |
|---|---|---|---|
| `/login` | 2472 → 888 ms | 2291 → 302 ms | 4 → 0 |
| `/reset-password` | 2400 → 2080 ms | 436 → 280 ms | 2 → 0 |

Sesudah Fase E (2026-11-01, kondisi uji sama dengan skrip yang sama, dijalankan ulang untuk kondisi sebelum dan sesudah): `/login` LCP 820 → 696 ms, `/reset-password` LCP 2180 → 692 ms, CLS 0 di keduanya. Angka "sebelum" diukur ulang pada sesi itu dan berbeda dari tabel di atas (mis. `/reset-password` 2080 vs 2180 ms); selisihnya tidak diselidiki, jadi bandingkan hanya pasangan sebelum dan sesudah dari bagian 6 `baseline.md`.

Halaman di balik login belum terukur sama sekali.

## 6. Cara memverifikasi

```
bun run --cwd apps/web type-check
bun run --cwd apps/web test              # 365 test
bun run --cwd apps/web build
bun run --cwd apps/web test:e2e          # butuh build; memakai Chrome sistem
bun run --cwd apps/api type-check
bun run --cwd apps/api test              # 134 test
bun run lint                             # 0 error di api dan web
bun audit
```

## 7. Jebakan yang sudah ditemui (jangan terulang)

- Octokit: hanya `request.signal: AbortSignal.timeout()`; opsi `timeout` diabaikan. Pembatalan muncul sebagai `HttpError` status 500, jadi timeout GitHub terlihat 502.
- `enableImplicitConversion` mengubah string `"false"` jadi `true` pada DTO boolean; pakai `@Transform(({ obj }) => obj.field)`.
- Radix Dialog hanya mengembalikan fokus ke `Dialog.Trigger`; dialog yang dibuka lewat state butuh `useReturnFocus`.
- React 19 lint menolak membaca `ref.current` saat render (pola `bindRef`); pakai satu `useRef` per elemen.
- Vitest harus mengecualikan `e2e/**` (`vite.config.ts`).
- Menyisipkan blok `if` di tengah rantai `if / else if` mengubah logika diam-diam (terjadi sekali di `global-exception.filter.ts`, tertangkap saat ditinjau).
- Hook `PostToolUse` di IDE menampilkan peringatan `suggestCanonicalClasses` (sintaks Tailwind `text-(--x)`); itu kosmetik dan bukan galat.
- (2026-10-30) Kode enkripsi lama (`86c0cd4`) memotong `ENCRYPTION_KEY` ke 32 karakter pertama; kode sekarang menolak kunci yang bukan tepat 32 byte. Kunci lokal 33 karakter membuat API gagal start. Jangan membuat kunci baru; pangkas ke 32 karakter pertama agar data lama tetap terbaca.
- (2026-10-30) Halaman statis yang membaca query string lewat `nuqs`/`useSearchParams` harus dibungkus `<Suspense>` (contoh: `knowledge/page.tsx`), atau build gagal.
- (2026-10-30) Setelah menghapus route, `.next/types` hasil build lama membuat `tsc` web gagal sampai `bun run build` dijalankan ulang. Itu bukan galat source.
- (2026-10-30) Menjalankan dua perintah `cd ... && ...` paralel di tool Bash bisa berakhir di folder yang salah (hasil web ternyata dari api). Jalankan web dan api secara berurutan, dengan path absolut.
- (2026-10-30) Panel "Service Health" lama di Infrastructure membaca `status`, `statusText`, dan `responseTime`, padahal API mengembalikan `online`, `statusCode`, dan `latencyMs`. Cocokkan field UI dengan respons API dan beri test.
- (2026-11-01) Timer yang dibuat saat fake timers belum aktif tidak terjangkau `vi.advanceTimersByTime`; aktifkan `vi.useFakeTimers({ shouldAdvanceTime: true })` dan `userEvent.setup({ advanceTimers })` sebelum tindakan yang membuat timer.
- (2026-11-01) Bentuk kunci `retry` di `createQueryOptions` harus lambda `(count, error) => ...`; menyerahkan fungsi ber-parameter `unknown` langsung melebarkan tipe error TanStack dan merusak `useQuery<T>(...)` di banyak halaman.
- (2026-11-01) Migrasi `20261101000000_add_checklist` ditulis dengan `prisma migrate diff` tanpa menyentuh database dan belum dijalankan. Sebelum dijalankan, `/checklist` dan widget Needs Attention gagal dengan galat database.
- (2026-11-01) `AuthGuard` menyimpan sesi terverifikasi 30 detik (`session-cache.ts`). Sesi yang dicabut lewat sign-out masih berlaku di API sampai 30 detik. Test yang menyalakan guard dengan cookie yang sama harus memakai instance cache baru.
- (2026-11-01) Penjaga SSRF memeriksa alamat di fungsi `lookup` saat koneksi dibuka dan redirect diikuti manual. Test infrastruktur menyuntikkan `HOST_LOOKUP`; jangan mengandalkan DNS sungguhan di test.
- (2026-11-01) `/reset-password` kini Server Component (membaca `searchParams`); formnya ada di `reset-password-form.tsx`. Test aksesibilitas merender form itu langsung dengan prop `token`.
- (2026-11-01) Skrip tema memakai kunci `devos-ui`; mengganti nama kunci store UI tanpa mengubah `THEME_STORAGE_KEY` mengembalikan kilat gelap (ada test yang membaca localStorage).
- (2026-11-01) Store widget memakai `mergeWidgets` saat memuat; menambah `WidgetType` baru cukup menambahnya ke daftar bawaan, tanpa migrasi data browser.
- (2026-11-01) Tiga migrasi menunggu: `add_checklist`, `add_two_factor`, `secret_v2`. Tanpa `add_two_factor`, plugin `twoFactor` gagal membaca tabelnya dan login bisa gagal; jalankan `bunx prisma migrate deploy` sebelum menjalankan versi baru web dan API.
- (2026-11-01) `signIn.email` tidak membuat sesi bila 2FA aktif; jawabannya `{ twoFactorRedirect: true }`. Semua kode yang memanggil `signIn.email` harus memeriksa `needsSecondFactor` (halaman login dan dialog sign-in ulang sudah). Mock `@/lib/auth-client` di test harus menyertakan `twoFactor` bila komponen memanggil `verifySecondFactor`.
- (2026-11-01) `export const { signUp }` dari klien auth dihapus: tipe turunannya tidak bisa dinamai setelah plugin `twoFactorClient` dipasang (TS2883), dan pendaftaran ditutup.
- (2026-11-01) Kunci unik brankas kini `[userId, key, username]`; `username` selalu string (kosong bila tidak ada), bukan null, karena Postgres menganggap NULL berbeda dan unik tidak akan mencegah duplikat.
- (2026-11-01) Skrip kerja berisi sintaks heredoc panjang dengan tanda kutip bisa gagal di tool Bash ("unexpected EOF"); tulis berkas dengan Write lalu jalankan.
- (2026-11-01) Verifikasi sign-in ulang mengandalkan `session.createdAt` dari `get-session`; belum dicoba terhadap Better Auth yang berjalan. Bila sesi baru tidak mengubah `createdAt`, dialog kata sandi akan berulang.

## 8. Keputusan dan pertanyaan yang masih terbuka

1. **Brankas password:** server-side dengan 2FA TOTP dan verifikasi ulang sudah dikodekan (Fase C), dipilih agen dan belum ditinjau pemilik; zero-knowledge dinilai ulang setelah brankas dipakai.
2. **Penangkapan otomatis password dari browser:** lihat Fase G. Google tidak menyediakan API publik untuk password setahu agen (hanya ekspor CSV) **[verifikasi]**.
3. **Redis:** dipertahankan karena sudah ada dan gratis (jawaban pemilik: "kalau tidak mengeluarkan uang, pertahankan"). Dipakai untuk cache dan health readiness; dengan satu pengguna manfaatnya kecil. Konfirmasi ulang bila ingin dibuang.
4. **Supabase gratis** bisa dijeda otomatis bila lama tidak aktif **[verifikasi ketentuan terbaru]**.
5. **Basis font** `html { font-size: 13px }` tidak mengikuti pengaturan ukuran font browser; ditunda (mengubah seluruh tampilan).
6. **Bagian publik/portofolio:** diputuskan "seperti sekarang dulu" (tidak ada bagian publik).
7. **OAuth GitHub:** ditunda; token manual dipakai. Untuk satu pengguna, OAuth lebih sebagai cara login ketimbang penyimpan token integrasi.
8. **Deploy:** web di Vercel, API di Render, `/api/v1` lewat rewrite Next (ADR-006, `docs/deployment.md`). Konfigurasi siap, belum di-deploy. `TRUST_PROXY_HOPS=1` di Render **[verifikasi]**.
9. **Reset password:** tanpa email. Di pengembangan tautan dicetak ke log web; di produksi pemilik menjalankan `reset-owner-password` (Fase F selesai).
10. (selesai 2026-10-30) `apps/web/public/noise.svg` dihapus.
11. (2026-10-30) Keputusan dari tabel di ROADMAP: hapus permanen secret (Fase S butir 9), `docs/` dilacak git (butir 10), satukan notes, hapus model `Widget`, buang atau pertahankan widget Pomodoro, `bun remove` dependensi tak terpakai.

## 9. Keadaan Git

Fase 0-4 lama: commit `5295ea4`. Fase S dan A (2026-10-30): `e7d6ad8` config, `2aa4002` api-hygiene, `b07e30a` scope, `2670818` web-quality. Penulisan ulang dokumentasi dan pekerjaan Fase P, B, C (sebagian), D, F, E (2026-11-01) belum di-commit; perintahnya diberikan di chat. `package.json` root dan `bun.lock` berubah di luar pekerjaan agen (`@types/node` naik, paket placeholder `save-dev` bertambah) dan sengaja tidak di-commit.

## 10. Peta file penting

| Topik | Lokasi |
|---|---|
| Kontrak galat integrasi | `apps/api/src/modules/integrations/integration.errors.ts` |
| Rate limiting | `apps/api/src/app.module.ts`, `apps/api/src/shared/throttling.http.spec.ts` |
| Kebijakan pendaftaran | `apps/web/src/lib/signup-policy.ts`, `apps/web/scripts/create-owner.ts` |
| Token warna | `apps/web/src/app/globals.css`, `globals.contrast.test.ts` |
| Pembantu dialog | `apps/web/src/lib/use-return-focus.ts`, `components/ui/sheet.tsx` |
| Form | `apps/web/src/components/ui/text-field.tsx` |
| Test aksesibilitas | `apps/web/src/a11y.test.tsx`, `apps/web/src/test/axe.ts`, `apps/web/e2e/` |
| Brankas | `apps/api/src/modules/secrets/` (service, `backup-crypto.ts`, DTO), `apps/api/src/scripts/rotate-encryption-key.ts`, `apps/web/src/components/security/`, model `Secret` di `prisma/schema.prisma` |
| Links | API `apps/api/src/modules/workspace/bookmarks.*`, `bookmark-url.ts`; web `apps/web/src/components/links/`, `lib/bookmarks.ts`, halaman `app/(app)/links/` |
| Infrastructure (uptime dan SSL dari `Project.deployUrl`) | `apps/api/src/modules/infrastructure/`, `apps/web/src/lib/sites.ts`, `components/infrastructure/` |
| Checklist | API `apps/api/src/modules/checklist/` (+ `checklist-templates.ts`), migrasi `prisma/migrations/20261101000000_add_checklist/`; web `lib/checklist.ts`, `lib/attention.ts`, `components/security/checklist-*.tsx`, `components/dashboard/widgets/attention-widget.tsx` |
| 2FA | `apps/web/src/lib/auth.ts` (plugin), `lib/auth-client.ts`, `lib/two-factor.ts`, `lib/two-factor.flow.test.ts` (better-auth sungguhan), `components/auth/second-factor-field.tsx`, `components/settings/two-factor-card.tsx`, `lib/disable-owner-two-factor.ts` dan `scripts/disable-owner-two-factor.ts`, migrasi `prisma/migrations/20261101010000_add_two_factor/` |
| Impor CSV brankas | `apps/web/src/lib/vault-csv.ts`, `components/security/vault-import.tsx`, API `POST /secrets/import` di `apps/api/src/modules/secrets/` |
| Penjaga SSRF | `apps/api/src/modules/infrastructure/host-guard.ts`, `target-validation.ts`, `ssl.service.ts` |
| Cache sesi, klien Redis | `apps/api/src/shared/guards/session-cache.ts`, `apps/api/src/cache/redis.client.ts` |
| Reset password pemilik | `apps/web/scripts/reset-owner-password.ts`, `lib/reset-owner-password.ts` |
| Tema sebelum paint | `apps/web/src/lib/theme-script.ts`, `app/layout.tsx` |
| CI | `.github/workflows/ci.yml` |
| Test browser halaman login | `apps/web/e2e/app-pages.spec.ts` (butuh `E2E_EMAIL`, `E2E_PASSWORD`) |
| Knowledge (tab Snippets dan Prompts, `?tab=`) | `app/(app)/knowledge/page.tsx`, `components/knowledge/` |
| Developer (Activity, Pull requests, Repositories) | `app/(app)/developer/page.tsx`, `components/developer/github-panel.tsx` |
| Validasi env | `apps/api/src/config/env.validation.ts` (+ `.spec.ts`), `.env.example` (siapa membaca apa; lokal, tidak dilacak git) |
| Dokumentasi (ditulis ulang 2026-11-01) | `docs/README.md` (indeks), `docs/product/overview.md`, `docs/architecture/*.md`, `docs/design/design-system.md`, `docs/engineering/standards.md` |
