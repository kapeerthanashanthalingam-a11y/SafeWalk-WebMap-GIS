/* =========================================================
   SAFEWALK
   PUBLIC PEDESTRIAN SAFETY & COMPLAINT WEB MAP
   WESTERN PROVINCE - SRI LANKA
   ========================================================= */


/* =========================================================
   1. GOOGLE FORM SETTINGS
   ========================================================= */

const GOOGLE_FORM_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdgncnCOESnZJ2IJYGJAc-TssjL8kB_oAfr15CEbLBS63tLDQ/viewform";


/*
   Your Google Form entry IDs obtained from the form.
*/

const FORM_ENTRIES = {

    issue:
        "entry.1863083057",

    longitude:
        "entry.756715849",

    severity:
        "entry.302271118",

    description:
        "entry.507806241",

    latitude:
        "entry.128829379",

    date:
        "entry.2123383240"

};


/* =========================================================
   2. GOOGLE SHEET
   ========================================================= */

const GOOGLE_SHEET_ID =
    "185KFCSkrNdNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";


/*
   IMPORTANT:
   Use the exact spreadsheet ID supplied by you.

   If your actual ID is:

   185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48

   then the value should be:
*/

const SHEET_ID =
    "185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";


const SHEET_GID =
    "1834860223";


/*
   Google Visualization API URL.

   It reads the responses from the sheet.
*/

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/" +
    SHEET_ID +
    "/gviz/tq?tqx=out:json&gid=" +
    SHEET_GID;


/* =========================================================
   3. GLOBAL VARIABLES
   ========================================================= */

let map;

let westernProvince;

let westernLayer;

let selectedMarker = null;

let currentLocationMarker = null;

let selectedLat = null;

let selectedLng = null;

let reportLayerGroup;

let reports = [];


/* =========================================================
   4. BASE MAPS
   ========================================================= */

const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; OpenStreetMap contributors'
    }
);


const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19,

        attribution:
            "Tiles &copy; Esri"
    }
);


/* =========================================================
   5. INITIALIZE MAP
   ========================================================= */

map = L.map("map", {

    center: [6.9271, 79.8612],

    zoom: 11,

    layers: [osm],

    zoomControl: true

});


/* =========================================================
   6. REPORT LAYER
   ========================================================= */

reportLayerGroup = L.markerClusterGroup({

    showCoverageOnHover: false,

    spiderfyOnMaxZoom: true,

    disableClusteringAtZoom: 16

});


map.addLayer(reportLayerGroup);


/* =========================================================
   7. BASE MAP CONTROL
   ========================================================= */

const baseMaps = {

    "🗺️ OpenStreetMap": osm,

    "🛰️ Satellite": satellite

};


/* =========================================================
   8. OVERLAY OBJECT
   ========================================================= */

const overlayMaps = {};


/* =========================================================
   9. LOAD WESTERN PROVINCE
   ========================================================= */

fetch("data/western_province.geojson")

    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Western Province GeoJSON could not be loaded."
            );

        }

        return response.json();

    })

    .then(data => {

        westernProvince = data;


        westernLayer = L.geoJSON(
            data,
            {

                style: {

                    color: "#d62828",

                    weight: 3,

                    opacity: 1,

                    fillColor: "#f8d7da",

                    fillOpacity: 0.12

                },

                onEachFeature:
                    westernFeaturePopup

            }
        ).addTo(map);


        overlayMaps["🟥 Western Province"] =
            westernLayer;


        /*
           Fit map to Western Province.
        */

        map.fitBounds(
            westernLayer.getBounds(),
            {
                padding: [40, 40]
            }
        );


        /*
           Enable click selection.
        */

        map.on(
            "click",
            handleMapClick
        );


        /*
           Load other GIS layers.
        */

        loadGISLayers();


        /*
           Load Google Form reports.
        */

        loadReports();

    })

    .catch(error => {

        console.error(error);

        showStatus(
            "Error loading Western Province layer."
        );

    });


/* =========================================================
   10. WESTERN PROVINCE POPUP
   ========================================================= */

