"use client";

import { useState } from "react";

// Mendefinisikan tipe data agar rapi dan mudah dikelola
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
};

export default function Home() {
  const [nip, setNip] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState<DataPegawai | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setHasil(null);

    // Simulasi penarikan data dari server
    setTimeout(() => {
      if (nip === "123456" && tanggalLahir === "1990-01-01") {
        setHasil({
          nama: "Fulan bin Fulan",
          nip: "123456",
          jabatan: "Pranata Komputer Ahli Pertama",
          golonganSaatIni: "III/a",
          golonganSelanjutnya: "III/b",
          jenjangSelanjutnya: "Ahli Muda",
          angkaKredit: 32.5,
          targetPangkat: 50,  
          targetJenjang: 100, 
        });
      } else {
        setError("NIP atau Tanggal Lahir tidak terdaftar dalam sistem.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">
      
      {/* Navbar Minimalis */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Logo BPS Sederhana */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white font-bold shadow-sm">
              B
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              Lacak Karir <span className="hidden sm:inline font-normal text-slate-500">| BPS Kab. Garut</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="hidden text-sm font-medium text-slate-500 transition hover:text-blue-700 md:block">
              Panduan
            </a>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              Sistem Internal
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        
        {/* Hero Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-10">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 mb-4">
            🚀 Cek Cepat Angka Kredit
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Pantau Jejak Karir Anda.
          </h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Masukkan NIP dan Tanggal Lahir untuk melihat akumulasi angka kredit, target kenaikan pangkat, dan jenjang fungsional Anda.
          </p>
        </div>

        {/* Area Form & Hasil (Grid Layout) */}
        <div className="mx-auto max-w-xl">
          {/* Card Form Utama */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Input NIP */}
                <div className="space-y-1.5">
                  <label htmlFor="nip" className="block text-sm font-semibold text-slate-700">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    id="nip"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-800 text-sm"
                    placeholder="Contoh: 123456"
                  />
                </div>

                {/* Input Tanggal Lahir */}
                <div className="space-y-1.5">
                  <label htmlFor="tanggalLahir" className="block text-sm font-semibold text-slate-700">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    id="tanggalLahir"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-800 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Mencari Data...
                  </span>
                ) : (
                  "Cek Angka Kredit"
                )}
              </button>
            </form>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          {/* Card Hasil Pencarian */}
          {hasil && (
            <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profil Singkat */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{hasil.nama}</h2>
                  <p className="text-sm font-medium text-slate-500 font-mono mt-0.5">{hasil.nip}</p>
                </div>
                <div className="flex flex-col gap-1.5 sm:items-end">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded-full w-fit">
                    {hasil.jabatan}
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full w-fit">
                    Golongan {hasil.golonganSaatIni}
                  </span>
                </div>
              </div>

              {/* Angka Kredit Utama */}
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-8 rounded-2xl text-center shadow-lg shadow-blue-900/20 relative overflow-hidden">
                {/* Ornamen Latar (Gen Z touch) */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl"></div>
                
                <p className="text-blue-100 text-sm font-medium mb-2 relative z-10">Total Angka Kredit Saat Ini</p>
                <p className="text-6xl font-extrabold tracking-tight relative z-10">{hasil.angkaKredit}</p>
              </div>

              {/* Target Kenaikan (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pangkat */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  </div>
                  <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Target Kenaikan Pangkat
                  </p>
                  <p className="text-sm text-slate-700 mb-3 font-medium">
                    Ke Golongan <span className="font-bold text-slate-900">{hasil.golonganSelanjutnya}</span>
                  </p>
                  <div className="flex items-baseline gap-1.5 border-t border-slate-100 pt-3">
                    <span className="text-2xl font-bold text-slate-900">
                      {Math.max(0, hasil.targetPangkat - hasil.angkaKredit).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">poin lagi</span>
                  </div>
                </div>

                {/* Jenjang */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Target Kenaikan Jenjang
                  </p>
                  <p className="text-sm text-slate-700 mb-3 font-medium">
                    Ke <span className="font-bold text-slate-900">{hasil.jenjangSelanjutnya}</span>
                  </p>
                  <div className="flex items-baseline gap-1.5 border-t border-slate-100 pt-3">
                    <span className="text-2xl font-bold text-slate-900">
                      {Math.max(0, hasil.targetJenjang - hasil.angkaKredit).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">poin lagi</span>
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
}