window.DASHBOARD_CONFIG = {
  organizationName: "BPS KABUPATEN NABIRE",

  dataMode: "google-sheet",

  // WAJIB: tempel kembali URL CSV Google Sheets Anda di sini.
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvVtl-0x_TjmpTtgLLwgB0pW26mqX-KR9v-0va5OeFnnuiQ4HWUMzOpPYBFO6Te0mQVYSPoZKOFaIv/pub?gid=698571820&single=true&output=csv",

  itemsPerPage: 6,
  pageIntervalMs: 12000,

  // Refresh data Google Sheets setiap 60 detik.
  scheduleRefreshIntervalMs: 60000,

  // Auto hide kegiatan yang selesai.
  autoHideCompletedActivities: true,
  completedActivityGracePeriodMinutes: 0,

  // Cek waktu kegiatan setiap 30 detik.
  activityTimeCheckIntervalMs: 30000,

  // Reload penuh browser setiap 2 menit.
  autoReloadPage: true,
  autoReloadPageIntervalMs: 120000,

  tickerText: "Selamat bekerja. Pastikan seluruh agenda, tugas luar/kegiatan luar, rapat, istirahat, cuti, dan kegiatan kantor telah diperbarui melalui Google Sheets.",

  // Cuaca Nabire, Papua Tengah.
  weatherLatitude: -3.3670,
  weatherLongitude: 135.4830,
  weatherLocationName: "Nabire, Papua Tengah",
  weatherTimezone: "Asia/Jayapura",
  weatherRefreshIntervalMs: 600000
};