function westernFeaturePopup(
    feature,
    layer
) {

    const province =
        feature.properties?.ADM1_EN ||
        "Western Province";


    const country =
        feature.properties?.ADM0_EN ||
        "Sri Lanka";


    layer.bindPopup(

        `
        <div style="
            min-width:200px;
            font-family:Arial;
        ">

            <h3 style="
                margin:0 0 8px;
                color:#333;
            ">
                🟥 ${province}
            </h3>

            <b>Province:</b>
            ${province}

            <br>

            <b>Country:</b>
            ${country}

        </div>
        `

    );

}


/* =========================================================
   11. MAP CLICK
   ========================================================= */

function handleMapClick(e) {

    if (!westernProvince) {

        return;
    }


    const point =
        turf.point([
            e.latlng.lng,
            e.latlng.lat
        ]);


    /*
       Check whether clicked location
       is inside Western Province.
    */

    let inside = false;


    westernProvince.features.forEach(
        feature => {

            try {

                if (
                    turf.booleanPointInPolygon(
                        point,
                        feature
                    )
                ) {

                    inside = true;

                }

            } catch (error) {

                console.error(
                    "Boundary check error:",
                    error
                );

            }

        }
    );


    if (!inside) {

        alert(
            "Please select a location inside Western Province."
        );

        return;
    }


    selectReportingLocation(
        e.latlng.lat,
        e.latlng.lng,
        "Selected location"
    );

}


/* =========================================================
   12. SELECT REPORT LOCATION
   ========================================================= */

function selectReportingLocation(
    lat,
    lng,
    label
) {

    selectedLat = lat;

    selectedLng = lng;


    /*
       Remove old selected marker.
    */

    if (selectedMarker) {

        map.removeLayer(
            selectedMarker
        );

    }


    /*
       Create new selected marker.
    */

    const selectedIcon =
        L.divIcon({

            className: "",

            html:
                '<div class="selected-marker"></div>',

            iconSize: [22, 22],

            iconAnchor: [11, 11],

            popupAnchor: [0, -11]

        });


    selectedMarker =
        L.marker(
            [lat, lng],
            {
                icon: selectedIcon
            }
        ).addTo(map);


    selectedMarker.bindPopup(

        `
        <div style="font-family:Arial">

            <b>📍 ${label}</b>

            <br><br>

            <b>Latitude:</b>
            ${lat.toFixed(6)}

            <br>

            <b>Longitude:</b>
            ${lng.toFixed(6)}

            <br><br>

            Click
            <b>Report an Issue</b>
            to submit a complaint.

        </div>
        `

    ).openPopup();


    /*
       Update location panel.
    */

    document
        .getElementById(
            "selectedCoordinates"
        )
        .innerHTML =

        `
        Latitude:
        <b>${lat.toFixed(6)}</b>
        <br>
        Longitude:
        <b>${lng.toFixed(6)}</b>
        `;


    document
        .getElementById(
            "selectedLocation"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "locationMessage"
        )
        .innerHTML =
        "📍 Location selected. Click <b>Report an Issue</b> to continue.";


    /*
       Zoom to selected location.
    */

    map.setView(
        [lat, lng],
        Math.max(
            map.getZoom(),
            14
        )
    );

}


/* =========================================================
   13. MY LOCATION BUTTON
   ========================================================= */

document
    .getElementById(
        "locationBtn"
    )
    .addEventListener(
        "click",
        getCurrentLocation
    );


function getCurrentLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;
    }


    document
        .getElementById(
            "locationMessage"
        )
        .innerHTML =
        "📍 Getting your current location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            const lat =
                position.coords.latitude;

            const lng =
                position.coords.longitude;


            /*
               Remove old current location marker.
            */

            if (currentLocationMarker) {

                map.removeLayer(
                    currentLocationMarker
                );

            }


            const currentIcon =
                L.divIcon({

                    className: "",

                    html:
                        '<div class="current-location-marker"></div>',

                    iconSize: [18, 18],

                    iconAnchor: [9, 9]

                });


            currentLocationMarker =
                L.marker(
                    [lat, lng],
                    {
                        icon: currentIcon
                    }
                ).addTo(map);


            currentLocationMarker.bindPopup(
                `
                <b>📍 Your Current Location</b>
                <br><br>
                Latitude:
                ${lat.toFixed(6)}
                <br>
                Longitude:
                ${lng.toFixed(6)}
                `
            );


            /*
               Check if current location is inside
               Western Province.
            */

            let inside = false;


            if (westernProvince) {

                const point =
                    turf.point([
                        lng,
                        lat
                    ]);


                westernProvince.features.forEach(
                    feature => {

                        if (
                            turf.booleanPointInPolygon(
                                point,
                                feature
                            )
                        ) {

                            inside = true;

                        }

                    }
                );

            }


            if (inside) {

                selectReportingLocation(
                    lat,
                    lng,
                    "Your current location"
                );

                currentLocationMarker
                    .openPopup();

                document
                    .getElementById(
                        "locationMessage"
                    )
                    .innerHTML =
                    "📍 Your current location has been selected. You can report this location or click another location on the map.";

            } else {

                map.setView(
                    [lat, lng],
                    15
                );

                document
                    .getElementById(
                        "locationMessage"
                    )
                    .innerHTML =
                    "⚠️ Your current location is outside Western Province. Click a location inside the red boundary to report.";

            }

        },

        error => {

            console.error(error);

            document
                .getElementById(
                    "locationMessage"
                )
                .innerHTML =
                "⚠️ Location permission was not provided.";

            alert(
                "Please allow location access in your browser."
            );

        },

        {

            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 0

        }

    );

}


/* =========================================================
   14. REPORT BUTTON
   ========================================================= */

document
    .getElementById(
        "reportBtn"
    )
    .addEventListener(
        "click",
        openReportForm
    );


function openReportForm() {

    /*
       User must select a location.
    */

    if (
        selectedLat === null ||
        selectedLng === null
    ) {

        alert(
            "Please click a location inside Western Province first."
        );

        return;
    }


    /*
       Current date.
    */

    const today =
        new Date();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const year =
        today.getFullYear();


    /*
       Build prefilled Google Form URL.
    */

    const formURL =
        GOOGLE_FORM_URL +

        "?usp=pp_url" +

        "&" +
        FORM_ENTRIES.longitude +
        "=" +
        encodeURIComponent(
            selectedLng.toFixed(6)
        ) +

        "&" +
        FORM_ENTRIES.latitude +
        "=" +
        encodeURIComponent(
            selectedLat.toFixed(6)
        ) +

        "&" +
        FORM_ENTRIES.date +
        "=" +
        encodeURIComponent(
            month +
            "/" +
            day +
            "/" +
            year
        );


    /*
       Open form in new tab.
    */

    window.open(
        formURL,
        "_blank"
    );

}


/* =========================================================
   15. LOAD GIS LAYERS
   ========================================================= */

function loadGISLayers() {


    /*
       ROAD NETWORK
       DEFAULT = OFF
    */

    loadGeoJSONLayer(
        "data/roads.geojson",

        "🛣️ Roads",

        {

            color: "#555",

            weight: 2,

            opacity: 0.8

        },

        false
    );


    /*
       TRAFFIC LIGHTS
    */

    loadGeoJSONLayer(
        "data/traffic_lights.geojson",

        "🚦 Traffic Lights",

        null,

        true
    );


    /*
       SCHOOLS
    */

    loadGeoJSONLayer(
        "data/schools.geojson",

        "🏫 Schools",

        null,

        true
    );


    /*
       RAILWAY STATIONS
    */

    loadGeoJSONLayer(
        "data/railway_stations.geojson",

        "🚉 Railway Stations",

        null,

        true
    );


    /*
       RAILWAY
    */

    loadGeoJSONLayer(
        "data/railway.geojson",

        "🚆 Railway",

        {

            color: "#7b2cbf",

            weight: 3,

            opacity: 0.8

        },

        true
    );


    /*
       PARKING
    */

    loadGeoJSONLayer(
        "data/parking.geojson",

        "🅿️ Parking",

        null,

        true
    );


    /*
       HOSPITALS
    */

    loadGeoJSONLayer(
        "data/hospitals.geojson",

        "🏥 Hospitals",

        null,

        true
    );


    /*
       BUS STOPS
    */

    loadGeoJSONLayer(
        "data/busstops.geojson",

        "🚌 Bus Stops",

        null,

        true
    );


    /*
       PEDESTRIAN CROSSINGS
    */

    loadGeoJSONLayer(
        "data/pedestrian_crossings.geojson",

        "🚸 Pedestrian Crossings",

        {

            color: "#ff9800",

            weight: 4

        },

        true
    );

}


