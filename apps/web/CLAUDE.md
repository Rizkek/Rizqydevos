Aturan Pengembangan (Claude Code Ruleset)

## 1. Tech Stack & Best Practices

* **Environment:** Proyek ini menggunakan [React / Next.js App Router] dan [Tailwind CSS].
* **Clean Code:** Gunakan prinsip fungsional. Hindari duplikasi logika. Gunakan penamaan variabel yang deskriptif (camelCase) dan komponen (PascalCase).
* **Komentar Minimal:** Hanya tulis komentar untuk menjelaskan *kenapa* suatu logika kompleks (bisnis/algoritma) dibuat, jangan jelaskan *apa* yang dilakukan baris kode tersebut.

## 2. UI & Styling (Anti-AI Slop)

* **Visual Murni:** Dilarang menggunakan emoticon, animasi *loading* (circle/spinner), atau elemen visual klise.
* **Warna & Desain:** Gunakan warna solid dan *flat design* dari palet bawaan Tailwind. Dilarang keras menggunakan *gradients* atau memberikan warna-warni pada teks secara tidak rasional.
* **Teks Bersih:** Dilarang menggunakan format *bullet* hyphen (`-`) yang berlebihan atau teks hiperbolis.

## 3. Kode & Logika (Mentalitas Minimalis)

* **Prioritas Bawaan:** Selalu periksa utilitas bawaan bahasa/framework sebelum menulis fungsi baru.
* **Satu Baris Lebih Baik:** Tulis kode sesederhana mungkin. Dilarang *over-engineering*.

## 4. Efisiensi Output (No Yapping & Hemat Token)

* **Langsung ke Inti:** Dilarang memberikan kalimat pengantar (misal: "Tentu, berikut kodenya") atau penutup (misal: "Semoga membantu"). Langsung berikan blok kode atau jawaban.
* **Eksekusi Manual:** Dilarang menjalankan perintah instalasi paket (*npm/yarn*) atau operasi Git secara otomatis. Berikan saja *snippet* perintah CLI-nya dengan 1 kalimat deskripsi.
* **Stop pada Error:** Jika perbaikan kode menyebabkan *error* beruntun, berhentilah mencoba. Jelaskan akar masalahnya dalam 1-2 kalimat dan tunggu instruksi saya.
