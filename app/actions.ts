"use server"; 

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export type DataPegawai = {
  nama: string;
  nip: string;
  jabatan: string;
  golonganSaatIni: string;
  golonganSelanjutnya: string;
  jenjangSelanjutnya: string;
  angkaKredit: number;
  targetPangkat: number;
  targetJenjang: number;
  koefisienTahunan: number;
  periodeData: string;
};

async function getSpreadsheetRows() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), 
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const doc = new GoogleSpreadsheet('1CQgUsGDihRxhMtacgQGlPyeQ0ZUwYkU-lZlK-LxYPZ0', serviceAccountAuth);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0]; 
  return await sheet.getRows();
}

function mapRowToPegawai(row: any): DataPegawai {
  return {
    nama: row.get('Nama')?.toString().trim() || '-',
    nip: row.get('NIP')?.toString().trim() || '-',
    jabatan: row.get('Jabatan')?.toString().trim() || 'Lainnya',
    golonganSaatIni: row.get('Gol.Akhir')?.toString().trim() || '-',
    golonganSelanjutnya: row.get('GolonganSelanjutnya')?.toString().trim() || '-',
    jenjangSelanjutnya: row.get('JenjangSelanjutnya')?.toString().trim() || '-',
    angkaKredit: parseFloat(row.get('AngkaKredit')?.toString().replace(',', '.') || '0'),
    targetPangkat: parseFloat(row.get('TargetPangkat')?.toString().replace(',', '.') || '0'),
    targetJenjang: parseFloat(row.get('TargetJenjang')?.toString().replace(',', '.') || '0'),
    koefisienTahunan: parseFloat(row.get('KoefisienTahunan')?.toString().replace(',', '.') || '0'),
    periodeData: row.get('PeriodeData')?.toString().trim() || '2025-12',
  };
}

export async function cekAngkaKredit(nip: string, tanggalLahir: string): Promise<{ sukses: boolean; data?: DataPegawai; pesan?: string }> {
  try {
    const rows = await getSpreadsheetRows();

    const [tahunInput, bulanInput, tanggalInput] = tanggalLahir.split("-");
    const tanggalLahirFormatSheet = `${tanggalInput}-${bulanInput}-${tahunInput}`;

    const barisPegawai = rows.find((row) => {
      const rowNip = row.get('NIP')?.toString().trim();
      const rowTanggalLahir = row.get('Tgl.Lahir')?.toString().trim();
      return rowNip === nip.trim() && rowTanggalLahir === tanggalLahirFormatSheet;
    });

    if (barisPegawai) {
      return {
        sukses: true,
        data: mapRowToPegawai(barisPegawai),
      };
    }

    return { sukses: false, pesan: "NIP atau Tanggal Lahir tidak terdaftar dalam sistem." };

  } catch (error) {
    console.error("Terjadi kesalahan sistem:", error);
    return { sukses: false, pesan: "Terjadi kesalahan saat menghubungkan ke database." };
  }
}

export async function ambilRekapPegawaiAdmin(password: string): Promise<{ sukses: boolean; data?: DataPegawai[]; pesan?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD || "bps3205admin";

  if (!password || password !== adminPassword) {
    return { sukses: false, pesan: "Kode Akses Admin tidak valid." };
  }

  try {
    const rows = await getSpreadsheetRows();
    const daftarPegawai: DataPegawai[] = rows
      .filter((row) => row.get('NIP')?.toString().trim())
      .map((row) => mapRowToPegawai(row));

    return {
      sukses: true,
      data: daftarPegawai,
    };
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil rekap admin:", error);
    return { sukses: false, pesan: "Gagal mengambil data rekap dari Google Sheets." };
  }
}
