const config = window.DASHBOARD_CONFIG;

const sampleData = [
  {
    tanggal: todayISO(),
    nama: "Sudiman, S.Pd",
    divisi: "P3S",
    status: "Tugas Luar",
    kegiatan: "Pengawasan lapangan",
    lokasi: "Kabanjahe",
    mulai: "08:00",
    selesai: "16:00"
  },
  {
    tanggal: todayISO(),
    nama: "Gemar Tarigan, ST",
    divisi: "HP2H",
    status: "Monitoring",
    kegiatan: "Monitoring kegiatan lapangan",
    lokasi: "Berastagi",
    mulai: "09:00",
    selesai: "15:00"
  },
  {
    tanggal: todayISO(),
    nama: "Dr. Oda Kinata Banurea, M.Pd",
    divisi: "P3S",
    status: "Rapat",
    kegiatan: "Rapat koordinasi provinsi",
    lokasi: "Medan",
    mulai: "10:00",
    selesai: "13:00"
  },
  {
    tanggal: todayISO(),
    nama: "Andi",
    divisi: "Sekretariat",
    status: "Kantor",
    kegiatan: "Penyusunan laporan",
    lokasi: "Kantor",
    mulai: "08:00",
    selesai: "16:00"
  },
  {
    tanggal: todayISO(),
    nama: "Budi",
    divisi: "Umum",
    status: "Cuti",
    kegiatan: "Cuti tahunan",
    lokasi: "-",
    mulai: "-",
    selesai: "-"
  },
  {
    tanggal: addDaysISO(1),
    nama: "Citra",
    divisi: "SDMO",
    status: "Tugas Luar",
    kegiatan: "Supervisi administrasi",
    lokasi: "Tigapanah",
    mulai: "08:30",
    selesai: "15:30"
  },
  {
    tanggal: addDaysISO(1),
    nama: "Dewi",
    divisi: "Hukum",
    status: "Rapat",
    kegiatan: "Pembahasan regulasi",
    lokasi: "Kantor",
    mulai: "09:00",
    selesai: "11:00"
  }
];

let allData = [];
let currentPage = 0;
let pageTimer = null;

function todayISO() {
  return toLocalISO(new Date());
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}

