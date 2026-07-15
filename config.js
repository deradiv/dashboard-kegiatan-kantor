window.DASHBOARD_CONFIG = {
  organizationName: "BPS KABUPATEN NABIRE",

  /*
    SUMBER DATA JADWAL
    - "sample"       : memakai data contoh bawaan
    - "google-sheet" : membaca data dari Google Sheets yang dipublikasikan sebagai CSV
  */
  dataMode: "google-sheet",

  /*
    Tempel URL CSV Google Sheets yang sebelumnya sudah berhasil digunakan.
    Contoh:
    https://docs.google.com/spreadsheets/d/e/XXXXXXXX/pub?output=csv
  */
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvVtl-0x_TjmpTtgLLwgB0pW26mqX-KR9v-0va5OeFnnuiQ4HWUMzOpPYBFO6Te0mQVYSPoZKOFaIv/pub?gid=0&single=true&output=csv",

  // Jumlah kartu kegiatan yang tampil dalam satu halaman.
  itemsPerPage: 10,

  // Pergantian halaman otomatis setiap 12 detik.
  pageIntervalMs: 12000,

  // Pembaruan data Google Sheets setiap 60 detik.
  refreshIntervalMs: 60000,

  tickerText:
    "Selamat bekerja. Pastikan setiap jadwal tugas luar, rapat, monitoring, cuti, dan kegiatan kantor telah diperbarui.",

  /*
    CUACA REAL-TIME OPEN-METEO
    Koordinat berikut diarahkan ke sekitar Karang Mulia, Kabupaten Nabire.
    Silakan sesuaikan apabila lokasi kantor berbeda.
  */
  weatherMode: "realtime",
  weatherLatitude: -3.365369,
  weatherLongitude: 135.501412,
  weatherLocationName: "Nabire",
  weatherTimezone: "Asia/Jayapura",

  // Pembaruan cuaca setiap 15 menit.
  weatherRefreshIntervalMs: 900000,

  /*
    Data cadangan apabila koneksi API cuaca sedang gagal.
  */
  weatherFallbackTemperature: "--°C",
  weatherFallbackDescription: "Cuaca tidak tersedia",
  weatherFallbackIcon: "🌤️"
};