/* =========================================================
   16. GENERIC GEOJSON LOADER
   ========================================================= */

function loadGeoJSONLayer(
    file,
    layerName,
    customStyle,
    defaultVisible
) {

    fetch(file)

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    file +
                    " not found."
                );

            }

            return response.json();

        })

        .then(data => {

            const layer =
                L.geoJSON(
                    data,
                    {

                        style:
                            customStyle ||
                            defaultLineStyle,

                        pointToLayer:
                            createPointMarker,

                        onEachFeature:
                            genericFeaturePopup

                    }
                );


            /*
               Add to map only when
               defaultVisible = true.
            */

            if (defaultVisible) {

                layer.addTo(map);

            }


            overlayMaps[layerName] =
                layer;


            /*
               Recreate layer control
               after loading.
            */

            updateLayerControl();

        })

        .catch(error => {

            console.warn(
                "Layer not loaded:",
                file
            );

        });

}


/* =========================================================
   17. DEFAULT LINE STYLE
   ========================================================= */

function defaultLineStyle() {

    return {

        color: "#3388ff",

        weight: 2,

        opacity: 0.8

    };

}


/* =========================================================
   18. POINT MARKER
   ========================================================= */

function createPointMarker(
    feature,
    latlng
) {

    const properties =
        feature.properties || {};


    /*
       Determine layer type from
       common OSM attributes.
    */

    let icon =
        "📍";


    const text =
        JSON.stringify(
            properties
        ).toLowerCase();


    if (
        text.includes("school")
    ) {

        icon = "🏫";

    }

    else if (
        text.includes("hospital")
    ) {

        icon = "🏥";

    }

    else if (
        text.includes("bus")
    ) {

        icon = "🚌";

    }

    else if (
        text.includes("rail")
    ) {

        icon = "🚉";

    }

    else if (
        text.includes("parking")
    ) {

        icon = "🅿️";

    }

    else if (
        text.includes("traffic")
    ) {

        icon = "🚦";

    }

    else if (
        text.includes("cross")
    ) {

        icon = "🚸";

    }


    return L.marker(
        latlng,
        {

            icon:
                L.divIcon({

                    className:
                        "custom-gis-marker",

                    html:
                        `
                        <div style="
                            background:white;
                            border:1px solid #777;
                            border-radius:50%;
                            width:25px;
                            height:25px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            box-shadow:0 2px 5px rgba(0,0,0,.25);
                            font-size:14px;
                        ">
                            ${icon}
                        </div>
                        `,

                    iconSize:
                        [25,25],

                    iconAnchor:
                        [12,12]

                })

        }
    );

}


/* =========================================================
   19. GENERIC FEATURE POPUP
   ========================================================= */

function genericFeaturePopup(
    feature,
    layer
) {

    const properties =
        feature.properties || {};


    const keys =
        Object.keys(
            properties
        );


    let html =
        `
        <div style="
            max-width:300px;
            font-family:Arial;
        ">

        <h3 style="
            margin:0 0 10px;
            font-size:16px;
        ">
            📍 Location Information
        </h3>
        `;


    keys
        .slice(0, 12)
        .forEach(
            key => {

                const value =
                    properties[key];


                if (
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                ) {

                    html +=
                        `
                        <div style="
                            margin:4px 0;
                            font-size:12px;
                        ">
                            <b>
                                ${formatFieldName(key)}:
                            </b>
                            ${value}
                        </div>
                        `;

                }

            }
        );


    html += "</div>";


    layer.bindPopup(
        html
    );

}


