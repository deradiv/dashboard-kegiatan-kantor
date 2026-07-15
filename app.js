const config = window.DASHBOARD_CONFIG || {};

const COLORS = {
  outside: "#1f6feb",
  office: "#18a957",
  meeting: "#f28c28",
  monitoring: "#7a5af8",
  leave: "#d64545"
};

const sampleData = [
  {
    tanggal: todayISO(),
    nama: "Sudiman, S.Pd",
    divisi: "P3S",
    status: "Tugas Luar/Kegiatan Luar",
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
    status: "Tugas Luar/Kegiatan Luar",
    kegiatan: "Supervisi administrasi",
    lokasi: "Tigapanah",
    mulai: "08:30",
    selesai: "15:30"
  }
];

let allData = [];
let currentPage = 0;
let pageTimer = null;
let weatherTimer = null;

/* =========================
   UTILITAS TANGGAL DAN TEKS
   ========================= */

function toLocalISO(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function todayISO() {
  return toLocalISO(new Date());
}

function addDaysISO(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalISO(date);
}

function normalizeDate(value) {
  if (!value) return "";

  const clean = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  const parts = clean.split(/[\/\-]/);

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }

    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }

  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? "" : toLocalISO(parsed);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("tugas luar/kegiatan luar")) return "outside";
  if (value.includes("rapat")) return "meeting";
  if (value.includes("monitor")) return "monitoring";
  if (value.includes("cuti") || value.includes("libur")) return "leave";

  return "office";
}

function parseTime(value) {
  if (!/^\d{1,2}:\d{2}$/.test(String(value || ""))) {
    return null;
  }

  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
}

/* =========================
   HEADER, JAM, DAN IDENTITAS
   ========================= */

function updateClock() {
  const now = new Date();

  const clockElement = document.getElementById("clock");
  const dateElement = document.getElementById("fullDate");

  if (clockElement) {
    clockElement.textContent = now.toLocaleTimeString("id-ID", {
      hour12: false
    });
  }

  if (dateElement) {
    dateElement.textContent = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(now);
  }
}

function configureHeader() {
  const organizationElement = document.getElementById("organizationName");
  const tickerElement = document.getElementById("tickerText");
  const weatherBox = document.querySelector(".weather-box");

  if (organizationElement) {
    organizationElement.textContent =
      config.organizationName || "NAMA INSTANSI";
  }

  if (tickerElement) {
    tickerElement.textContent = config.tickerText || "";
  }

  if (!weatherBox) return;

  if (config.weatherMode === "off") {
    weatherBox.style.display = "none";
    return;
  }

  weatherBox.style.display = "";

  if (config.weatherMode === "realtime") {
    loadRealtimeWeather();
  } else {
    setWeatherDisplay(
      config.weatherTemperature || "--°C",
      config.weatherDescription || config.weatherLocationName || "",
      config.weatherIcon || "🌤️"
    );
  }
}

/* =========================
   CUACA REAL-TIME OPEN-METEO
   ========================= */

