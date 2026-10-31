# Baseline Fase 0

Tanggal: 2026-10-14. Status: referensi pembanding untuk Fase 4, 5, dan 7. Jangan diubah setelah fase perbaikan dimulai; tambahkan berkas baru untuk pengukuran berikutnya.

## 1. Kesehatan build

| Perintah | Hasil | Catatan |
|---|---|---|
| `type-check` web | Lulus | |
| `type-check` api | Lulus | |
| `test` web | Lulus, 2 file, 2 test | |
| `test` api (awal) | Gagal, 5 dari 10 file | Vitest ikut menjalankan `dist/**/*.spec.js` hasil kompilasi (CommonJS, tidak bisa dimuat). Bukan kegagalan test sebenarnya |
| `test` api (setelah perbaikan) | Lulus, 5 file, 14 test | Perbaikan: `include: ['src/**/*.spec.ts']` di `apps/api/vitest.config.ts` |
| `lint` web (awal) | Gagal total (crash ESLint) | ESLint 10.9.0 tidak kompatibel dengan `eslint-plugin-react` 7.37.5, yang secara resmi hanya mendukung `eslint ^9.7` (`context.getFilename is not a function`) |
| `lint` web (setelah `eslint` diturunkan ke `^9.39.5`) | Berjalan: **62 masalah, 37 error, 25 peringatan** | Rincian di bagian 1a. `bun audit` sebelum dan sesudah identik (50 temuan, 0 advisory baru) |
| `lint` api | **Tidak bisa dijalankan** | Tidak ada konfigurasi ESLint di `apps/api` (skrip `lint` juga memakai `--fix`, yang mengubah file) |
| `build` api | Lulus | |
| `build` web (`next build --webpack`) | Lulus, 51 detik kompilasi, 16 halaman | `nest build` menyertakan file `.spec.ts` ke `dist` |

Bun terpasang 1.3.13, sedangkan `packageManager` menyebut `bun@1.4.0`.

### 1a. Baseline lint web (jumlah per aturan)

| Jumlah | Tingkat | Aturan | Catatan |
|---|---|---|---|
| 28 | error | `@typescript-eslint/no-explicit-any` | Hutang `any` yang tercatat di AGENTS.md bagian 9 |
| 22 | peringatan | `@typescript-eslint/no-unused-vars` | |
| 5 | error | `react-hooks/set-state-in-effect` | Pola `useEffect(() => setMounted(true))` (sidebar, widget grid, dll.); terkait tema dan CLS di Fase 5 |
| 2 | peringatan | `@next/next/no-img-element` | Topbar dan Developer; Fase 5 |
| 2 | error | `@typescript-eslint/no-empty-object-type` | `input.tsx`, `textarea.tsx` |
| 1 | error | `react/no-unescaped-entities` | |
| 1 | error | `react-hooks/purity` | `Math.random()` di render widget GitHub; Fase 2 |
| 1 | peringatan | `react-hooks/exhaustive-deps` | |

### 1b. Audit dependensi (`bun audit`, 2026-10-14)

50 temuan: 4 kritis, 31 tinggi, 13 sedang, 2 rendah, sudah ada sebelum perubahan apa pun di sesi ini. Empat kritis: `proxy-addr` (IP spoofing lewat IPv4-mapped IPv6, via `@nestjs/platform-express`), dan tiga advisory Next.js (RCE pada server Windows, RCE di Image Optimization API dengan file AVIF, RCE di `next/og` ImageResponse). Belum dianalisis apakah jalur yang rentan benar-benar dipakai aplikasi ini.

## 2. Pengukuran lab (build produksi, Chrome 155 headless)

Kondisi: CPU 4x lebih lambat, jaringan 1.6 Mbps dan RTT 150 ms (setara Slow 4G), cache nonaktif, viewport 1350x940, 3 kali per halaman, nilai tengah. Bukan Lighthouse (belum terpasang); angka ini aproksimasi dan hanya boleh dibandingkan dengan pengukuran yang memakai skrip dan kondisi sama.

Hanya halaman publik yang terukur. Halaman di balik login (dashboard, settings, developer, infrastructure) belum terukur karena butuh sesi; ini harus dilengkapi sebelum Fase 5 bila ingin klaim untuk halaman tersebut.