function toLocalISO(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) return "";
  const clean = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const parts = clean.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2,"0")}-${parts[2].padStart(2,"0")}`;
    }
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }

  const parsed = new Date(clean);
  return isNaN(parsed) ? "" : toLocalISO(parsed);
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("tugas luar")) return "outside";
  if (value.includes("rapat")) return "meeting";
  if (value.includes("monitor")) return "monitoring";
  if (value.includes("cuti") || value.includes("libur")) return "leave";
  return "office";
}

function formatDate(date, options) {
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString("id-ID", { hour12: false });
  document.getElementById("fullDate").textContent =
    formatDate(now, { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

async function loadData() {
  try {
    if (config.dataMode === "google-sheet" && config.googleSheetCsvUrl) {
      const response = await fetch(`${config.googleSheetCsvUrl}${config.googleSheetCsvUrl.includes("?") ? "&" : "?"}t=${Date.now()}`);
      if (!response.ok) throw new Error("Gagal mengambil data Google Sheets.");
      const csv = await response.text();
      allData = parseCSV(csv);
    } else {
      allData = sampleData;
    }
    renderDashboard();
  } catch (error) {
    console.error(error);
    allData = sampleData;
    renderDashboard();
  }
}

function parseCSV(csv) {
  const rows = [];
  let row = [], cell = "", quoted = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"'; i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = []; cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift().map(h => h.trim().toLowerCase());
  const find = (...names) => names.map(n => headers.indexOf(n)).find(i => i >= 0);

  return rows.map(r => ({
    tanggal: normalizeDate(r[find("tanggal", "date")]),
    nama: r[find("nama pegawai", "nama", "pegawai")] || "",
    divisi: r[find("divisi", "unit")] || "",
    status: r[find("status")] || "Kantor",
    kegiatan: r[find("kegiatan", "agenda")] || "",
    lokasi: r[find("lokasi", "tempat")] || "",
    mulai: r[find("jam mulai", "mulai")] || "",
    selesai: r[find("jam selesai", "selesai")] || ""
  })).filter(item => item.tanggal && item.nama);
}

function renderDashboard() {
  const today = todayISO();
  const tomorrow = addDaysISO(1);
  const todayItems = allData.filter(item => item.tanggal === today);
  const tomorrowItems = allData.filter(item => item.tanggal === tomorrow);

  document.getElementById("totalCount").textContent = todayItems.length;
  document.getElementById("outsideCount").textContent =
    todayItems.filter(i => statusClass(i.status) === "outside").length;
  document.getElementById("officeCount").textContent =
    todayItems.filter(i => statusClass(i.status) === "office").length;
  document.getElementById("meetingCount").textContent =
    todayItems.filter(i => statusClass(i.status) === "meeting").length;

  const tomorrowDate = new Date(`${tomorrow}T00:00:00`);
  document.getElementById("tomorrowDate").textContent =
    formatDate(tomorrowDate, { day: "2-digit", month: "short" });

  renderActivities(todayItems);
  renderTomorrow(tomorrowItems);
  document.getElementById("tickerText").textContent = config.tickerText;
}

function renderActivities(items) {
  const list = document.getElementById("activityList");
  const pages = Math.max(1, Math.ceil(items.length / config.itemsPerPage));
  currentPage = currentPage % pages;

  if (!items.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Tidak ada kegiatan terjadwal</strong>
          <span>Silakan perbarui sumber data untuk menampilkan agenda hari ini.</span>
        </div>
      </div>`;
    renderPagination(1);
    return;
  }

  const start = currentPage * config.itemsPerPage;
  const visible = items.slice(start, start + config.itemsPerPage);

  list.innerHTML = visible.map(item => `
    <article class="activity-card ${statusClass(item.status)}">
      <div class="bar"></div>
      <div>
        <div class="activity-top">
          <div>
            <div class="person">${escapeHTML(item.nama)}</div>
            <div class="meta">${escapeHTML(item.divisi)}</div>
          </div>
          <span class="status">${escapeHTML(item.status)}</span>
        </div>
        <div class="activity-title">${escapeHTML(item.kegiatan)}</div>
        <div class="meta">
          <span>📍 ${escapeHTML(item.lokasi || "-")}</span>
          <span>🕒 ${escapeHTML(item.mulai || "-")} - ${escapeHTML(item.selesai || "-")}</span>
        </div>
      </div>
    </article>
  `).join("");

  renderPagination(pages);
  resetPageTimer(items);
}

function renderPagination(pages) {
  document.getElementById("pagination").innerHTML =
    Array.from({ length: pages }, (_, index) =>
      `<span class="page-dot ${index === currentPage ? "active" : ""}"></span>`
    ).join("");
}

function resetPageTimer(items) {
  clearInterval(pageTimer);
  const pages = Math.ceil(items.length / config.itemsPerPage);
  if (pages <= 1) return;

  pageTimer = setInterval(() => {
    currentPage = (currentPage + 1) % pages;
    renderActivities(items);
  }, config.pageIntervalMs);
}

function renderTomorrow(items) {
  const list = document.getElementById("tomorrowList");

  if (!items.length) {
    list.innerHTML = `<div class="tomorrow-item"><strong>Belum ada agenda</strong><span>Data kegiatan besok belum tersedia.</span></div>`;
    return;
  }

  list.innerHTML = items.slice(0, 5).map(item => `
    <div class="tomorrow-item">
      <strong>${escapeHTML(item.nama)}</strong>
      <span>${escapeHTML(item.kegiatan)} • ${escapeHTML(item.lokasi || "-")}</span>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

updateClock();
setInterval(updateClock, 1000);
loadData();
setInterval(loadData, config.refreshIntervalMs);

// Memastikan dashboard otomatis berpindah hari setelah tengah malam.
let lastDate = todayISO();
setInterval(() => {
  const currentDate = todayISO();
  if (currentDate !== lastDate) {
    lastDate = currentDate;
    currentPage = 0;
    loadData();
  }
}, 30000);