async function loadRealtimeWeather() {
  const latitude = Number(config.weatherLatitude);
  const longitude = Number(config.weatherLongitude);
  const locationName = config.weatherLocationName || "Lokasi";
  const timezone = config.weatherTimezone || "Asia/Jakarta";

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    console.error("Koordinat cuaca pada config.js tidak valid.");
    showWeatherFallback();
    return;
  }

  const parameters = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,wind_speed_10m",
    timezone,
    forecast_days: "1"
  });

  const url = `https://api.open-meteo.com/v1/forecast?${parameters.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo mengembalikan HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.current) {
      throw new Error("Data current tidak ditemukan pada respons cuaca.");
    }

    const weather = data.current;
    const temperature = Math.round(Number(weather.temperature_2m));
    const humidity = Math.round(Number(weather.relative_humidity_2m));
    const windSpeed = Math.round(Number(weather.wind_speed_10m));
    const weatherCode = Number(weather.weather_code);
    const isDay = Number(weather.is_day) === 1;

    const description = weatherDescription(weatherCode);
    const icon = weatherIcon(weatherCode, isDay);

    const detailParts = [
      description,
      locationName
    ];

    if (Number.isFinite(humidity)) {
      detailParts.push(`RH ${humidity}%`);
    }

    if (Number.isFinite(windSpeed)) {
      detailParts.push(`Angin ${windSpeed} km/j`);
    }

    setWeatherDisplay(
      Number.isFinite(temperature) ? `${temperature}°C` : "--°C",
      detailParts.join(" • "),
      icon
    );
  } catch (error) {
    console.error("Gagal memperbarui cuaca:", error);
    showWeatherFallback();
  }
}

function setWeatherDisplay(temperature, description, icon) {
  const temperatureElement = document.getElementById("weatherTemp");
  const descriptionElement = document.getElementById("weatherText");
  const iconElement = document.querySelector(".weather-icon");

  if (temperatureElement) {
    temperatureElement.textContent = temperature;
  }

  if (descriptionElement) {
    descriptionElement.textContent = description;
  }

  if (iconElement) {
    iconElement.textContent = icon;
  }
}

function showWeatherFallback() {
  setWeatherDisplay(
    config.weatherFallbackTemperature || "--°C",
    `${config.weatherFallbackDescription || "Cuaca tidak tersedia"} • ${
      config.weatherLocationName || "Lokasi"
    }`,
    config.weatherFallbackIcon || "🌤️"
  );
}

function weatherDescription(code) {
  const descriptions = {
    0: "Cerah",
    1: "Cerah Berawan",
    2: "Berawan Sebagian",
    3: "Berawan",
    45: "Berkabut",
    48: "Kabut Berembun",
    51: "Gerimis Ringan",
    53: "Gerimis",
    55: "Gerimis Lebat",
    56: "Gerimis Beku Ringan",
    57: "Gerimis Beku Lebat",
    61: "Hujan Ringan",
    63: "Hujan",
    65: "Hujan Lebat",
    66: "Hujan Beku Ringan",
    67: "Hujan Beku Lebat",
    71: "Salju Ringan",
    73: "Salju",
    75: "Salju Lebat",
    77: "Butiran Salju",
    80: "Hujan Lokal Ringan",
    81: "Hujan Lokal",
    82: "Hujan Lokal Lebat",
    85: "Hujan Salju Ringan",
    86: "Hujan Salju Lebat",
    95: "Hujan Petir",
    96: "Hujan Petir dan Es",
    99: "Badai Petir dan Es"
  };

  return descriptions[code] || "Kondisi Cuaca";
}

function weatherIcon(code, isDay) {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1) return isDay ? "🌤️" : "🌙";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";

  return "🌤️";
}

function startWeatherAutoRefresh() {
  clearInterval(weatherTimer);

  if (config.weatherMode !== "realtime") return;

  const interval = Number(config.weatherRefreshIntervalMs) || 900000;

  weatherTimer = setInterval(loadRealtimeWeather, interval);
}

/* =========================
   SUMBER DATA GOOGLE SHEETS
   ========================= */

async function loadData() {
  try {
    if (
      config.dataMode === "google-sheet" &&
      config.googleSheetCsvUrl &&
      !config.googleSheetCsvUrl.includes("TEMPELKAN_URL")
    ) {
      const separator = config.googleSheetCsvUrl.includes("?") ? "&" : "?";
      const url = `${config.googleSheetCsvUrl}${separator}t=${Date.now()}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Google Sheets mengembalikan HTTP ${response.status}`);
      }

      const csv = await response.text();
      allData = parseCSV(csv);
    } else {
      allData = sampleData;
    }
  } catch (error) {
    console.error("Gagal mengambil data jadwal:", error);
    allData = sampleData;
  }

  const lastRefresh = document.getElementById("lastRefresh");

  if (lastRefresh) {
    lastRefresh.textContent = `Diperbarui ${new Date().toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )}`;
  }

  renderDashboard();
}

function parseCSV(csv) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (
      (character === "\n" || character === "\r") &&
      !quoted
    ) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows
    .shift()
    .map((header) => header.trim().toLowerCase());

  const findColumn = (...names) =>
    names
      .map((name) => headers.indexOf(name))
      .find((index) => index >= 0);

  return rows
    .map((record) => ({
      tanggal: normalizeDate(record[findColumn("tanggal", "date")]),
      nama:
        record[
          findColumn("nama pegawai", "nama", "pegawai")
        ] || "",
      divisi: record[findColumn("divisi", "unit")] || "",
      status: record[findColumn("status")] || "Kantor",
      kegiatan:
        record[findColumn("kegiatan", "agenda")] || "",
      lokasi:
        record[findColumn("lokasi", "tempat")] || "",
      mulai:
        record[findColumn("jam mulai", "mulai")] || "",
      selesai:
        record[findColumn("jam selesai", "selesai")] || ""
    }))
    .filter((item) => item.tanggal && item.nama);
}

/* =========================
   RENDER DASHBOARD
   ========================= */

function renderDashboard() {
  const today = todayISO();
  const tomorrow = addDaysISO(1);

  const todayItems = allData.filter(
    (item) => item.tanggal === today
  );

  const tomorrowItems = allData.filter(
    (item) => item.tanggal === tomorrow
  );

  const counts = {
    outside: 0,
    office: 0,
    meeting: 0,
    monitoring: 0,
    leave: 0
  };

  todayItems.forEach((item) => {
    counts[statusClass(item.status)] += 1;
  });

  setText("totalCount", todayItems.length);
  setText("outsideCount", counts.outside);
  setText("officeCount", counts.office);
  setText("meetingCount", counts.meeting);
  setText("monitoringCount", counts.monitoring);
  setText("leaveCount", counts.leave);

  renderActivities(todayItems);
  renderTomorrow(tomorrowItems, tomorrow);
  renderCalendar();
  renderChart(counts, todayItems.length);
  renderOngoing(todayItems);
}

function setText(elementId, value) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = value;
  }
}

function renderActivities(items) {
  const list = document.getElementById("activityList");

  if (!list) return;

  const itemsPerPage = Number(config.itemsPerPage) || 6;
  const pages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  currentPage %= pages;

  if (!items.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div>
          <strong>Tidak ada kegiatan terjadwal</strong>
          <span>Perbarui Google Sheets untuk menampilkan agenda hari ini.</span>
        </div>
      </div>
    `;

    renderPagination(1);
    clearInterval(pageTimer);
    return;
  }

  const start = currentPage * itemsPerPage;
  const visibleItems = items.slice(start, start + itemsPerPage);

  list.innerHTML = visibleItems
    .map(
      (item) => `
        <article class="activity-card ${statusClass(item.status)}">
          <div class="bar"></div>
          <div>
            <div class="activity-top">
              <div>
                <div class="person">${escapeHTML(item.nama)}</div>
                <div class="division">${escapeHTML(item.divisi)}</div>
              </div>
              <span class="status">${escapeHTML(item.status)}</span>
            </div>

            <div class="activity-title">
              ${escapeHTML(item.kegiatan)}
            </div>

            <div class="meta">
              <span>📍 ${escapeHTML(item.lokasi || "-")}</span>
              <span>
                🕒 ${escapeHTML(item.mulai || "-")} -
                ${escapeHTML(item.selesai || "-")}
              </span>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  renderPagination(pages);

  clearInterval(pageTimer);

  if (pages > 1) {
    const interval = Number(config.pageIntervalMs) || 12000;

    pageTimer = setInterval(() => {
      currentPage = (currentPage + 1) % pages;
      renderActivities(items);
    }, interval);
  }
}

function renderPagination(pages) {
  const pagination = document.getElementById("pagination");

  if (!pagination) return;

  pagination.innerHTML = Array.from(
    { length: pages },
    (_, index) =>
      `<span class="page-dot ${
        index === currentPage ? "active" : ""
      }"></span>`
  ).join("");
}

