# 📊 SIaP PAK — Sistem Informasi Penyusunan Penetapan Angka Kredit

**SIaP PAK** adalah aplikasi portal kepegawaian berbasis web yang dikembangkan untuk **Badan Pusat Statistik (BPS) Kabupaten Garut**. Aplikasi ini dirancang untuk memudahkan Pejabat Fungsional dalam memantau histori capaian Angka Kredit serta menyimulasikan proyeksi kenaikan **Pangkat (Golongan)** dan **Jenjang Jabatan Fungsional** secara akurat berdasarkan siklus penilaian kinerja triwulanan ASN terbaru (PermenPANRB No. 1 Tahun 2023 & PerBKN No. 3 Tahun 2023).

🌐 **Live Demo / Akses Aplikasi:**  
👉 **[https://siap-pak.vercel.app](https://siap-pak.vercel.app)**  
🔒 **Portal Rekapitulasi Admin:**  
👉 **[https://siap-pak.vercel.app/admin](https://siap-pak.vercel.app/admin)**

---

## ✨ Fitur Utama

### 👤 1. Portal Pegawai (`/`)
* **Autentikasi Mandiri & Privasi Terjaga**: Pegawai dapat mengecek data masing-masing menggunakan kombinasi **Nomor Induk Pegawai (NIP)** dan **Tanggal Lahir**. Sesi disimpan secara lokal (`sessionStorage`) agar praktis dan aman.
* **Informasi Profil Kepegawaian**: Menampilkan detail Nama, NIP, Jabatan Fungsional, Golongan Saat Ini, serta Koefisien Angka Kredit Tahunan.
* **Estimasi Angka Kredit Berjalan Otomatis**: Menghitung total estimasi Angka Kredit secara *real-time* sampai dengan triwulan terakhir yang telah berjalan dari periode SK Dasar.
* **Kalkulator Proyeksi Triwulanan**: Simulasi interaktif bagi pegawai untuk memilih **Triwulan (I–IV)** dan **Tahun** tertentu guna melihat proyeksi akumulasi poin di masa mendatang maupun histori di masa lalu.
* **Indikator Capaian Target Pangkat & Jenjang**: Menampilkan kekurangan poin menuju Golongan dan Jenjang berikutnya, lengkap dengan notifikasi visual otomatis apabila poin telah memenuhi syarat kenaikan pangkat/jenjang.

### 🛡️ 2. Portal Rekapitulasi Admin & Kepala Kantor (`/admin`)
* **Proteksi Kode Akses Admin**: Halaman khusus pimpinan dan tim SDM yang dilindungi dengan autentikasi kata sandi administrator.
* **Pengelompokan Berdasarkan Jabatan Fungsional**:
  * **Mode Kelompok Jabatan**: Menampilkan daftar pegawai yang dikelompokkan per Jabatan Fungsional lengkap dengan badge jumlah pegawai dan jumlah yang telah memenuhi syarat naik pangkat.
  * **Mode Tabel Gabungan**: Menampilkan seluruh pegawai lintas jabatan dalam satu tabel terpadu.
* **Pengurutan Otomatis (Ranking Angka Kredit)**: Daftar pegawai di setiap kelompok jabatan secara otomatis diurutkan mulai dari **Angka Kredit tertinggi ke terendah**.
* **Simulasi Periode Serentak**: Memungkinkan Kepala Kantor atau Admin mengubah periode Triwulan dan Tahun untuk memetakan siapa saja pegawai yang siap naik pangkat/jenjang pada periode tersebut.
* **Pencarian & Filter Cepat**: Mendukung pencarian *real-time* berdasarkan Nama, NIP, Golongan, atau Jabatan, serta tombol filter cepat (*pill filter*) per jabatan.
* **Ekspor Laporan ke Excel Multi-Sheet (`.xlsx`)**: Mengunduh rekapitulasi lengkap dalam format Microsoft Excel yang terbagi otomatis ke dalam beberapa *sheet*:
  1. `Semua Pegawai` (Daftar keseluruhan sesuai filter).
  2. `Rekap Per Jabatan` (Ringkasan jumlah pegawai & kesiapan naik pangkat/jenjang per jabatan).
  3. *Sheet Masing-Masing Jabatan* (Tabel detail terpisah untuk setiap Jabatan Fungsional).

---

## 🧮 Rumus & Logika Perhitungan

Perhitungan proyeksi Angka Kredit pada aplikasi ini mengacu pada skema konversi predikat kinerja periodik (triwulanan) dengan asumsi predikat kinerja default **Baik (100%)**:

$$\text{AK Estimasi} = \text{AK Dasar} + \left( \text{Selisih Bulan} \times \frac{\text{Koefisien Tahunan}}{12} \right)$$

Di mana:
* **$\text{AK Dasar}$**: Nilai Angka Kredit terakhir yang tercantum pada SK/PAK dasar di database (`PeriodeData`).
* **$\text{Selisih Bulan}$**: Jarak bulan antara periode SK dasar (`YYYY-MM`) dengan akhir triwulan target yang dipilih.
* **$\text{Koefisien Tahunan}$**: Konstanta perolehan angka kredit tahunan sesuai jenjang jabatan fungsional (contoh: Terampil = `5`, Mahir/Ahli Pertama = `12.5`, Penyelia/Ahli Muda = `25`, Ahli Madya = `37.5`).

---

## 🛠️ Teknologi yang Digunakan

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Server Actions)
* **UI Library**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Database Integration**: [Google Sheets API](https://developers.google.com/sheets/api) (`google-spreadsheet` & `google-auth-library` dengan autentikasi JWT Service Account)
* **Excel Export**: [SheetJS (`xlsx`)](https://sheetjs.com/)
* **Deployment**: [Vercel](https://vercel.com/)

---

## ⚙️ Panduan Instalasi & Menjalankan di Lokal

### 1. Prasyarat
Pastikan perangkat Anda telah terinstal **Node.js** (versi 18.18+ atau 20+) dan **npm**.

### 2. Clone Repositori & Instalasi Dependensi
```bash
git clone <url-repositori-anda>
cd cek-angka-kredit
npm install
```

### 3. Konfigurasi Environment Variables
Buat file `.env.local` di direktori utama (*root*) proyek dan tambahkan variabel berikut:

```env
# Kredensial Google Service Account (Wajib memiliki akses baca ke Google Sheet)
GOOGLE_CLIENT_EMAIL="nama-service-account@project-id.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Kata Sandi Halaman Admin (/admin)
ADMIN_PASSWORD="password_admin_anda"
```

### 4. Struktur Kolom Google Sheets
Pastikan lembar kerja pertama (*Sheet 1*) pada Google Spreadsheet memiliki baris *header* dengan nama kolom berikut:

| Kolom | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `Nama` | Nama lengkap pegawai beserta gelar | `Budi Santoso, S.Tr.Stat.` |
| `NIP` | Nomor Induk Pegawai (18 digit) | `199501012018011001` |
| `Tgl.Lahir` | Tanggal lahir dengan format `DD-MM-YYYY` | `01-01-1995` |
| `Jabatan` | Nama jabatan fungsional & jenjang | `Statistisi Ahli Pertama` |
| `Gol.Akhir` | Golongan ruang saat ini | `III/a` |
| `GolonganSelanjutnya` | Target golongan ruang berikutnya | `III/b` |
| `JenjangSelanjutnya` | Target jenjang jabatan berikutnya | `Statistisi Ahli Muda` |
| `AngkaKredit` | Nilai angka kredit pada SK/PAK terakhir | `37,5` |
| `TargetPangkat` | Target AK untuk naik pangkat (`0` jika maksimal) | `50` |
| `TargetJenjang` | Target AK untuk naik jenjang (`0` jika puncak) | `100` |
| `KoefisienTahunan` | Koefisien AK tahunan sesuai jenjang | `12,5` |
| `PeriodeData` | Periode posisi data SK dasar (`YYYY-MM`) | `2025-12` |

### 5. Menjalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat halaman utama, atau [http://localhost:3000/admin](http://localhost:3000/admin) untuk masuk ke portal rekapitulasi admin.

---

## 📁 Struktur Direktori Proyek

```text
cek-angka-kredit/
├── app/
│   ├── admin/
│   │   └── page.tsx       # Halaman Portal Rekapitulasi Admin & Ekspor Excel
│   ├── actions.ts         # Server Actions untuk integrasi Google Sheets & autentikasi
│   ├── globals.css        # Konfigurasi gaya global & Tailwind CSS
│   ├── layout.tsx         # Root layout & metadata aplikasi
│   └── page.tsx           # Halaman utama pengecekan & kalkulator proyeksi pegawai
├── public/
│   └── bps-logo.png       # Aset logo resmi BPS
├── package.json
└── README.md
```

---

## 📄 Lisensi & Hak Cipta

Dikembangkan untuk mendukung transformasi digital pengelolaan kepegawaian di lingkungan **Badan Pusat Statistik (BPS) Kabupaten Garut**.
