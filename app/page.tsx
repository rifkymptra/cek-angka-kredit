"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cekAngkaKredit } from "./actions";

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

export default function Home() {
  const [nip, setNip] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState<DataPegawai | null>(null);

  const [calcQ, setCalcQ] = useState<number>(1);
  const [calcY, setCalcY] = useState<number>(new Date().getFullYear());

  const getTriwulanTerakhir = () => {
    const now = new Date();
    const m = now.getMonth() + 1;
    let y = now.getFullYear();
    let q = 4;
    
    if (m >= 1 && m <= 3) { q = 4; y -= 1; }
    else if (m >= 4 && m <= 6) { q = 1; }
    else if (m >= 7 && m <= 9) { q = 2; }
    else if (m >= 10 && m <= 12) { q = 3; }
    
    return { q, y };
  };

  useEffect(() => {
    // Kunci sesi diperbarui menjadi sesiSiapPak
    const sesiTersimpan = sessionStorage.getItem("sesiSiapPak");
    if (sesiTersimpan) {
      setHasil(JSON.parse(sesiTersimpan));
    }
    
    const { q, y } = getTriwulanTerakhir();
    setCalcQ(q);
    setCalcY(y);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { q, y } = getTriwulanTerakhir();
    setCalcQ(q);
    setCalcY(y);

    try {
      const respons = await cekAngkaKredit(nip, tanggalLahir);
      if (respons.sukses && respons.data) {
        setHasil(respons.data);
        sessionStorage.setItem("sesiSiapPak", JSON.stringify(respons.data));
      } else {
        setError(respons.pesan || "Terjadi kesalahan yang tidak diketahui.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server. Silakan coba lagi nanti.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeluar = () => {
    setHasil(null);
    setNip("");
    setTanggalLahir("");
    sessionStorage.removeItem("sesiSiapPak");
  };

  let akBerjalan = 0;
  let lcqLabel = "";
  let akKalkulator = 0;
  let selisihBulanKalkulator = 0;

  if (hasil) {
    const [baseY, baseM] = hasil.periodeData.split("-").map(Number);
    const qRomawi = ["I", "II", "III", "IV"];

    const { q: currQ, y: currY } = getTriwulanTerakhir();
    const currMonth = currQ * 3;
    const selisihBulanBerjalan = (currY - baseY) * 12 + (currMonth - baseM);
    
    akBerjalan = Math.max(0, hasil.angkaKredit + (selisihBulanBerjalan * (hasil.koefisienTahunan / 12)));
    lcqLabel = `Triwulan ${qRomawi[currQ - 1]} ${currY}`;

    const targetMonth = calcQ * 3;
    selisihBulanKalkulator = (calcY - baseY) * 12 + (targetMonth - baseM);
    akKalkulator = Math.max(0, hasil.angkaKredit + (selisihBulanKalkulator * (hasil.koefisienTahunan / 12)));
  }

  const sisaPangkat = hasil ? Math.max(0, hasil.targetPangkat - akKalkulator) : 0;
  const sisaJenjang = hasil ? Math.max(0, hasil.targetJenjang - akKalkulator) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
  {/* Menggunakan tag img standar HTML */}
            <img 
              src="/bps-logo.png" 
              alt="Logo BPS" 
              className="h-9 w-auto object-contain"
            />
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              SIaP PAK <span className="hidden sm:inline font-normal text-slate-500">| BPS Kab. Garut</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Portal Admin
            </Link>
            {hasil && (
              <button 
                onClick={handleKeluar}
                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-colors"
              >
                Akhiri Sesi
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6 lg:px-8">
        {!hasil ? (
          <div className="mx-auto max-w-4xl animate-in fade-in duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 mb-4">
                🚀 Portal Kepegawaian BPS Kabupaten Garut 2026
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4 text-balance">
                SIaP PAK
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                Sistem Informasi Penyusunan Penetapan Angka Kredit. <br className="hidden sm:block" />Pantau histori dan proyeksikan capaian karir Anda secara akurat.
              </p>
            </div>

            <div className="max-w-xl mx-auto relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-100 to-indigo-100 blur opacity-50"></div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative z-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="nip" className="block text-sm font-semibold text-slate-700">Nomor Induk Pegawai (NIP)</label>
                      <input
                        type="text" id="nip" value={nip} onChange={(e) => setNip(e.target.value)} required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                        placeholder="Contoh: 123456"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="tanggalLahir" className="block text-sm font-semibold text-slate-700">Tanggal Lahir</label>
                      <input
                        type="date" id="tanggalLahir" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full flex items-center justify-center bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isLoading ? "Mencari Data..." : "Cek Angka Kredit"}
                  </button>
                </form>
              </div>

              {error && <div className="mt-4 p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium text-center relative z-10">{error}</div>}
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-slate-200">
              <div className="text-center md:text-left">
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Pengecekan Instan</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Akses data angka kredit secara real-time yang terintegrasi dari database tanpa proses yang rumit.</p>
              </div>
              <div className="text-center md:text-left">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Simulasi Triwulan</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Proyeksikan target kinerja Anda berdasarkan siklus penilaian triwulanan ASN terbaru.</p>
              </div>
              <div className="text-center md:text-left">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Privasi Terjaga</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Sesi yang aman. Keamanan informasi masing-masing individu dijamin menggunakan NIP dan sandi lahir.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
                <h2 className="text-xl font-bold mb-1">{hasil.nama}</h2>
                <p className="text-slate-400 font-mono text-sm mb-4">{hasil.nip}</p>
                <div className="space-y-3">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Jabatan Fungsional</p>
                    <p className="font-semibold text-sm">{hasil.jabatan}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Golongan</p>
                      <p className="font-semibold text-sm text-blue-400">{hasil.golonganSaatIni}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-1">Koefisien Tahunan</p>
                      <p className="font-semibold text-sm">{hasil.koefisienTahunan} / thn</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleKeluar}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Cek Pegawai Lain
              </button>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-slate-500 font-semibold mb-2">Total Angka Kredit (Estimasi Berjalan)</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-5xl font-black text-slate-900 tracking-tight">{akBerjalan.toFixed(2)}</p>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full">
                      Per {lcqLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">*Data SK Dasar: {hasil.periodeData} ({hasil.angkaKredit} Poin)</p>
                </div>
                <div className="w-full sm:w-auto text-center sm:text-right bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Status Kinerja</p>
                  <p className="text-sm font-medium text-slate-700">Predikat Default: <span className="font-bold text-slate-900">Baik (100%)</span></p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Kalkulator Proyeksi Triwulanan
                    </h3>
                    <p className="text-slate-400 text-sm max-w-md">
                      Pilih Triwulan dan Tahun untuk menyimulasikan poin Anda ke depan berdasarkan siklus SKP.
                    </p>
                  </div>
                  
                  <div className="w-full sm:w-auto bg-slate-800/80 p-3 rounded-xl border border-slate-700 backdrop-blur-sm flex gap-2">
                    <div>
                      <label className="block text-xs text-indigo-300 font-semibold mb-1 uppercase tracking-wider">Triwulan</label>
                      <select 
                        value={calcQ} onChange={(e) => setCalcQ(Number(e.target.value))}
                        className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value={1}>Triwulan I</option>
                        <option value={2}>Triwulan II</option>
                        <option value={3}>Triwulan III</option>
                        <option value={4}>Triwulan IV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-indigo-300 font-semibold mb-1 uppercase tracking-wider">Tahun</label>
                      <input 
                        type="number" value={calcY} onChange={(e) => setCalcY(Number(e.target.value))}
                        className="w-24 bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 bg-slate-800/50 rounded-xl p-5 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${selisihBulanKalkulator < 0 ? 'bg-amber-500/20 text-amber-400' : selisihBulanKalkulator > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {selisihBulanKalkulator < 0 ? 'Histori' : selisihBulanKalkulator > 0 ? 'Proyeksi' : 'Posisi SK Dasar'}
                      </span>
                      <p className="text-sm font-medium text-slate-300">
                        {selisihBulanKalkulator === 0 
                          ? `Sama dengan periode SK (${hasil.periodeData})` 
                          : `Jarak ${Math.abs(selisihBulanKalkulator)} bulan dari SK`}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Penyesuaian poin dari SK: <span className="text-white font-medium">{selisihBulanKalkulator < 0 ? '-' : '+'}{Math.abs((hasil.koefisienTahunan / 12) * selisihBulanKalkulator).toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-300 font-medium mb-1">Hasil Kalkulator</p>
                    <p className="text-4xl font-black text-white">{akKalkulator.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hasil.targetPangkat === 0 ? (
                  <div className="p-5 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Status Pangkat</p>
                    <p className="text-sm text-slate-700 font-semibold mt-1">Pangkat Maksimal / Tidak Ada Target</p>
                  </div>
                ) : sisaPangkat <= 0 ? (
                  <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="font-bold text-emerald-50 uppercase tracking-wider text-xs">Pangkat Tercapai!</h3>
                      </div>
                      <p className="text-sm text-emerald-100 mb-1">Menurut proyeksi, poin cukup untuk naik ke:</p>
                      <p className="text-xl font-black text-white">Golongan {hasil.golonganSelanjutnya}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-300 transition-colors flex flex-col justify-center">
                    <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Sisa Poin Pangkat</p>
                    <p className="text-sm text-slate-700 mb-3 font-medium">Ke Golongan <span className="font-bold text-slate-900">{hasil.golonganSelanjutnya}</span></p>
                    <div className="flex items-baseline gap-1.5 border-t border-slate-100 pt-3">
                      <span className="text-3xl font-bold text-slate-900">{sisaPangkat.toFixed(1)}</span>
                      <span className="text-sm text-slate-500 font-semibold">poin lagi</span>
                    </div>
                  </div>
                )}

                {hasil.targetJenjang === 0 ? (
                  <div className="p-5 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-center">
                    <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Status Jenjang</p>
                    <p className="text-sm text-slate-700 font-semibold mt-1">Sudah Mencapai Jenjang Puncak / Batas Maksimal</p>
                  </div>
                ) : sisaJenjang <= 0 ? (
                  <div className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/20 p-1.5 rounded-full">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="font-bold text-emerald-50 uppercase tracking-wider text-xs">Jenjang Tercapai!</h3>
                      </div>
                      <p className="text-sm text-emerald-100 mb-1">Menurut proyeksi, poin cukup untuk naik ke:</p>
                      <p className="text-xl font-black text-white">{hasil.jenjangSelanjutnya}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-300 transition-colors flex flex-col justify-center">
                    <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">Sisa Poin Jenjang</p>
                    <p className="text-sm text-slate-700 mb-3 font-medium">Ke <span className="font-bold text-slate-900">{hasil.jenjangSelanjutnya}</span></p>
                    <div className="flex items-baseline gap-1.5 border-t border-slate-100 pt-3">
                      <span className="text-3xl font-bold text-slate-900">{sisaJenjang.toFixed(1)}</span>
                      <span className="text-sm text-slate-500 font-semibold">poin lagi</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