function renderTomorrow(items, dateISO) {
  const date = new Date(`${dateISO}T00:00:00`);
  const tomorrowDate = document.getElementById("tomorrowDate");
  const list = document.getElementById("tomorrowList");

  if (tomorrowDate) {
    tomorrowDate.textContent = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short"
    }).format(date);
  }

  if (!list) return;

  list.innerHTML = items.length
    ? items
        .slice(0, 4)
        .map(
          (item) => `
            <div class="tomorrow-item">
              <strong>${escapeHTML(item.nama)}</strong>
              <span>
                ${escapeHTML(item.kegiatan)} •
                ${escapeHTML(item.lokasi || "-")}
              </span>
            </div>
          `
        )
        .join("")
    : `
        <div class="tomorrow-item">
          <strong>Belum ada agenda</strong>
          <span>Jadwal besok belum tersedia.</span>
        </div>
      `;
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const calendarMonth = document.getElementById("calendarMonth");
  const calendarGrid = document.getElementById("calendarGrid");

  if (calendarMonth) {
    calendarMonth.textContent = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric"
    }).format(now);
  }

  if (!calendarGrid) return;

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const eventDates = new Set(allData.map((item) => item.tanggal));
  const cells = [];

  for (let index = startDay - 1; index >= 0; index -= 1) {
    const day = previousMonthDays - index;

    cells.push({
      number: day,
      muted: true,
      date: new Date(year, month - 1, day)
    });
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    cells.push({
      number: day,
      muted: false,
      date: new Date(year, month, day)
    });
  }

  let nextMonthDay = 1;

  while (cells.length < 42) {
    cells.push({
      number: nextMonthDay,
      muted: true,
      date: new Date(year, month + 1, nextMonthDay)
    });

    nextMonthDay += 1;
  }

  calendarGrid.innerHTML = cells
    .map((cellItem) => {
      const iso = toLocalISO(cellItem.date);
      const isToday = iso === todayISO();
      const hasEvent = eventDates.has(iso);

      return `
        <div class="day
          ${cellItem.muted ? "muted" : ""}
          ${isToday ? "today" : ""}
          ${hasEvent ? "has-event" : ""}">
          ${cellItem.number}
        </div>
      `;
    })
    .join("");
}