/* =========================================================
   20. FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    field
) {

    return field

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================================
   21. UPDATE LAYER CONTROL
   ========================================================= */

let layerControl;


function updateLayerControl() {

    if (layerControl) {

        map.removeControl(
            layerControl
        );

    }


    layerControl =
        L.control.layers(
            baseMaps,
            overlayMaps,
            {

                collapsed: false,

                position: "topright"

            }
        ).addTo(map);

}


/* =========================================================
   22. LOAD GOOGLE SHEET REPORTS
   ========================================================= */

function loadReports() {

    showStatus(
        "Loading public reports..."
    );


    fetch(
        SHEET_URL
    )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Google Sheet could not be accessed."
                );

            }

            return response.text();

        })

        .then(text => {

            /*
               Google returns:

               google.visualization.Query.setResponse(...)
            */

            const jsonText =
                text
                    .replace(
                        /^\s*google\.visualization\.Query\.setResponse\(/,
                        ""
                    )
                    .replace(
                        /\);\s*$/,
                        ""
                    );


            const data =
                JSON.parse(
                    jsonText
                );


            reports =
                parseGoogleSheetData(
                    data
                );


            displayReports();

            updateDashboard();

            showStatus(
                reports.length +
                " reports loaded"
            );

        })

        .catch(error => {

            console.error(
                "REPORT ERROR:",
                error
            );


            showStatus(
                "Unable to load reports. Check Google Sheet access."
            );

        });

}


/* =========================================================
   23. PARSE GOOGLE SHEET DATA
   ========================================================= */

function parseGoogleSheetData(
    data
) {

    if (
        !data ||
        !data.table
    ) {

        return [];

    }


    const table =
        data.table;


    const columns =
        table.cols
            .map(
                column =>
                    column.label ||
                    column.id ||
                    ""
            );


    const rows =
        table.rows || [];


    const result = [];


    rows.forEach(
        row => {

            const values =
                row.c.map(
                    cell => {

                        if (
                            cell === null
                        ) {

                            return "";

                        }


                        if (
                            cell.v === null ||
                            cell.v === undefined
                        ) {

                            return "";

                        }


                        return cell.v;

                    }
                );


            const record = {};


            columns.forEach(
                (column, index) => {

                    record[
                        normalizeHeader(
                            column
                        )
                    ] =
                        values[index] ??
                        "";

                }
            );


            /*
               Detect coordinates.
            */

            const latitude =
                findValue(
                    record,
                    [
                        "latitude",
                        "lat",
                        "y"
                    ]
                );


            const longitude =
                findValue(
                    record,
                    [
                        "longitude",
                        "long",
                        "lng",
                        "lon",
                        "x"
                    ]
                );


            if (
                isValidCoordinate(
                    latitude,
                    longitude
                )
            ) {

                record.__latitude =
                    Number(latitude);

                record.__longitude =
                    Number(longitude);

                result.push(
                    record
                );

            }

        }
    );


    return result;

}


/* =========================================================
   24. NORMALIZE HEADER
   ========================================================= */

function normalizeHeader(
    value
) {

    return String(value)

        .toLowerCase()

        .trim()

        .replace(
            /[^a-z0-9]/g,
            ""
        );

}


/* =========================================================
   25. FIND VALUE
   ========================================================= */

function findValue(
    record,
    possibleNames
) {

    for (
        const name
        of possibleNames
    ) {

        const normalized =
            normalizeHeader(
                name
            );


        if (
            Object.prototype.hasOwnProperty.call(
                record,
                normalized
            )
        ) {

            return record[
                normalized
            ];

        }

    }


    return "";

}


/* =========================================================
   26. VALIDATE COORDINATE
   ========================================================= */

