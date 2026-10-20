"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ambilRekapPegawaiAdmin, DataPegawai } from "../actions";

const getTriwulanTerakhir = () => {
  const now = new Date();
  const m = now.getMonth() + 1;
  let y = now.getFullYear();
  let q = 4;

  if (m >= 1 && m <= 3) {
    q = 4;
    y -= 1;
  } else if (m >= 4 && m <= 6) {
    q = 1;
  } else if (m >= 7 && m <= 9) {
    q = 2;
  } else if (m >= 10 && m <= 12) {
    q = 3;
  }

  return { q, y };
};

export default function AdminRekapPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [pegawaiList, setPegawaiList] = useState<DataPegawai[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJabatan, setSelectedJabatan] = useState("SEMUA");
  const [modeTampilan, setModeTampilan] = useState<"kelompok" | "tabel">("kelompok");

  const { q: currQ, y: currY } = getTriwulanTerakhir();
  const [calcQ, setCalcQ] = useState<number>(currQ);
  const [calcY, setCalcY] = useState<number>(currY);

  const qRomawi = ["I", "II", "III", "IV"];
  const labelPeriode = `Triwulan ${qRomawi[calcQ - 1]} ${calcY}`;

  useEffect(() => {
    const savedPass = sessionStorage.getItem("adminPassSiapPak");
    if (savedPass) {
      setPassword(savedPass);
      muatDataAdmin(savedPass);
    }
  }, []);

  const muatDataAdmin = async (pass: string) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await ambilRekapPegawaiAdmin(pass);
      if (res.sukses && res.data) {
        setPegawaiList(res.data);
        setIsAuthenticated(true);
        sessionStorage.setItem("adminPassSiapPak", pass);
      } else {
        setError(res.pesan || "Kode akses ditolak.");
        sessionStorage.removeItem("adminPassSiapPak");
        setIsAuthenticated(false);
      }
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await muatDataAdmin(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminPassSiapPak");
    setIsAuthenticated(false);
    setPassword("");
    setPegawaiList([]);
  };

  // Hitung proyeksi untuk setiap pegawai pada triwulan terpilih
  const dataTerproses = useMemo(() => {
    const targetMonth = calcQ * 3;
    return pegawaiList.map((p) => {
      const [baseY, baseM] = (p.periodeData || "2025-12").split("-").map(Number);
      const selisihBulan = (calcY - baseY) * 12 + (targetMonth - baseM);
      const akEstimasi = Math.max(0, p.angkaKredit + selisihBulan * (p.koefisienTahunan / 12));
      const sisaPangkat = p.targetPangkat > 0 ? Math.max(0, p.targetPangkat - akEstimasi) : 0;
      const sisaJenjang = p.targetJenjang > 0 ? Math.max(0, p.targetJenjang - akEstimasi) : 0;

      const siapNaikPangkat = p.targetPangkat > 0 && sisaPangkat <= 0;
      const siapNaikJenjang = p.targetJenjang > 0 && sisaJenjang <= 0;

      return {
        ...p,
        akEstimasi,
        sisaPangkat,
        sisaJenjang,
        siapNaikPangkat,
        siapNaikJenjang,
      };
    });
  }, [pegawaiList, calcQ, calcY]);

  // Daftar jabatan unik
  const daftarJabatan = useMemo(() => {
    const setJab = new Set<string>();
    dataTerproses.forEach((p) => {
      if (p.jabatan) setJab.add(p.jabatan);
    });
    return Array.from(setJab).sort((a, b) => a.localeCompare(b));
  }, [dataTerproses]);

  // Filter berdasarkan pencarian dan jabatan, lalu urutkan dari angka kredit tertinggi
  const dataTersaring = useMemo(() => {
    return dataTerproses
      .filter((p) => {
        const cocokJabatan = selectedJabatan === "SEMUA" || p.jabatan === selectedJabatan;
        const q = searchQuery.toLowerCase().trim();
        const cocokCari =
          !q ||
          p.nama.toLowerCase().includes(q) ||
          p.nip.toLowerCase().includes(q) ||
          p.jabatan.toLowerCase().includes(q) ||
          p.golonganSaatIni.toLowerCase().includes(q);
        return cocokJabatan && cocokCari;
      })
      .sort((a, b) => b.akEstimasi - a.akEstimasi || b.angkaKredit - a.angkaKredit);
  }, [dataTerproses, selectedJabatan, searchQuery]);

  // Kelompokkan berdasarkan jabatan (setiap kelompok otomatis terurut dari angka kredit tertinggi)
  const kelompokJabatan = useMemo(() => {
    const grup: Record<string, typeof dataTersaring> = {};
    dataTersaring.forEach((p) => {
      const key = p.jabatan || "Lainnya";
      if (!grup[key]) grup[key] = [];
      grup[key].push(p);
    });
    return Object.entries(grup)
      .map(([jabatan, list]) => [
        jabatan,
        [...list].sort((a, b) => b.akEstimasi - a.akEstimasi || b.angkaKredit - a.angkaKredit),
      ] as const)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [dataTersaring]);

  // Statistik Ringkasan
  const totalPegawai = dataTersaring.length;
  const totalSiapPangkat = dataTersaring.filter((p) => p.siapNaikPangkat).length;
  const totalSiapJenjang = dataTersaring.filter((p) => p.siapNaikJenjang).length;

  // Fungsi Download Excel (.xlsx)
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const formatRow = (p: (typeof dataTersaring)[0], index: number) => ({
      No: index + 1,
      Nama: p.nama,
      NIP: p.nip,
      "Jabatan Fungsional": p.jabatan,
      "Golongan Saat Ini": p.golonganSaatIni,
      "Koefisien Tahunan": p.koefisienTahunan,
      "Periode SK Dasar": p.periodeData,
      "AK SK Dasar": Number(p.angkaKredit.toFixed(2)),
      [`Estimasi AK (${labelPeriode})`]: Number(p.akEstimasi.toFixed(2)),
      "Golongan Selanjutnya": p.golonganSelanjutnya,
      "Target AK Pangkat": p.targetPangkat,
      "Sisa AK Pangkat": Number(p.sisaPangkat.toFixed(2)),
      "Status Pangkat":
        p.targetPangkat === 0
          ? "Maksimal / Tidak Ada Target"
          : p.siapNaikPangkat
          ? "Memenuhi Syarat"
          : `Kurang ${p.sisaPangkat.toFixed(1)} Poin`,
      "Jenjang Selanjutnya": p.jenjangSelanjutnya,
      "Target AK Jenjang": p.targetJenjang,
      "Sisa AK Jenjang": Number(p.sisaJenjang.toFixed(2)),
      "Status Jenjang":
        p.targetJenjang === 0
          ? "Jenjang Puncak / Maksimal"
          : p.siapNaikJenjang
          ? "Memenuhi Syarat"
          : `Kurang ${p.sisaJenjang.toFixed(1)} Poin`,
    });

    // Sheet 1: Semua Pegawai (Tersaring)
    const semuaRows = dataTersaring.map((p, idx) => formatRow(p, idx));
    const wsSemua = XLSX.utils.json_to_sheet(semuaRows);
    XLSX.utils.book_append_sheet(wb, wsSemua, "Semua Pegawai");

    // Sheet 2: Ringkasan per Jabatan
    const ringkasanJabatan = kelompokJabatan.map(([namaJabatan, list], idx) => ({
      No: idx + 1,
      "Jabatan Fungsional": namaJabatan,
      "Jumlah Pegawai": list.length,
      "Memenuhi Target Pangkat": list.filter((x) => x.siapNaikPangkat).length,
      "Memenuhi Target Jenjang": list.filter((x) => x.siapNaikJenjang).length,
    }));
    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanJabatan);
    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Rekap Per Jabatan");

    // Sheet per Jabatan (jika memilih semua atau per kelompok)
    kelompokJabatan.forEach(([namaJabatan, list]) => {
      // Nama sheet di Excel maksimal 31 karakter dan tidak boleh mengandung karakter terlarang
      const cleanSheetName = namaJabatan
        .replace(/[\\/?*[\]:]/g, " ")
        .trim()
        .slice(0, 31);
      const sheetRows = list.map((p, idx) => formatRow(p, idx));
      const wsJab = XLSX.utils.json_to_sheet(sheetRows);
      // Pastikan nama sheet unik
      if (!wb.SheetNames.includes(cleanSheetName)) {
        XLSX.utils.book_append_sheet(wb, wsJab, cleanSheetName || "Jabatan");
      }
    });

    const fileName = `Rekap_PAK_BPS_Garut_${labelPeriode.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/bps-logo.png" alt="Logo BPS" className="h-9 w-auto object-contain" />
            <div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                SIaP PAK <span className="hidden sm:inline font-normal text-slate-500">| Portal Admin</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              ← Halaman Pegawai
            </Link>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Keluar Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        {!isAuthenticated ? (
          <div className="mx-auto max-w-md mt-12 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Akses Rekapitulasi Admin</h1>
              <p className="text-sm text-center text-slate-500 mb-6">
                Masukkan kode akses administrator untuk melihat rekapitulasi seluruh pegawai dan mengunduh laporan Excel.
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Kode Akses Admin
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password admin..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-800 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 cursor-pointer shadow-sm"
                >
                  {isLoading ? "Memverifikasi & Memuat Data..." : "Masuk ke Dashboard Rekap"}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3.5 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Tombol Ekspor */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
                  Dashboard Kepala Kantor & SDM
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Rekapitulasi Angka Kredit Pegawai
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Data terintegrasi dari Google Sheets • Simulasi Periode:{" "}
                  <span className="font-semibold text-slate-800">{labelPeriode}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => muatDataAdmin(password)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isLoading ? "Memuat..." : "Segarkan Data"}
                </button>

                <button
                  onClick={handleDownloadExcel}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Kartu Statistik Ringkasan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pegawai</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalPegawai}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Dalam {kelompokJabatan.length} kelompok jabatan
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Memenuhi Target Pangkat
                </p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{totalSiapPangkat}</p>
                <p className="text-xs text-slate-500 mt-1">Pegawai siap naik golongan pada {labelPeriode}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Memenuhi Target Jenjang
                </p>
                <p className="text-3xl font-black text-indigo-600 mt-1">{totalSiapJenjang}</p>
                <p className="text-xs text-slate-500 mt-1">Pegawai siap naik jenjang pada {labelPeriode}</p>
              </div>

              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                  Periode Simulasi Rekap
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={calcQ}
                    onChange={(e) => setCalcQ(Number(e.target.value))}
                    className="bg-slate-800 text-white text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1"
                  >
                    <option value={1}>Triwulan I</option>
                    <option value={2}>Triwulan II</option>
                    <option value={3}>Triwulan III</option>
                    <option value={4}>Triwulan IV</option>
                  </select>
                  <input
                    type="number"
                    value={calcY}
                    onChange={(e) => setCalcY(Number(e.target.value))}
                    className="w-20 bg-slate-800 text-white text-sm px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Filter & Kontrol Tampilan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama pegawai, NIP, golongan, atau jabatan..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm"
                  />
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      onClick={() => setModeTampilan("kelompok")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        modeTampilan === "kelompok"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Kelompok Jabatan
                    </button>
                    <button
                      onClick={() => setModeTampilan("tabel")}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        modeTampilan === "tabel"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Tabel Gabungan
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Pill Berdasarkan Jabatan */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Filter Kelompok Jabatan:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedJabatan("SEMUA")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedJabatan === "SEMUA"
                        ? "bg-blue-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    Semua Jabatan ({dataTerproses.length})
                  </button>
                  {daftarJabatan.map((jab) => {
                    const count = dataTerproses.filter((p) => p.jabatan === jab).length;
                    return (
                      <button
                        key={jab}
                        onClick={() => setSelectedJabatan(jab)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          selectedJabatan === jab
                            ? "bg-blue-700 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {jab} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Konten Tabel / Kelompok */}
            {dataTersaring.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-500 font-medium">Tidak ada data pegawai yang sesuai dengan filter pencarian.</p>
              </div>
            ) : modeTampilan === "kelompok" ? (
              <div className="space-y-6">
                {kelompokJabatan.map(([namaJabatan, listPegawai]) => (
                  <div
                    key={namaJabatan}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                        <h2 className="text-lg font-bold">{namaJabatan}</h2>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-slate-800 text-slate-200 px-3 py-1 rounded-full font-semibold border border-slate-700">
                          {listPegawai.length} Pegawai
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-semibold border border-emerald-500/30">
                          {listPegawai.filter((x) => x.siapNaikPangkat).length} Siap Pangkat
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-3.5 px-4">No</th>
                            <th className="py-3.5 px-4">Nama & NIP</th>
                            <th className="py-3.5 px-4">Gol. Saat Ini</th>
                            <th className="py-3.5 px-4 text-right">Estimasi AK ({labelPeriode})</th>
                            <th className="py-3.5 px-4">Target Pangkat</th>
                            <th className="py-3.5 px-4">Target Jenjang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {listPegawai.map((p, idx) => (
                            <tr key={p.nip + idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 text-slate-400 font-medium">{idx + 1}</td>
                              <td className="py-3.5 px-4">
                                <p className="font-bold text-slate-900">{p.nama}</p>
                                <p className="text-xs font-mono text-slate-500">{p.nip}</p>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  {p.golonganSaatIni}
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">+{p.koefisienTahunan}/thn</p>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <span className="font-extrabold text-slate-900 text-base">
                                  {p.akEstimasi.toFixed(2)}
                                </span>
                              </td>
                              <td className="py-3.5 px-4">
                                {p.targetPangkat === 0 ? (
                                  <span className="text-xs text-slate-400 font-medium">Maksimal</span>
                                ) : p.siapNaikPangkat ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                      ✓ Tercapai ({p.golonganSelanjutnya})
                                    </span>
                                    <p className="text-xs text-slate-400 mt-0.5">Target: {p.targetPangkat}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                      Ke <span className="text-slate-900 font-bold">{p.golonganSelanjutnya}</span> (Target: {p.targetPangkat})
                                    </p>
                                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                                      Kurang {p.sisaPangkat.toFixed(1)} poin
                                    </p>
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                {p.targetJenjang === 0 ? (
                                  <span className="text-xs text-slate-400 font-medium">Jenjang Puncak</span>
                                ) : p.siapNaikJenjang ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                      ✓ Tercapai ({p.jenjangSelanjutnya})
                                    </span>
                                    <p className="text-xs text-slate-400 mt-0.5">Target: {p.targetJenjang}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                      Ke <span className="text-slate-900 font-bold">{p.jenjangSelanjutnya}</span> (Target: {p.targetJenjang})
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                      Kurang {p.sisaJenjang.toFixed(1)} poin
                                    </p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Mode Tabel Gabungan */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">No</th>
                        <th className="py-3.5 px-4">Nama & NIP</th>
                        <th className="py-3.5 px-4">Jabatan Fungsional</th>
                        <th className="py-3.5 px-4">Golongan</th>
                        <th className="py-3.5 px-4 text-right">AK Dasar</th>
                        <th className="py-3.5 px-4 text-right">Estimasi AK ({labelPeriode})</th>
                        <th className="py-3.5 px-4">Status Pangkat</th>
                        <th className="py-3.5 px-4">Status Jenjang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dataTersaring.map((p, idx) => (
                        <tr key={p.nip + idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900">{p.nama}</p>
                            <p className="text-xs font-mono text-slate-500">{p.nip}</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">{p.jabatan}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {p.golonganSaatIni}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            {p.angkaKredit.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                            {p.akEstimasi.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            {p.targetPangkat === 0 ? (
                              <span className="text-xs text-slate-400">Maksimal</span>
                            ) : p.siapNaikPangkat ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                ✓ Siap ke {p.golonganSelanjutnya}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold">
                                Kurang {p.sisaPangkat.toFixed(1)} ke {p.golonganSelanjutnya}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {p.targetJenjang === 0 ? (
                              <span className="text-xs text-slate-400">Maksimal</span>
                            ) : p.siapNaikJenjang ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                ✓ Siap ke {p.jenjangSelanjutnya}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-medium">
                                Kurang {p.sisaJenjang.toFixed(1)} ke {p.jenjangSelanjutnya}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

