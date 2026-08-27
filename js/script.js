/* =========================================================
   SAFEWALK
   PUBLIC PEDESTRIAN SAFETY & COMPLAINT WEB MAP
   WESTERN PROVINCE
========================================================= */


/* =========================================================
   1. GOOGLE FORM SETTINGS
========================================================= */

const GOOGLE_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdgncnCOESnZJ2IJYGJAc-TssjL8kB_oAfr15CEbLBS63tLDQ/viewform";

const LONGITUDE_ENTRY =
    "entry.756715849";

const LATITUDE_ENTRY =
    "entry.1288249379";


/* =========================================================
   2. GOOGLE SHEET SETTINGS
========================================================= */

const SHEET_ID =
    "185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";


const SHEET_GID =
    "1834860223";


const SHEET_CSV_URL =
    `https://docs.google.com/spreadsheets/d/185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48/edit?resourcekey=&gid=1834860223#gid=1834860223`;


/* =========================================================
   3. MAP INITIALIZATION
========================================================= */

const map = L.map("map", {

    center: [6.9271, 80.7789],

    zoom: 10,

    zoomControl: true

});


/* =========================================================
   4. BASE MAPS
========================================================= */

const osm = L.tileLayer(

    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",

    {

        maxZoom: 20,

        attribution:
            '&copy; OpenStreetMap contributors'

    }

);


const satellite = L.tileLayer(

    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",

    {

        maxZoom: 20,

        attribution:
            "Tiles &copy; Esri"

    }

);


/* OSM DEFAULT */

osm.addTo(map);


/* =========================================================
   5. LAYER GROUPS
========================================================= */

const westernProvinceLayer =
    L.layerGroup();

const roadsLayer =
    L.layerGroup();

const railwayLayer =
    L.layerGroup();

const railwayStationsLayer =
    L.layerGroup();

const busStopsLayer =
    L.layerGroup();

const schoolsLayer =
    L.layerGroup();

const hospitalsLayer =
    L.layerGroup();

const parkingLayer =
    L.layerGroup();

const trafficLightsLayer =
    L.layerGroup();

const pedestrianCrossingsLayer =
    L.layerGroup();

const complaintsLayer =
    L.layerGroup();


/* =========================================================
   6. GEOJSON FILE PATHS
========================================================= */

const DATA_PATH =
    "data/";


const files = {

    westernProvince:
        DATA_PATH + "western_province.geojson",

    roads:
        DATA_PATH + "roads.geojson",

    railway:
        DATA_PATH + "railway.geojson",

    railwayStations:
        DATA_PATH + "railway_stations.geojson",

    busStops:
        DATA_PATH + "busstops.geojson",

    schools:
        DATA_PATH + "schools.geojson",

    hospitals:
        DATA_PATH + "hospitals.geojson",

    parking:
        DATA_PATH + "parking.geojson",

    trafficLights:
        DATA_PATH + "traffic_lights.geojson",

    pedestrianCrossings:
        DATA_PATH + "pedestrian_crossings.geojson"

};


/* =========================================================
   7. GENERAL POPUP FUNCTION
========================================================= */

function createPopup(feature) {

    const properties =
        feature.properties || {};

    let html =
        "<div style='min-width:180px;'>";

    let found = false;


    Object.keys(properties).forEach(
        function (key) {

            const value =
                properties[key];

            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                found = true;

                html +=
                    `<b>${formatFieldName(key)}:</b> ${value}<br>`;

            }

        }
    );


    if (!found) {

        html +=
            "<b>Information:</b> No additional information";

    }


    html += "</div>";

    return html;

}


/* =========================================================
   8. FIELD NAME FORMATTER
========================================================= */

function formatFieldName(name) {

    return String(name)

        .replace(/_/g, " ")

        .replace(/\b\w/g,
            function (letter) {

                return letter.toUpperCase();

            });

}


/* =========================================================
   9. LOAD WESTERN PROVINCE
========================================================= */

fetch(files.westernProvince)

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Western Province GeoJSON could not be loaded."
            );

        }

        return response.json();

    })

    .then(data => {

        const layer =
            L.geoJSON(
                data,
                {

                    style: {

                        color: "#d62828",

                        weight: 3,

                        fillColor: "#ffffff",

                        fillOpacity: 0.05

                    },

                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {

                            layer.bindPopup(
                                `
                                <div>
                                    <h3 style="margin-top:0;">
                                        🗺️ Western Province
                                    </h3>

                                    <b>Province:</b>
                                    Western Province
                                    <br>

                                    <b>Country:</b>
                                    Sri Lanka
                                </div>
                                `
                            );

                        }

                }
            );


        westernProvinceLayer
            .addLayer(layer);


        westernProvinceLayer
            .addTo(map);


        /* Automatically zoom to province */

        try {

            map.fitBounds(
                layer.getBounds(),
                {
                    padding: [20, 20]
                }
            );

        } catch (error) {

            console.log(
                "Could not fit Western Province bounds."
            );

        }

    })

    .catch(error => {

        console.error(error);

    });