function isValidCoordinate(
    lat,
    lng
) {

    const latitude =
        Number(lat);

    const longitude =
        Number(lng);


    return (

        Number.isFinite(
            latitude
        ) &&

        Number.isFinite(
            longitude
        ) &&

        latitude >= -90 &&
        latitude <= 90 &&

        longitude >= -180 &&
        longitude <= 180

    );

}


/* =========================================================
   27. DISPLAY REPORTS
   ========================================================= */

function displayReports() {

    /*
       Remove previous reports.
    */

    reportLayerGroup.clearLayers();


    reports.forEach(
        report => {

            const severity =
                getReportField(
                    report,
                    [
                        "severity",
                        "severitylevel",
                        "level"
                    ]
                );


            const issue =
                getReportField(
                    report,
                    [
                        "issuetype",
                        "issue",
                        "problem",
                        "category"
                    ]
                );


            const description =
                getReportField(
                    report,
                    [
                        "descriptionoftheproblem",
                        "description",
                        "problem"
                    ]
                );


            const date =
                getReportField(
                    report,
                    [
                        "dateobserved",
                        "date",
                        "timestamp"
                    ]
                );


            const icon =
                createReportIcon(
                    severity
                );


            const marker =
                L.marker(
                    [
                        report.__latitude,
                        report.__longitude
                    ],
                    {
                        icon: icon
                    }
                );


            marker.bindPopup(

                createReportPopup(
                    report,
                    issue,
                    severity,
                    description,
                    date
                )

            );


            reportLayerGroup.addLayer(
                marker
            );

        }
    );

}


/* =========================================================
   28. REPORT ICON
   ========================================================= */

function createReportIcon(
    severity
) {

    const normalized =
        normalizeSeverity(
            severity
        );


    let color =
        "#2e8b57";


    if (
        normalized === "medium"
    ) {

        color =
            "#f57c00";

    }


    if (
        normalized === "severe"
    ) {

        color =
            "#d62828";

    }


    return L.divIcon({

        className:
            "report-marker",

        html:
            `
            <div style="
                width:22px;
                height:22px;
                background:${color};
                border:3px solid white;
                border-radius:50%;
                box-shadow:
                    0 2px 7px rgba(0,0,0,.4);
            ">
            </div>
            `,

        iconSize:
            [22,22],

        iconAnchor:
            [11,11],

        popupAnchor:
            [0,-11]

    });

}


/* =========================================================
   29. REPORT POPUP
   ========================================================= */

