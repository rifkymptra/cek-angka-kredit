"use server"; 

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

type DataPegawai = {
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

export async function cekAngkaKredit(nip: string, tanggalLahir: string): Promise<{ sukses: boolean; data?: DataPegawai; pesan?: string }> {
  try {
    // KITA KEMBALI MENGGUNAKAN ENVIRONMENT VARIABLES UNTUK VERCEL
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), 
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const doc = new GoogleSpreadsheet('1CQgUsGDihRxhMtacgQGlPyeQ0ZUwYkU-lZlK-LxYPZ0', serviceAccountAuth);
    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0]; 
    const rows = await sheet.getRows();

    const [tahunInput, bulanInput, tanggalInput] = tanggalLahir.split("-");
    const tanggalLahirFormatSheet = `${tanggalInput}-${bulanInput}-${tahunInput}`;

    const barisPegawai = rows.find((row) => {
      const rowNip = row.get('NIP')?.toString().trim();
      const rowTanggalLahir = row.get('Tgl.Lahir')?.toString().trim();
      return rowNip === nip && rowTanggalLahir === tanggalLahirFormatSheet;
    });

    if (barisPegawai) {
      return {
        sukses: true,
        data: {
          nama: barisPegawai.get('Nama'),
          nip: barisPegawai.get('NIP'),
          jabatan: barisPegawai.get('Jabatan'),
          golonganSaatIni: barisPegawai.get('Gol.Akhir'),
          golonganSelanjutnya: barisPegawai.get('GolonganSelanjutnya'),
          jenjangSelanjutnya: barisPegawai.get('JenjangSelanjutnya'),
          angkaKredit: parseFloat(barisPegawai.get('AngkaKredit')?.replace(',', '.') || '0'),
          targetPangkat: parseFloat(barisPegawai.get('TargetPangkat')?.replace(',', '.') || '0'),
          targetJenjang: parseFloat(barisPegawai.get('TargetJenjang')?.replace(',', '.') || '0'),
          koefisienTahunan: parseFloat(barisPegawai.get('KoefisienTahunan')?.replace(',', '.') || '0'),
          periodeData: barisPegawai.get('PeriodeData')?.toString().trim() || '2025-12',
        },
      };
    }

    return { sukses: false, pesan: "NIP atau Tanggal Lahir tidak terdaftar dalam sistem." };

  } catch (error) {
    console.error("Terjadi kesalahan sistem:", error);
    return { sukses: false, pesan: "Terjadi kesalahan saat menghubungkan ke database." };
  }
}