| Halaman | FCP | LCP | CLS | TBT | Long task | JS ditransfer | Total ditransfer |
|---|---|---|---|---|---|---|---|
| `/login` | 1476 ms | 2472 ms | 0 | 2291 ms | 17 | 222 KB | 262 KB |
| `/reset-password` | 632 ms | 2400 ms | 0.00003 | 436 ms | 2 | 179 KB | 219 KB |

Keterbatasan:

* LCP `/login` pada satu dari tiga run tidak terekam (nilai 0), jadi nilai tengah rapuh. Run lain 2652 dan 2472 ms. Kemungkinan penyebab: elemen tertunda oleh animasi opacity awal; belum diselidiki.
* INP tidak terukur karena butuh interaksi pengguna.
* TBT `/login` sangat tinggi dibanding `/reset-password` (2291 ms vs 436 ms). Konsisten dengan dugaan bahwa animasi dan latar login mahal, tetapi penyebab pastinya belum dibuktikan.

## 3. Aksesibilitas (axe-core 4.12.1, tag WCAG 2.0 A/AA, 2.1 A/AA, 2.2 AA, best-practice)

`/login` (keadaan awal, mode masuk):

| Aturan | Dampak | Node |
|---|---|---|
| `color-contrast` | serius | 1 |
| `target-size` | serius | 1 (tombol tampilkan kata sandi, `.right-3`) |
| `landmark-one-main` | sedang | 1 |
| `region` | sedang | 4 |

Masih "incomplete" (tidak bisa ditentukan axe): `color-contrast` di `/login` (latar tembus pandang dan blur).

`/reset-password`:

| Aturan | Dampak | Node |
|---|---|---|
| `color-contrast` | serius | 2 |
| `target-size` | serius | 1 |

Catatan: axe tidak menandai input login yang hanya bersandar pada placeholder, karena placeholder diterima sebagai nama aksesibel. Itu tetap bukan label yang baik (hilang saat mengetik, bagian 7.1 AGENTS.md), jadi lolosnya axe bukan bukti bahwa form sudah benar. Mode daftar, lupa kata sandi, dan semua halaman `(app)` belum diperiksa.

## 4. Cara mengulang

1. `bun run build` di `apps/web`, lalu `bun run start -- -p 3100`.
2. Jalankan skrip pengukuran (CDP, tanpa dependensi proyek) dengan kondisi di bagian 2. Skrip disimpan di scratchpad sesi dan belum masuk repo; bila ingin diulang rutin, pindahkan ke `scripts/` (butuh persetujuan).
3. axe diambil dari `node_modules/.bun/axe-core@4.12.1`.

## 5. Sesudah Fase 4 (2026-10-14)

Skrip, kondisi, dan build produksi sama seperti bagian 2. Hanya halaman publik; halaman di balik login tetap belum terukur.

| Halaman | Metrik | Baseline | Sesudah |
|---|---|---|---|
| `/login` | FCP | 1476 ms | 888 ms |
| `/login` | LCP | 2472 ms (satu run tidak terekam) | 888 ms (792, 888, 924) |
| `/login` | TBT | 2291 ms | 302 ms |
| `/login` | Long task | 17 | 1 |
| `/login` | JS ditransfer | 222 KB | 183 KB |
| `/reset-password` | LCP | 2400 ms | 2080 ms (2048, 2080, 2188) |
| `/reset-password` | TBT | 436 ms | 280 ms |
| keduanya | CLS | 0 | 0 |
| keduanya | Pelanggaran axe | `/login` 4, `/reset-password` 2 | 0 dan 0 |

Penyebab perbaikan `/login` belum dipisahkan satu per satu: perubahan Fase 4 menghapus latar beranimasi (blur + mix-blend + animasi tak terbatas), `motion` dari halaman, dan spinner sekaligus. `/reset-password` masih dekat batas LCP 2.5 s di kondisi throttle ini; penyebabnya (font, hidrasi di balik `Suspense`) belum diselidiki, itu bahan Fase 5.

Kesehatan build: web 307 test lulus (+26 test browser Playwright), API 105 test lulus, `bun audit` 50 → 38 temuan (kritis 4 → 0), lint web 62 → 33.