/* =========================================================
   10. GENERIC GEOJSON LOADER
========================================================= */

function loadGeoJSON(

    url,

    targetLayer,

    options

) {

    fetch(url)

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Could not load " + url
                );

            }

            return response.json();

        })

        .then(data => {

            const layer =
                L.geoJSON(
                    data,
                    options
                );

            targetLayer.addLayer(layer);

        })

        .catch(error => {

            console.error(error);

        });

}


/* =========================================================
   11. ROADS
   DEFAULT OFF
========================================================= */

loadGeoJSON(

    files.roads,

    roadsLayer,

    {

        style: {

            color: "#555555",

            weight: 2,

            opacity: 0.75

        },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   12. RAILWAY
========================================================= */

loadGeoJSON(

    files.railway,

    railwayLayer,

    {

        style: {

            color: "#7b2cbf",

            weight: 3,

            opacity: 0.9

        },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   13. RAILWAY STATIONS
========================================================= */

loadGeoJSON(

    files.railwayStations,

    railwayStationsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#6f42c1",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   14. BUS STOPS
========================================================= */

loadGeoJSON(

    files.busStops,

    busStopsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#1d70a2",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   15. SCHOOLS
========================================================= */

loadGeoJSON(

    files.schools,

    schoolsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#f4a261",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   16. HOSPITALS
========================================================= */

loadGeoJSON(

    files.hospitals,

    hospitalsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#e63946",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   17. PARKING
========================================================= */

loadGeoJSON(

    files.parking,

    parkingLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#264653",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   18. TRAFFIC LIGHTS
========================================================= */

loadGeoJSON(

    files.trafficLights,

    trafficLightsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#ff0000",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   19. PEDESTRIAN CROSSINGS
========================================================= */

loadGeoJSON(

    files.pedestrianCrossings,

    pedestrianCrossingsLayer,

    {

        pointToLayer:

            function (
                feature,
                latlng
            ) {

                return L.circleMarker(

                    latlng,

                    {

                        radius: 6,

                        fillColor: "#ff69b4",

                        color: "#ffffff",

                        weight: 1.5,

                        fillOpacity: 0.9

                    }

                );

            },

        onEachFeature:

            function (
                feature,
                layer
            ) {

                layer.bindPopup(
                    createPopup(feature)
                );

            }

    }

);


/* =========================================================
   20. LAYER CONTROL
========================================================= */

const baseMaps = {

    "🗺️ OpenStreetMap": osm,

    "🛰️ Satellite": satellite

};


const overlayMaps = {

    "🟥 Western Province": westernProvinceLayer,

    "🛣️ Roads": roadsLayer,

    "🚆 Railway": railwayLayer,

    "🚉 Railway Stations": railwayStationsLayer,

    "🚌 Bus Stops": busStopsLayer,

    "🏫 Schools": schoolsLayer,

    "🏥 Hospitals": hospitalsLayer,

    "🅿️ Parking": parkingLayer,

    "🚦 Traffic Lights": trafficLightsLayer,

    "🚶 Pedestrian Crossings":
        pedestrianCrossingsLayer,

    "🚨 Safety Complaints":
        complaintsLayer

};


L.control.layers(

    baseMaps,

    overlayMaps,

    {

        collapsed: false,

        position: "topright"

    }

).addTo(map);


/* =========================================================
   21. CURRENT LOCATION
========================================================= */

let currentLocationMarker =
    null;

let selectedReportLocation =
    null;


document
    .getElementById("locationBtn")
    .addEventListener(
        "click",
        function () {

            if (!navigator.geolocation) {

                alert(
                    "Geolocation is not supported by your browser."
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const lat =
                        position.coords.latitude;

                    const lng =
                        position.coords.longitude;


                    selectedReportLocation = {

                        lat: lat,

                        lng: lng

                    };


                    /* Remove old location */

                    if (
                        currentLocationMarker
                    ) {

                        map.removeLayer(
                            currentLocationMarker
                        );

                    }


                    /* Add new marker */

                    currentLocationMarker =
                        L.marker(
                            [lat, lng]
                        )
                        .addTo(map);


                    currentLocationMarker
                        .bindPopup(
                            `
                            <b>📍 Your Current Location</b>
                            <br><br>
                            Latitude:
                            ${lat.toFixed(6)}
                            <br>
                            Longitude:
                            ${lng.toFixed(6)}
                            `
                        )
                        .openPopup();


                    map.setView(

                        [lat, lng],

                        16

                    );


                    updateLocationInfo(

                        lat,

                        lng

                    );

                },


                function (error) {

                    alert(
                        "Unable to get your location. Please allow location access in your browser."
                    );

                    console.error(error);

                },

                {

                    enableHighAccuracy: true,

                    timeout: 10000,

                    maximumAge: 0

                }

            );

        }
    );


/* =========================================================
   22. CLICK ANYWHERE TO SELECT REPORT LOCATION
========================================================= */

map.on(

    "click",

    function (event) {

        const lat =
            event.latlng.lat;

        const lng =
            event.latlng.lng;


        /* Save selected location */

        selectedReportLocation = {

            lat: lat,

            lng: lng

        };


        updateLocationInfo(

            lat,

            lng

        );

    }

);


/* =========================================================
   23. UPDATE LOCATION DISPLAY
========================================================= */

function updateLocationInfo(

    lat,

    lng

) {

    const locationInfo =
        document.getElementById(
            "locationInfo"
        );


    locationInfo.innerHTML =

        `📌 Selected location — 
        ${lat.toFixed(6)}, 
        ${lng.toFixed(6)}`;

}


/* =========================================================
   24. REPORT BUTTON
========================================================= */

document
    .getElementById("reportBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !selectedReportLocation
            ) {

                alert(
                    "Please click the location you want to report on the map first."
                );

                return;

            }


            const lat =
                selectedReportLocation.lat;

            const lng =
                selectedReportLocation.lng;


            /*
               Google Form pre-filled URL

               Latitude:
               entry.1288249379

               Longitude:
               entry.756715849
            */

            const formURL =

                GOOGLE_FORM_URL +

                "?usp=pp_url" +

                "&" +

                LATITUDE_ENTRY +

                "=" +

                encodeURIComponent(
                    lat.toFixed(6)
                ) +

                "&" +

                LONGITUDE_ENTRY +

                "=" +

                encodeURIComponent(
                    lng.toFixed(6)
                );


            /*
               Open Google Form in new tab.
            */

            window.open(

                formURL,

                "_blank"

            );

        }

    );


/* =========================================================
   25. LOAD GOOGLE SHEET REPORTS
========================================================= */

loadReports();


/* =========================================================
   26. LOAD REPORT DATA
========================================================= */

function loadReports() {

    fetch(
        SHEET_CSV_URL
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Google Sheet could not be accessed."
                );

            }

            return response.text();

        })

        .then(csvText => {

            const rows =
                parseCSV(csvText);


            if (
                rows.length < 2
            ) {

                console.log(
                    "No complaint reports found."
                );

                updateSummary([]);

                return;

            }


            const headers =
                rows[0].map(

                    h =>
                        normalizeHeader(h)

                );


            const reports = [];


            for (
                let i = 1;
                i < rows.length;
                i++
            ) {

                const row =
                    rows[i];


                if (
                    row.length === 0
                ) {

                    continue;

                }


                const report = {};


                headers.forEach(

                    function (
                        header,
                        index
                    ) {

                        report[header] =
                            row[index] || "";

                    }

                );


                reports.push(report);

            }


            displayReports(
                reports
            );


            updateSummary(
                reports
            );

        })

        .catch(error => {

            console.error(
                "Report loading error:",
                error
            );

            document
                .getElementById(
                    "issueCounts"
                )
                .innerHTML =

                `
                <div class="loading">
                    Reports unavailable
                </div>
                `;

        });

}


/* =========================================================
   27. NORMALIZE GOOGLE SHEET HEADERS
========================================================= */

function normalizeHeader(header) {

    return String(header)

        .toLowerCase()

        .trim()

        .replace(/\s+/g, " ")

        .replace(/_/g, " ");

}


/* =========================================================
   28. FIND FIELD
========================================================= */

function getField(
    report,
    possibleNames
) {

    for (
        const name of possibleNames
    ) {

        const key =
            normalizeHeader(name);


        if (
            report[key] !== undefined &&
            report[key] !== ""
        ) {

            return report[key];

        }

    }


    return "";

}


/* =========================================================
   29. DISPLAY REPORTS ON MAP
========================================================= */

function displayReports(
    reports
) {

    complaintsLayer.clearLayers();


    reports.forEach(

        function (report) {

            const latitude =
                getField(
                    report,
                    [
                        "latitude",
                        "lat"
                    ]
                );


            const longitude =
                getField(
                    report,
                    [
                        "longitude",
                        "lng",
                        "lon"
                    ]
                );


            if (
                latitude === "" ||
                longitude === ""
            ) {

                return;

            }


            const lat =
                parseCoordinate(
                    latitude
                );


            const lng =
                parseCoordinate(
                    longitude
                );


            if (
                isNaN(lat) ||
                isNaN(lng)
            ) {

                return;

            }


            const issue =
                getField(
                    report,
                    [
                        "issue type",
                        "issue",
                        "problem type"
                    ]
                );


            const severity =
                getField(
                    report,
                    [
                        "severity level",
                        "severity"
                    ]
                );


            const date =
                getField(
                    report,
                    [
                        "date observed",
                        "date",
                        "timestamp"
                    ]
                );


            const description =
                getField(
                    report,
                    [
                        "description of the problem",
                        "description",
                        "problem description"
                    ]
                );


            const photo =
                getField(
                    report,
                    [
                        "evidence (upload a photo)",
                        "evidence",
                        "photo",
                        "image"
                    ]
                );


            const markerColor =
                getSeverityColor(
                    severity
                );


            const marker =
                L.circleMarker(

                    [lat, lng],

                    {

                        radius: 9,

                        fillColor:
                            markerColor,

                        color: "#ffffff",

                        weight: 2,

                        fillOpacity: 0.9

                    }

                );


            let popup =

                `
                <div style="
                    min-width:230px;
                    max-width:300px;
                ">

                    <h3 style="
                        margin-top:0;
                        margin-bottom:10px;
                    ">
                        🚨 Safety Report
                    </h3>

                    <b>Issue:</b>
                    ${escapeHTML(issue || "Not specified")}
                    <br>

                    <b>Severity:</b>
                    ${escapeHTML(severity || "Not specified")}
                    <br>

                    <b>Date:</b>
                    ${escapeHTML(date || "Not specified")}
                    <br><br>

                    <b>Description:</b>
                    <br>

                    ${escapeHTML(
                        description ||
                        "No description provided."
                    )}
                `;


            if (
                photo &&
                String(photo).startsWith("http")
            ) {

                popup +=

                    `
                    <br><br>

                    <a
                        href="${photo}"
                        target="_blank"
                        rel="noopener"
                    >
                        📷 View Evidence
                    </a>
                    `;

            }


            popup +=
                "</div>";


            marker.bindPopup(
                popup
            );


            complaintsLayer
                .addLayer(marker);

        }

    );


    /*
       Automatically show complaints
       on the map.
    */

    if (
        complaintsLayer
            .getLayers()
            .length > 0
    ) {

        complaintsLayer
            .addTo(map);

    }

}


/* =========================================================
   30. SEVERITY COLOR
========================================================= */

function getSeverityColor(
    severity
) {

    const value =
        String(severity)
            .toLowerCase()
            .trim();


    if (
        value.includes("severe") ||
        value.includes("high")
    ) {

        return "#d92d2d";

    }


    if (
        value.includes("medium")
    ) {

        return "#ff8c00";

    }


    return "#2e8b57";

}


/* =========================================================
   31. UPDATE REPORT SUMMARY
========================================================= */

function updateSummary(
    reports
) {

    const totalReports =
        document.getElementById(
            "totalReports"
        );


    totalReports.textContent =
        reports.length;


    let low = 0;

    let medium = 0;

    let severe = 0;


    const issueCounts = {};


    reports.forEach(

        function (report) {

            const severity =
                getField(
                    report,
                    [
                        "severity level",
                        "severity"
                    ]
                )
                .toLowerCase()
                .trim();


            if (
                severity.includes("low")
            ) {

                low++;

            }

            else if (
                severity.includes("medium")
            ) {

                medium++;

            }

            else if (
                severity.includes("severe") ||
                severity.includes("high")
            ) {

                severe++;

            }


            const issue =
                getField(
                    report,
                    [
                        "issue type",
                        "issue",
                        "problem type"
                    ]
                );


            if (issue) {

                issueCounts[issue] =
                    (
                        issueCounts[issue] ||
                        0
                    ) + 1;

            }

        }

    );


    document
        .getElementById(
            "lowCount"
        )
        .textContent = low;


    document
        .getElementById(
            "mediumCount"
        )
        .textContent = medium;


    document
        .getElementById(
            "severeCount"
        )
        .textContent = severe;


    displayIssueCounts(
        issueCounts
    );

}


/* =========================================================
   32. DISPLAY ISSUE COUNTS
========================================================= */

function displayIssueCounts(
    issueCounts
) {

    const container =
        document.getElementById(
            "issueCounts"
        );


    container.innerHTML = "";


    const issues =
        Object.entries(
            issueCounts
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        );


    if (
        issues.length === 0
    ) {

        container.innerHTML =

            `
            <div class="loading">
                No reports yet
            </div>
            `;

        return;

    }


    issues.forEach(

        function (
            [issue, count]
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "issue-row";


            const left =
                document.createElement(
                    "div"
                );


            left.className =
                "issue-left";


            const icon =
                document.createElement(
                    "span"
                );


            icon.className =
                "issue-icon";


            icon.textContent =
                getIssueIcon(issue);


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "issue-name";


            name.textContent =
                issue;


            const number =
                document.createElement(
                    "span"
                );


            number.className =
                "issue-number";


            number.textContent =
                count;


            left.appendChild(
                icon
            );


            left.appendChild(
                name
            );


            row.appendChild(
                left
            );


            row.appendChild(
                number
            );


            container.appendChild(
                row
            );

        }

    );

}


/* =========================================================
   33. ISSUE ICONS
========================================================= */

function getIssueIcon(
    issue
) {

    const text =
        String(issue)
            .toLowerCase();


    if (
        text.includes("sidewalk")
    ) {

        return "🚶";

    }


    if (
        text.includes("cross")
    ) {

        return "🚸";

    }


    if (
        text.includes("lighting") ||
        text.includes("light")
    ) {

        return "💡";

    }


    if (
        text.includes("flood")
    ) {

        return "🌊";

    }


    if (
        text.includes("construction")
    ) {

        return "🚧";

    }


    if (
        text.includes("parking")
    ) {

        return "🚗";

    }


    if (
        text.includes("drain")
    ) {

        return "⚠️";

    }


    if (
        text.includes("access")
    ) {

        return "♿";

    }


    return "📍";

}


/* =========================================================
   34. PARSE CSV
========================================================= */

function parseCSV(
    text
) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const character =
            text[i];


        const nextCharacter =
            text[i + 1];


        if (
            character === '"' &&
            insideQuotes &&
            nextCharacter === '"'
        ) {

            value += '"';

            i++;

        }

        else if (
            character === '"'
        ) {

            insideQuotes =
                !insideQuotes;

        }

        else if (
            character === "," &&
            !insideQuotes
        ) {

            row.push(
                value
            );

            value = "";

        }

        else if (
            (
                character === "\n" ||
                character === "\r"
            ) &&
            !insideQuotes
        ) {

            if (
                character === "\r" &&
                nextCharacter === "\n"
            ) {

                i++;

            }


            row.push(
                value
            );


            if (
                row.some(
                    cell =>
                        cell.trim() !== ""
                )
            ) {

                rows.push(
                    row
                );

            }


            row = [];

            value = "";

        }

        else {

            value +=
                character;

        }

    }


    if (
        value !== "" ||
        row.length > 0
    ) {

        row.push(
            value
        );


        rows.push(
            row
        );

    }


    return rows;

}


/* =========================================================
   35. COORDINATE PARSER
========================================================= */

function parseCoordinate(
    value
) {

    if (
        typeof value === "number"
    ) {

        return value;

    }


    const text =
        String(value)
            .trim();


    /*
       Normal decimal coordinate
    */

    const decimal =
        parseFloat(text);


    if (
        !isNaN(decimal) &&
        !/[°'"]/.test(text)
    ) {

        return decimal;

    }


    /*
       DMS coordinate
       Example:
       6°47'41.6"N
       79°54'05.2"E
    */

    const match =
        text.match(

            /(\d+)[°:\s]+(\d+)[′':\s]+([\d.]+)[″"\s]*([NSEW])?/i

        );


    if (!match) {

        return NaN;

    }


    const degrees =
        parseFloat(
            match[1]
        );


    const minutes =
        parseFloat(
            match[2]
        );


    const seconds =
        parseFloat(
            match[3]
        );


    let result =

        degrees +

        minutes / 60 +

        seconds / 3600;


    const direction =
        match[4];


    if (
        direction &&
        (
            direction.toUpperCase() === "S" ||
            direction.toUpperCase() === "W"
        )
    ) {

        result =
            -result;

    }


    return result;

}


/* =========================================================
   36. ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   37. REFRESH REPORTS
========================================================= */

setInterval(

    function () {

        loadReports();

    },

    60000

);