function createReportPopup(
    report,
    issue,
    severity,
    description,
    date
) {

    const normalized =
        normalizeSeverity(
            severity
        );


    let severityClass =
        "popup-low";


    if (
        normalized === "medium"
    ) {

        severityClass =
            "popup-medium";

    }


    if (
        normalized === "severe"
    ) {

        severityClass =
            "popup-severe";

    }


    return `

        <div class="report-popup">

            <h3>
                🚨 Pedestrian Safety Report
            </h3>


            <div class="popup-row">

                <span class="popup-label">
                    Issue:
                </span>

                <span>
                    ${escapeHTML(
                        issue ||
                        "Not provided"
                    )}
                </span>

            </div>


            <div class="popup-row">

                <span class="popup-label">
                    Severity:
                </span>

                <span>

                    <span class="
                        popup-severity
                        ${severityClass}
                    ">

                        ${escapeHTML(
                            severity ||
                            "Low"
                        )}

                    </span>

                </span>

            </div>


            <div class="popup-row">

                <span class="popup-label">
                    Description:
                </span>

                <span>
                    ${escapeHTML(
                        description ||
                        "No description"
                    )}
                </span>

            </div>


            <div class="popup-row">

                <span class="popup-label">
                    Date:
                </span>

                <span>
                    ${escapeHTML(
                        String(
                            date ||
                            "Not provided"
                        )
                    )}
                </span>

            </div>


            <div class="popup-row">

                <span class="popup-label">
                    Latitude:
                </span>

                <span>
                    ${report.__latitude.toFixed(6)}
                </span>

            </div>


            <div class="popup-row">

                <span class="popup-label">
                    Longitude:
                </span>

                <span>
                    ${report.__longitude.toFixed(6)}
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   30. GET REPORT FIELD
   ========================================================= */

function getReportField(
    record,
    names
) {

    for (
        const name
        of names
    ) {

        const key =
            normalizeHeader(
                name
            );


        if (
            Object.prototype.hasOwnProperty.call(
                record,
                key
            )
        ) {

            return record[key];

        }

    }


    return "";

}


/* =========================================================
   31. NORMALIZE SEVERITY
   ========================================================= */

function normalizeSeverity(
    value
) {

    const text =
        String(
            value || ""
        )
            .toLowerCase()
            .trim();


    if (
        text.includes("severe") ||
        text.includes("high")
    ) {

        return "severe";

    }


    if (
        text.includes("medium") ||
        text.includes("moderate")
    ) {

        return "medium";

    }


    return "low";

}


/* =========================================================
   32. UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    /*
       Total reports.
    */

    document
        .getElementById(
            "totalReports"
        )
        .textContent =
        reports.length;


    /*
       Issue counts.
    */

    const issueCounts = {};


    reports.forEach(
        report => {

            const issue =
                getReportField(
                    report,
                    [
                        "issuetype",
                        "issue",
                        "problem",
                        "category"
                    ]
                ) ||
                "Other";


            issueCounts[issue] =
                (
                    issueCounts[issue] ||
                    0
                ) + 1;

        }
    );


    const issueContainer =
        document.getElementById(
            "issueCounts"
        );


    issueContainer.innerHTML = "";


    const sortedIssues =
        Object.entries(
            issueCounts
        )
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    sortedIssues.forEach(
        ([issue, count]) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "issue-row";


            row.innerHTML = `

                <div class="issue-name">

                    <span class="issue-icon">
                        ${getIssueIcon(issue)}
                    </span>

                    <span class="issue-text">
                        ${escapeHTML(issue)}
                    </span>

                </div>

                <span class="issue-number">
                    ${count}
                </span>

            `;


            issueContainer.appendChild(
                row
            );

        }
    );


    if (
        sortedIssues.length === 0
    ) {

        issueContainer.innerHTML =
            `
            <div style="
                font-size:12px;
                color:#777;
            ">
                No reports available.
            </div>
            `;

    }


    /*
       Severity counts.
    */

    let low = 0;

    let medium = 0;

    let severe = 0;


    reports.forEach(
        report => {

            const severity =
                normalizeSeverity(
                    getReportField(
                        report,
                        [
                            "severity",
                            "severitylevel",
                            "level"
                        ]
                    )
                );


            if (
                severity === "low"
            ) {

                low++;

            }

            else if (
                severity === "medium"
            ) {

                medium++;

            }

            else if (
                severity === "severe"
            ) {

                severe++;

            }

        }
    );


    document
        .getElementById(
            "lowCount"
        )
        .textContent =
        low;


    document
        .getElementById(
            "mediumCount"
        )
        .textContent =
        medium;


    document
        .getElementById(
            "severeCount"
        )
        .textContent =
        severe;

}


/* =========================================================
   33. ISSUE ICON
   ========================================================= */

function getIssueIcon(
    issue
) {

    const text =
        String(
            issue || ""
        ).toLowerCase();


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
        text.includes("lighting")
    ) {

        return "💡";

    }


    if (
        text.includes("parking")
    ) {

        return "🚗";

    }


    if (
        text.includes("drain")
    ) {

        return "💧";

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
        text.includes("tree") ||
        text.includes("vegetation")
    ) {

        return "🌳";

    }


    return "⚠️";

}


/* =========================================================
   34. ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value
    )

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
   35. STATUS
   ========================================================= */

function showStatus(
    message
) {

    document
        .getElementById(
            "reportStatus"
        )
        .textContent =
        message;

}


/* =========================================================
   36. REFRESH REPORTS
   ========================================================= */

document
    .getElementById(
        "refreshReports"
    )
    .addEventListener(
        "click",
        () => {

            loadReports();

        }
    );


/* =========================================================
   37. INITIAL LAYER CONTROL
   ========================================================= */

updateLayerControl();
