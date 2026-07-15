window.DASHBOARD_CONFIG = {
  /*
    MODE DATA:
    - "sample"       : memakai data contoh di app.js
    - "google-sheet" : membaca data CSV dari Google Sheets yang dipublikasikan

    Cara memakai Google Sheets:
    1. Buat tabel dengan header:
       Tanggal, Nama Pegawai, Divisi, Status, Kegiatan, Lokasi, Jam Mulai, Jam Selesai
    2. Pilih File > Share > Publish to web.
    3. Publikasikan sheet sebagai CSV.
    4. Tempel URL CSV pada googleSheetCsvUrl di bawah.
  */
  dataMode: "google-sheet",
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvVtl-0x_TjmpTtgLLwgB0pW26mqX-KR9v-0va5OeFnnuiQ4HWUMzOpPYBFO6Te0mQVYSPoZKOFaIv/pub?gid=0&single=true&output=csv",

  // Jumlah kartu kegiatan per halaman.
  itemsPerPage: 6,

  // Durasi pergantian halaman otomatis dalam milidetik.
  pageIntervalMs: 12000,

  // Interval refresh data Google Sheets.
  refreshIntervalMs: 60000,

  // Running text bagian bawah.
  tickerText:
    "Selamat bekerja. Pastikan setiap kegiatan dan penugasan telah diperbarui melalui sumber data resmi."
};
