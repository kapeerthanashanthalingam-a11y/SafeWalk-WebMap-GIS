// ================================================================
// SafeWalk Web Map - Western Province
// Leaflet + GeoJSON + Google Forms + Google Sheets
// ================================================================

// ------------------------- CONFIG -------------------------------
const FORM_VIEW_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdgncnCOESnZJ2IJYGJAc-TssjL8kB_oAfr15CEbLBS63tLDQ/viewform";

// Entry IDs confirmed from the user's Google Form screenshot.
const FORM_ENTRY_LONGITUDE = "756715849";
const FORM_ENTRY_LATITUDE  = "1288249379";

// Google Form response sheet configuration.
// AFTER publishing your response sheet to the web, put its ID and GID here.
const GOOGLE_SHEET_ID = "185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";
const GOOGLE_SHEET_GID = "1834860223";

// Refresh complaint reports every 60 seconds.
const REPORT_REFRESH_MS = 60000;

// ------------------------- MAP ----------------------------------
const map = L.map("map", { zoomControl:true }).setView([6.9271,79.8612], 9);

const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Tiles © Esri"
});

// ---------------------- HELPERS ---------------------------------
function safeText(value){
  return String(value ?? "").replace(/[&<>\"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[s]));
}

function featureName(p){ return p?.name || p?.Name || p?.NAME || "Unnamed location"; }
function featureType(p){ return p?.fclass || p?.type || p?.amenity || ""; }

function popupForFeature(title, p){
  const name = featureName(p);
  const type = featureType(p);
  return `<div class="popup-title">${title}</div>
    <table class="popup-table">
      <tr><td>Name</td><td>${safeText(name)}</td></tr>
      ${type ? `<tr><td>Type</td><td>${safeText(type)}</td></tr>` : ""}
      ${p?.osm_id ? `<tr><td>OSM ID</td><td>${safeText(p.osm_id)}</td></tr>` : ""}
    </table>`;
}

async function loadGeoJSON(url, layer){
  const response = await fetch(url);
  if(!response.ok) throw new Error(`${url} returned ${response.status}`);
  const data = await response.json();
  layer.addData(data);
  return data;
}

function pointLayer(file, color, title, emoji){
  const layer = L.geoJSON(null, {
    pointToLayer:(feature,latlng)=>L.circleMarker(latlng,{
      radius:6, color:"#fff", weight:1.5, fillColor:color, fillOpacity:.9
    }),
    onEachFeature:(feature, layer)=>layer.bindPopup(popupForFeature(`${emoji} ${title}`, feature.properties || {}))
  });
  loadGeoJSON(`data/${file}`,layer).catch(e=>console.error(e));
  return layer;
}

// ------------------ WESTERN PROVINCE ----------------------------
const westernProvince = L.geoJSON(null,{
  style:{color:"#d62828",weight:3,fillColor:"#ffcccc",fillOpacity:.12},
  onEachFeature:(f,l)=>l.bindPopup("<div class='popup-title'>🟥 Western Province</div><b>Province:</b> Western<br><b>Country:</b> Sri Lanka")
}).addTo(map);

loadGeoJSON("data/western_province.geojson",westernProvince)
  .then(()=>map.fitBounds(westernProvince.getBounds(),{padding:[10,10]}))
  .catch(e=>console.error("Western Province:",e));

// ---------------------- TRANSPORT LAYERS ------------------------
const roads = L.geoJSON(null,{style:{color:"#444",weight:1.6,opacity:.75}});
loadGeoJSON("data/roads.geojson",roads).catch(e=>console.error("Roads:",e));

const railway = L.geoJSON(null,{style:{color:"#8B4513",weight:3,dashArray:"8,6"}});
loadGeoJSON("data/railway.geojson",railway).catch(e=>console.error("Railway:",e));

const railwayStations = pointLayer("railway_stations.geojson","#8B0000","Railway Station","🚉");
const busStops = pointLayer("busstops.geojson","#008000","Bus Stop","🚌");
const schools = pointLayer("schools.geojson","#0066cc","School","🏫");
const hospitals = pointLayer("hospitals.geojson","#e63946","Hospital","🏥");
const parking = pointLayer("parking.geojson","#7b2cbf","Parking","🅿️");
const trafficLights = pointLayer("traffic_lights.geojson","#f77f00","Traffic Light","🚦");
const pedestrianCrossings = pointLayer("pedestrian_crossings.geojson","#d4a017","Pedestrian Crossing","🚸");

// -------------------- COMPLAINT REPORTS -------------------------
let complaintLayer = L.layerGroup();

function dmsToDecimal(value){
  if(value === null || value === undefined) return null;
  let s = String(value).trim();
  if(!s) return null;

  // Decimal number, including a possible N/E/S/W suffix.
  const decimalMatch = s.match(/^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/i);
  if(decimalMatch){
    let n = Number(decimalMatch[1]);
    const h = (decimalMatch[2] || "").toUpperCase();
    if(h === "S" || h === "W") n = -Math.abs(n);
    return n;
  }

  // DMS such as 79°54'05.2"E or 6°47'41.6"N.
  const m = s.match(/(\d+(?:\.\d+)?)\s*[°º]\s*(\d+(?:\.\d+)?)?\s*['’′]?\s*(\d+(?:\.\d+)?)?\s*["”″]?\s*([NSEW])?/i);
  if(!m) return null;
  const deg=Number(m[1]);
  const min=Number(m[2]||0);
  const sec=Number(m[3]||0);
  let n=deg+min/60+sec/3600;
  const h=(m[4]||"").toUpperCase();
  if(h === "S" || h === "W") n=-n;
  return n;
}

function findHeader(row, patterns){
  const keys=Object.keys(row);
  for(const pattern of patterns){
    const key=keys.find(k=>k.toLowerCase().trim()===pattern.toLowerCase());
    if(key) return key;
  }
  for(const pattern of patterns){
    const key=keys.find(k=>k.toLowerCase().includes(pattern.toLowerCase()));
    if(key) return key;
  }
  return null;
}

function parseCSV(text){
  // Handles quoted CSV values and commas inside descriptions.
  const rows=[]; let row=[]; let cell=""; let quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"'){
      if(quoted && n==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(c===',' && !quoted){row.push(cell);cell="";}
    else if((c==='\n'||c==='\r') && !quoted){
      if(c==='\r' && n==='\n') i++;
      row.push(cell);cell="";
      if(row.some(v=>v!=="")) rows.push(row);
      row=[];
    }else cell+=c;
  }
  if(cell!==""||row.length){row.push(cell);if(row.some(v=>v!==""))rows.push(row);}
  if(!rows.length) return [];
  const headers=rows[0].map(h=>h.trim());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}

function severityColor(value){
  const s=String(value||"").toLowerCase();
  if(s.includes("critical")) return "#8e0000";
  if(s.includes("high")) return "#c62828";
  if(s.includes("medium")) return "#ef6c00";
  return "#2e7d32";
}

function renderComplaintRows(rows){
  complaintLayer.clearLayers();
  let count=0;
  rows.forEach(row=>{
    const latKey=findHeader(row,["latitude","lat"]);
    const lngKey=findHeader(row,["longitude","lng","lon"]);
    if(!latKey||!lngKey) return;
    const lat=dmsToDecimal(row[latKey]);
    const lng=dmsToDecimal(row[lngKey]);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) return;

    const issueKey=findHeader(row,["issue type","issue"]);
    const severityKey=findHeader(row,["severity level","severity"]);
    const descKey=findHeader(row,["description of the problem","description"]);
    const dateKey=findHeader(row,["date observed","date"]);
    const photoKey=findHeader(row,["evidence","photo","upload"]);

    const issue=row[issueKey]||"Pedestrian safety complaint";
    const severity=row[severityKey]||"";
    const description=row[descKey]||"";
    const date=row[dateKey]||"";
    const photo=row[photoKey]||"";

    const marker=L.circleMarker([lat,lng],{
      radius:9,color:"#fff",weight:2,fillColor:severityColor(severity),fillOpacity:.95
    });

    marker.bindPopup(`<div class="complaint-popup">
      <div class="popup-title">🚨 SafeWalk Report</div>
      <table class="popup-table">
        <tr><td>Issue</td><td>${safeText(issue)}</td></tr>
        <tr><td>Severity</td><td>${safeText(severity)}</td></tr>
        ${date?`<tr><td>Date</td><td>${safeText(date)}</td></tr>`:""}
        ${description?`<tr><td>Description</td><td>${safeText(description)}</td></tr>`:""}
        <tr><td>Location</td><td>${lat.toFixed(6)}, ${lng.toFixed(6)}</td></tr>
        ${photo && /^https?:\/\//i.test(photo)?`<tr><td>Evidence</td><td><a href="${safeText(photo)}" target="_blank" rel="noopener">View photo/file</a></td></tr>`:""}
      </table>
    </div>`);
    marker.addTo(complaintLayer); count++;
  });
  document.getElementById("reportCount").textContent=count;
}

async function loadComplaintReports(){
  if(!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID.startsWith("PASTE_")) return;
  try{
    const url=`https://docs.google.com/spreadsheets/d/${encodeURIComponent(GOOGLE_SHEET_ID)}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(GOOGLE_SHEET_GID)}`;
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`Google Sheet returned ${response.status}`);
    const text=await response.text();
    const rows=parseCSV(text);
    renderComplaintRows(rows);
  }catch(e){
    console.error("Complaint reports could not be loaded:",e);
    document.getElementById("reportCount").textContent="—";
  }
}

// ---------------------- CURRENT LOCATION ------------------------
let currentLocation=null;
let locationMarker=null;
let accuracyCircle=null;
let selectedMarker=null;

function dmsString(value, positive, negative){
  const hemi=value>=0?positive:negative; let v=Math.abs(value);
  const deg=Math.floor(v); v=(v-deg)*60; const min=Math.floor(v); const sec=(v-min)*60;
  return `${deg}°${String(min).padStart(2,"0")}'${sec.toFixed(1)}"${hemi}`;
}

function updateStatus(lat,lng,label){
  document.getElementById("locationStatus").innerHTML=`${safeText(label||"Selected location")} — ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function setSelectedLocation(lat,lng,label){
  currentLocation={lat,lng};
  if(selectedMarker) map.removeLayer(selectedMarker);
  selectedMarker=L.marker([lat,lng],{draggable:true}).addTo(map).bindPopup("📍 Report location<br>Drag the pin to adjust the location.").openPopup();
  selectedMarker.on("dragend",()=>{
    const p=selectedMarker.getLatLng(); currentLocation={lat:p.lat,lng:p.lng}; updateStatus(p.lat,p.lng,"Selected report location");
  });
  updateStatus(lat,lng,label);
}

function locateUser(){
  if(!navigator.geolocation){alert("Geolocation is not supported by this browser.");return;}
  document.getElementById("locationStatus").textContent="Requesting your location…";
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat=pos.coords.latitude, lng=pos.coords.longitude;
    currentLocation={lat,lng};
    if(locationMarker) map.removeLayer(locationMarker);
    if(accuracyCircle) map.removeLayer(accuracyCircle);
    locationMarker=L.circleMarker([lat,lng],{radius:8,color:"#1565c0",fillColor:"#42a5f5",fillOpacity:.9,weight:3}).addTo(map).bindPopup("📍 Your current location").openPopup();
    accuracyCircle=L.circle([lat,lng],{radius:pos.coords.accuracy||30,color:"#1565c0",weight:1,fillOpacity:.08}).addTo(map);
    map.setView([lat,lng],17);
    updateStatus(lat,lng,"Your current location");
  },err=>{
    console.error(err);
    document.getElementById("locationStatus").textContent="Location permission was not available. Click the map to choose a report location.";
    alert("We could not access your current location. Please allow location access, or click the map to select the report location.");
  },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}

map.on("click",e=>setSelectedLocation(e.latlng.lat,e.latlng.lng,"Selected report location"));

document.getElementById("locateBtn").addEventListener("click",locateUser);

// ---------------------- GOOGLE FORM -----------------------------
function buildPrefilledFormUrl(){
  if(!currentLocation) return FORM_VIEW_URL;
  const latDms=dmsString(currentLocation.lat,"N","S");
  const lngDms=dmsString(currentLocation.lng,"E","W");
  const params=new URLSearchParams();
  params.set("usp","pp_url");
  params.set(`entry.${FORM_ENTRY_LONGITUDE}`,lngDms);
  params.set(`entry.${FORM_ENTRY_LATITUDE}`,latDms);
  return `${FORM_VIEW_URL}?${params.toString()}`;
}

const modal=document.getElementById("reportModal");
const formFrame=document.getElementById("formFrame");
let activeFormUrl=FORM_VIEW_URL;

function openReportForm(){
  if(!currentLocation){
    locateUser();
    setTimeout(()=>{
      if(currentLocation) openReportForm();
      else alert("Please allow location access or click the map to select the place you want to report.");
    },1200);
    return;
  }
  activeFormUrl=buildPrefilledFormUrl();
  formFrame.src=activeFormUrl;
  modal.classList.remove("hidden");
}

document.getElementById("reportBtn").addEventListener("click",openReportForm);
document.getElementById("closeModal").addEventListener("click",()=>{modal.classList.add("hidden");formFrame.src="about:blank";loadComplaintReports();});
document.getElementById("openFormBtn").addEventListener("click",()=>window.open(activeFormUrl,"_blank","noopener"));
document.getElementById("refreshReportsBtn").addEventListener("click",loadComplaintReports);
modal.addEventListener("click",e=>{if(e.target===modal){modal.classList.add("hidden");formFrame.src="about:blank";loadComplaintReports();}});

// ---------------------- LEGEND / COUNTER ------------------------
const baseMaps={"🗺️ OpenStreetMap":osm,"🛰️ Satellite":satellite};
const overlays={
  "🟥 Western Province":westernProvince,
  "🛣️ Roads":roads,
  "🚆 Railway":railway,
  "🚉 Railway Stations":railwayStations,
  "🚌 Bus Stops":busStops,
  "🏫 Schools":schools,
  "🏥 Hospitals":hospitals,
  "🅿️ Parking":parking,
  "🚦 Traffic Lights":trafficLights,
  "🚸 Pedestrian Crossings":pedestrianCrossings,
  "🚨 Safety Complaints":complaintLayer
};
L.control.layers(baseMaps,overlays,{collapsed:false}).addTo(map);

// Small report count badge.
const countControl=L.control({position:"topright"});
countControl.onAdd=function(){
  const div=L.DomUtil.create("div","leaflet-control leaflet-bar");
  div.style.background="#fff"; div.style.padding="7px 10px"; div.style.fontSize="12px"; div.style.fontWeight="700";
  div.innerHTML='Reports: <span id="reportCount">—</span>';
  L.DomEvent.disableClickPropagation(div);
  return div;
};
countControl.addTo(map);

// Load existing complaints if a response sheet is configured.
loadComplaintReports();
setInterval(loadComplaintReports,REPORT_REFRESH_MS);