function renderChart(counts, total) {
  const chart = document.getElementById("donutChart");
  const legend = document.getElementById("chartLegend");

  setText("chartTotal", total);

  if (!chart || !legend) return;

  const order = [
    "outside",
    "office",
    "meeting",
    "monitoring",
    "leave"
  ];

  const labels = {
    outside: "Tugas Luar/Kegiatan Luar",
    office: "Kantor",
    meeting: "Rapat",
    monitoring: "Monitoring",
    leave: "Cuti/Libur"
  };

  let currentDegree = 0;
  const gradientParts = [];

  order.forEach((key) => {
    const degree = total ? (counts[key] / total) * 360 : 0;

    gradientParts.push(
      `${COLORS[key]} ${currentDegree}deg ${
        currentDegree + degree
      }deg`
    );

    currentDegree += degree;
  });

  chart.style.background = total
    ? `conic-gradient(${gradientParts.join(",")})`
    : "conic-gradient(#dfe6ef 0deg 360deg)";

  legend.innerHTML = order
    .map(
      (key) => `
        <div class="legend-row">
          <div class="legend-left">
            <span
              class="legend-color"
              style="background:${COLORS[key]}"
            ></span>
            ${labels[key]}
          </div>
          <span class="legend-value">${counts[key]}</span>
        </div>
      `
    )
    .join("");
}

function renderOngoing(items) {
  const banner = document.getElementById("ongoingBanner");

  if (!banner) return;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const ongoingItems = items.filter((item) => {
    const start = parseTime(item.mulai);
    const end = parseTime(item.selesai);

    return (
      start !== null &&
      end !== null &&
      currentMinutes >= start &&
      currentMinutes <= end
    );
  });

  if (ongoingItems.length) {
    banner.classList.remove("hidden");
    banner.textContent = `Sedang berlangsung: ${ongoingItems
      .slice(0, 3)
      .map((item) => `${item.nama} — ${item.kegiatan}`)
      .join(" | ")}`;
  } else {
    banner.classList.add("hidden");
  }
}

/* =========================
   INISIALISASI
   ========================= */

configureHeader();
updateClock();
startWeatherAutoRefresh();

setInterval(updateClock, 1000);

loadData();

setInterval(
  loadData,
  Number(config.refreshIntervalMs) || 60000
);

// Memastikan dashboard berganti otomatis setelah tengah malam.
let lastDate = todayISO();

setInterval(() => {
  const currentDate = todayISO();

  if (currentDate !== lastDate) {
    lastDate = currentDate;
    currentPage = 0;
    loadData();
    loadRealtimeWeather();
  } else {
    renderOngoing(
      allData.filter((item) => item.tanggal === currentDate)
    );
  }
}, 30000);
