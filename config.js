window.DASHBOARD_CONFIG = {
  organizationName: "BPS KABUPATEN NABIRE",

  // SHEET 1: Jadwal Kegiatan
  googleSheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvVtl-0x_TjmpTtgLLwgB0pW26mqX-KR9v-0va5OeFnnuiQ4HWUMzOpPYBFO6Te0mQVYSPoZKOFaIv/pub?gid=698571820&single=true&output=csv",

  // SHEET 2: Catatan Pimpinan
  leadershipNotesCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvVtl-0x_TjmpTtgLLwgB0pW26mqX-KR9v-0va5OeFnnuiQ4HWUMzOpPYBFO6Te0mQVYSPoZKOFaIv/pub?gid=706140591&single=true&output=csv",

  scheduleRefreshIntervalMs: 60000,
  leadershipNotesRefreshIntervalMs: 60000,

  itemsPerPage: 6,
  pageIntervalMs: 12000,

  autoHideCompletedActivities: true,
  completedActivityGracePeriodMinutes: 0,
  activityTimeCheckIntervalMs: 30000,

  autoReloadPage: true,
  autoReloadPageIntervalMs: 120000,

  tickerText: "Selamat bekerja. Jaga Kesehatan. Jaga Kewarasan.",

  weatherLatitude: -3.3670,
  weatherLongitude: 135.4830,
  weatherLocationName: "Nabire, Papua Tengah",
  weatherTimezone: "Asia/Jayapura",
  weatherRefreshIntervalMs: 600000
};