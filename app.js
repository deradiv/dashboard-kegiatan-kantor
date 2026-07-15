const C=window.DASHBOARD_CONFIG||{};let data=[],notes=[],page=0,pageTimer;
function now(){return new Date(new Date().toLocaleString("en-US",{timeZone:C.weatherTimezone||"Asia/Jayapura"}))}
function iso(d=now()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function add(n){let d=now();d.setDate(d.getDate()+n);return iso(d)}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function txt(id,v){let e=document.getElementById(id);if(e)e.textContent=v}
function cls(s){s=String(s||"").toLowerCase();if(s.includes("tugas luar")||s.includes("kegiatan luar"))return"outside";if(s.includes("rapat"))return"meeting";if(s.includes("istirahat"))return"break";if(s.includes("cuti")||s.includes("libur"))return"leave";return"office"}
function norm(v){v=String(v||"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v))return v;let p=v.split(/[\/-]/);if(p.length===3)return p[0].length===4?`${p[0]}-${p[1].padStart(2,"0")}-${p[2].padStart(2,"0")}`:`${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}`;return""}
function mins(v){if(v===null||v===undefined||v==="")return null;let x=String(v).trim().replace(/\./g,":");if(/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(x))x=x.split(":").slice(0,2).join(":");if(!/^\d{1,2}:\d{1,2}$/.test(x))return null;let p=x.split(":").map(Number);return p[0]*60+p[1]}
function completed(x){if(!C.autoHideCompletedActivities)return false;let e=mins(x.selesai),n=now();if(e===null)return false;return n.getHours()*60+n.getMinutes()>e+(Number(C.completedActivityGracePeriodMinutes)||0)}
function tick(){let d=now();txt("clock",d.toLocaleTimeString("id-ID",{hour12:false}));txt("fullDate",new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(d))}
function parseCSV(csv){let rows=[],row=[],cell="",q=false;for(let i=0;i<csv.length;i++){let c=csv[i],n=csv[i+1];if(c=='"'&&q&&n=='"'){cell+='"';i++}else if(c=='"')q=!q;else if(c==","&&!q){row.push(cell);cell=""}else if((c=="\n"||c=="\r")&&!q){if(c=="\r"&&n=="\n")i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=""}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows}
function parseDateTime(dateValue,timeValue){
  let d=norm(dateValue);
  if(!d)return null;
  let t=String(timeValue||"00:00").trim().replace(/\./g,":");
  if(/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(t))t=t.split(":").slice(0,2).join(":");
  if(!/^\d{1,2}:\d{1,2}$/.test(t))t="00:00";
  let [hh,mm]=t.split(":").map(Number);
  if(hh<0||hh>23||mm<0||mm>59)return null;
  let [y,m,day]=d.split("-").map(Number);
  return new Date(y,m-1,day,hh,mm,0,0);
}
function noteIsActive(x){
  let flag=String(x.aktif||"Ya").toLowerCase().trim();
  if(["tidak","no","false","0"].includes(flag))return false;
  let n=now();
  let start=parseDateTime(x.tanggalMulai,x.jamMulai);
  let end=parseDateTime(x.tanggalSelesai,x.jamSelesai);
  if(start && n<start)return false;
  if(end && n>end)return false;
  return true;
}
async function weather(){try{let q=new URLSearchParams({latitude:C.weatherLatitude,longitude:C.weatherLongitude,current:"temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m",timezone:C.weatherTimezone});let r=await fetch(`https://api.open-meteo.com/v1/forecast?${q}&_=${Date.now()}`,{cache:"no-store"});let w=(await r.json()).current;txt("weatherTemp",`${Math.round(w.temperature_2m)}°C`);txt("weatherIcon",w.weather_code>=95?"⛈️":w.weather_code>=61?"🌧️":w.weather_code>=3?"☁️":"🌤️");txt("weatherText",`${C.weatherLocationName} • RH ${Math.round(w.relative_humidity_2m)}% • Angin ${Math.round(w.wind_speed_10m)} km/j`);txt("weatherUpdated",`Diperbarui ${now().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} WIT`)}catch(e){}}
async function loadSchedule(){try{let r=await fetch(`${C.googleSheetCsvUrl}${C.googleSheetCsvUrl.includes("?")?"&":"?"}_=${Date.now()}`,{cache:"no-store"});let rows=parseCSV(await r.text()),h=rows.shift().map(x=>x.trim().toLowerCase()),f=(...n)=>n.map(x=>h.indexOf(x)).find(x=>x>=0);data=rows.map(r=>({tanggal:norm(r[f("tanggal","date")]),nama:r[f("nama pegawai","nama","pegawai")]||"",status:r[f("status")]||"Kantor",kegiatan:r[f("kegiatan","agenda")]||"",lokasi:r[f("lokasi","tempat")]||"",mulai:r[f("jam mulai","mulai")]||"",selesai:r[f("jam selesai","selesai")]||""})).filter(x=>x.tanggal&&x.nama);render()}catch(e){data=[];render()}}
async function loadNotes(){try{let r=await fetch(`${C.leadershipNotesCsvUrl}${C.leadershipNotesCsvUrl.includes("?")?"&":"?"}_=${Date.now()}`,{cache:"no-store"});let rows=parseCSV(await r.text()),h=rows.shift().map(x=>x.trim().toLowerCase()),f=(...n)=>n.map(x=>h.indexOf(x)).find(x=>x>=0);notes=rows.map(r=>({judul:r[f("judul")]||"Catatan",catatan:r[f("catatan","isi")]||"",prioritas:r[f("prioritas")]||"Normal",tanggalMulai:r[f("tanggal mulai","mulai tanggal")]||"",jamMulai:r[f("jam mulai","mulai jam")]||"",tanggalSelesai:r[f("tanggal selesai","selesai tanggal")]||"",jamSelesai:r[f("jam selesai","selesai jam")]||"",aktif:r[f("aktif")]||"Ya"}));renderNotes();txt("notesLastRefresh",`Diperbarui ${now().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} WIT`)}catch(e){notes=[];renderNotes();txt("notesLastRefresh","Gagal memuat catatan")}}
function render(){let a=data.filter(x=>x.tanggal===iso()&&!completed(x)),b=data.filter(x=>x.tanggal===add(1)),n={outside:0,office:0,meeting:0,break:0,leave:0};a.forEach(x=>n[cls(x.status)]++);txt("totalCount",a.length);txt("outsideCount",n.outside);txt("officeCount",n.office);txt("meetingCount",n.meeting);txt("breakCount",n.break);txt("leaveCount",n.leave);let e=document.getElementById("activityList");e.innerHTML=a.length?a.map(x=>`<article class="card ${cls(x.status)}"><i class="bar"></i><div><div class="cardtop"><div><div class="person">${esc(x.nama)}</div></div><span class="tag">${esc(x.status)}</span></div><div class="activity">${esc(x.kegiatan)}</div><div class="meta"><span>📍 ${esc(x.lokasi)}</span><span>🕒 ${esc(x.mulai)} - ${esc(x.selesai)}</span></div></div></article>`).join(""):'<div class="empty">Tidak ada kegiatan aktif</div>';document.getElementById("tomorrowList").innerHTML=b.length?b.slice(0,5).map(x=>`<div class="tomorrow"><b>${esc(x.nama)}</b><span>${esc(x.kegiatan)} • ${esc(x.lokasi)}</span></div>`).join(""):'<div class="tomorrow"><b>Belum ada agenda</b></div>'}
function renderNotes(){let active=notes.filter(noteIsActive),e=document.getElementById("leadershipNotesList");e.innerHTML=active.length?active.slice(0,5).map(x=>`<div class="note ${String(x.prioritas).toLowerCase().includes("mendesak")?"urgent":String(x.prioritas).toLowerCase().includes("penting")?"important":""}"><div class="note-top"><strong>${esc(x.judul)}</strong><span class="priority">${esc(x.prioritas)}</span></div><p>${esc(x.catatan)}</p><small>🕒 ${esc(x.tanggalMulai||"-")} ${esc(x.jamMulai||"")} s.d. ${esc(x.tanggalSelesai||"-")} ${esc(x.jamSelesai||"")}</small></div>`).join(""):'<div class="empty">Belum ada catatan pimpinan aktif</div>'}
txt("organizationName",C.organizationName);txt("tickerText",C.tickerText);tick();setInterval(tick,1000);weather();setInterval(weather,C.weatherRefreshIntervalMs||600000);loadSchedule();setInterval(loadSchedule,C.scheduleRefreshIntervalMs||60000);loadNotes();setInterval(loadNotes,C.leadershipNotesRefreshIntervalMs||60000);setInterval(()=>{render();renderNotes()},C.activityTimeCheckIntervalMs||30000);if(C.autoReloadPage)setInterval(()=>location.reload(),C.autoReloadPageIntervalMs||120000);