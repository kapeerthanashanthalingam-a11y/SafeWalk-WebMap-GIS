// ================================================================
// SAFEWALK
// PUBLIC PEDESTRIAN SAFETY & COMPLAINT WEB MAP
// WESTERN PROVINCE, SRI LANKA
// ================================================================


// ================================================================
// 1. GOOGLE FORM
// ================================================================

const FORM_VIEW_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdgncnCOESnZJ2IJYGJAc-TssjL8kB_oAfr15CEbLBS63tLDQ/viewform";


// These are the Google Form entry IDs
const FORM_ENTRY_LONGITUDE =
    "756715849";

const FORM_ENTRY_LATITUDE =
    "1288249379";


// ================================================================
// 2. GOOGLE SHEET
// ================================================================

const GOOGLE_SHEET_ID =
    "185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";

const GOOGLE_SHEET_GID =
    "1834860223";


// ================================================================
// 3. MAP
// ================================================================

const map =
    L.map("map")
        .setView(
            [6.9271, 79.8612],
            9
        );


// ================================================================
// 4. BASE MAPS
// ================================================================

const osm =
    L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            maxZoom: 19,

            attribution:
                "© OpenStreetMap contributors"

        }
    )
    .addTo(map);


const satellite =
    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {

            maxZoom: 19,

            attribution:
                "Tiles © Esri"

        }
    );


// ================================================================
// 5. UTILITY FUNCTIONS
// ================================================================

function safeText(value) {

    return String(value ?? "")
        .replace(
            /[&<>\"']/g,
            function(character) {

                return {

                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;",
                    "'": "&#039;"

                }[character];

            }
        );

}


// ================================================================
// 6. GEOJSON LOADER
// ================================================================

async function loadGeoJSON(
    url,
    layer
) {

    try {

        console.log(
            "Loading:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `${url} returned ${response.status}`
            );

        }


        const data =
            await response.json();


        layer.addData(data);


        console.log(
            "Loaded successfully:",
            url
        );


        return data;

    }

    catch (error) {

        console.error(
            "GeoJSON error:",
            url,
            error
        );

    }

}


// ================================================================
// 7. WESTERN PROVINCE
// ================================================================

const westernProvince =
    L.geoJSON(
        null,
        {

            style: {

                color:
                    "#d62828",

                weight:
                    3,

                fillColor:
                    "#ffcccc",

                fillOpacity:
                    0.10

            },


            onEachFeature:
                function(
                    feature,
                    layer
                ) {

                    layer.bindPopup(`

                        <div class="popup-title">
                            🟥 Western Province
                        </div>

                        <b>Province:</b>
                        Western Province

                        <br>

                        <b>Country:</b>
                        Sri Lanka

                    `);

                }

        }
    )
    .addTo(map);


let westernProvinceReady =
    false;


loadGeoJSON(
    "data/western_province.geojson",
    westernProvince
)
.then(
    function() {

        westernProvinceReady =
            true;


        if (
            westernProvince
                .getBounds()
                .isValid()
        ) {

            map.fitBounds(
                westernProvince.getBounds(),
                {

                    padding:
                        [20, 20]

                }
            );

        }

    }
);


// ================================================================
// 8. ROAD NETWORK
// DEFAULT = OFF
// ================================================================

const roads =
    L.geoJSON(
        null,
        {

            style: {

                color:
                    "#444444",

                weight:
                    1.5,

                opacity:
                    0.75

            }

        }
    );


loadGeoJSON(
    "data/roads.geojson",
    roads
);


// ================================================================
// 9. RAILWAY
// ================================================================

const railway =
    L.geoJSON(
        null,
        {

            style: {

                color:
                    "#8B4513",

                weight:
                    3,

                dashArray:
                    "8,6"

            }

        }
    );


loadGeoJSON(
    "data/railway.geojson",
    railway
);


// ================================================================
// 10. GENERIC POINT LAYER
// ================================================================

function createPointLayer(
    filename,
    color,
    title,
    emoji
) {

    const layer =
        L.geoJSON(
            null,
            {

                pointToLayer:
                    function(
                        feature,
                        latlng
                    ) {

                        return L.circleMarker(
                            latlng,
                            {

                                radius:
                                    6,

                                color:
                                    "#ffffff",

                                weight:
                                    1.5,

                                fillColor:
                                    color,

                                fillOpacity:
                                    0.9

                            }
                        );

                    },


                onEachFeature:
                    function(
                        feature,
                        marker
                    ) {

                        const properties =
                            feature.properties || {};


                        const name =
                            properties.name ||
                            properties.Name ||
                            properties.NAME ||
                            properties.amenity ||
                            "Unnamed location";


                        marker.bindPopup(`

                            <div class="popup-title">
                                ${emoji}
                                ${title}
                            </div>

                            <table class="popup-table">

                                <tr>

                                    <td>
                                        Name
                                    </td>

                                    <td>
                                        ${safeText(name)}
                                    </td>

                                </tr>

                            </table>

                        `);

                    }

            }
        );


    loadGeoJSON(
        `data/${filename}`,
        layer
    );


    return layer;

}


// ================================================================
// 11. FACILITY LAYERS
// ================================================================

const railwayStations =
    createPointLayer(
        "railway_stations.geojson",
        "#8B0000",
        "Railway Station",
        "🚉"
    );


const busStops =
    createPointLayer(
        "busstops.geojson",
        "#008000",
        "Bus Stop",
        "🚌"
    );


const schools =
    createPointLayer(
        "schools.geojson",
        "#0066cc",
        "School",
        "🏫"
    );


const hospitals =
    createPointLayer(
        "hospitals.geojson",
        "#e63946",
        "Hospital",
        "🏥"
    );


const parking =
    createPointLayer(
        "parking.geojson",
        "#7b2cbf",
        "Parking",
        "🅿️"
    );


const trafficLights =
    createPointLayer(
        "traffic_lights.geojson",
        "#f77f00",
        "Traffic Light",
        "🚦"
    );


const pedestrianCrossings =
    createPointLayer(
        "pedestrian_crossings.geojson",
        "#d4a017",
        "Pedestrian Crossing",
        "🚸"
    );


// ================================================================
// 12. COMPLAINT LAYER
// ================================================================

let complaintLayer =
    L.layerGroup();


// ================================================================
// 13. SELECTED REPORT LOCATION
// ================================================================

let currentLocation =
    null;


let selectedMarker =
    null;


let locationMarker =
    null;


let accuracyCircle =
    null;


// ================================================================
// 14. DMS CONVERSION
// ================================================================

function dmsString(
    value,
    positive,
    negative
) {

    const hemisphere =
        value >= 0
        ?
        positive
        :
        negative;


    let number =
        Math.abs(value);


    const degrees =
        Math.floor(number);


    number =
        (
            number -
            degrees
        ) * 60;


    const minutes =
        Math.floor(number);


    const seconds =
        (
            number -
            minutes
        ) * 60;


    return (

        degrees +
        "°" +
        String(minutes)
            .padStart(2, "0") +
        "'" +
        seconds.toFixed(1) +
        "\"" +
        hemisphere

    );

}


// ================================================================
// 15. SELECT REPORT LOCATION
// ================================================================

function setSelectedLocation(
    latitude,
    longitude,
    label
) {

    currentLocation = {

        lat:
            latitude,

        lng:
            longitude

    };


    if (
        selectedMarker
    ) {

        map.removeLayer(
            selectedMarker
        );

    }


    selectedMarker =
        L.marker(
            [
                latitude,
                longitude
            ],
            {

                draggable:
                    true

            }
        )
        .addTo(map);


    selectedMarker.bindPopup(
        "📌 <b>Report Location</b><br>" +
        "Drag this pin if necessary."
    );


    selectedMarker.openPopup();


    selectedMarker.on(
        "dragend",
        function() {

            const position =
                selectedMarker.getLatLng();


            currentLocation = {

                lat:
                    position.lat,

                lng:
                    position.lng

            };


            updateLocationStatus(
                position.lat,
                position.lng,
                "Selected report location"
            );

        }
    );


    updateLocationStatus(
        latitude,
        longitude,
        label
    );


    const selectedText =
        document.getElementById(
            "selectedLocationText"
        );


    if (
        selectedText
    ) {

        selectedText.innerHTML = `

            Latitude:
            <b>${latitude.toFixed(6)}</b>

            <br>

            Longitude:
            <b>${longitude.toFixed(6)}</b>

        `;

    }

}


// ================================================================
// 16. LOCATION STATUS
// ================================================================

function updateLocationStatus(
    latitude,
    longitude,
    label
) {

    const element =
        document.getElementById(
            "locationStatus"
        );


    if (
        element
    ) {

        element.innerHTML =

            `📌 ${safeText(label)} — ` +

            `${latitude.toFixed(6)}, ` +

            `${longitude.toFixed(6)}`;

    }

}


// ================================================================
// 17. CURRENT LOCATION
// ================================================================

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Your browser does not support location services."
        );

        return;

    }


    const status =
        document.getElementById(
            "locationStatus"
        );


    status.textContent =
        "📍 Finding your current location...";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            if (
                locationMarker
            ) {

                map.removeLayer(
                    locationMarker
                );

            }


            if (
                accuracyCircle
            ) {

                map.removeLayer(
                    accuracyCircle
                );

            }


            locationMarker =
                L.circleMarker(
                    [
                        latitude,
                        longitude
                    ],
                    {

                        radius:
                            8,

                        color:
                            "#1565c0",

                        fillColor:
                            "#42a5f5",

                        fillOpacity:
                            0.9,

                        weight:
                            3

                    }
                )
                .addTo(map);


            locationMarker.bindPopup(
                "📍 Your current location"
            );


            accuracyCircle =
                L.circle(
                    [
                        latitude,
                        longitude
                    ],
                    {

                        radius:
                            position.coords.accuracy || 30,

                        color:
                            "#1565c0",

                        weight:
                            1,

                        fillOpacity:
                            0.08

                    }
                )
                .addTo(map);


            map.setView(
                [
                    latitude,
                    longitude
                ],
                17
            );


            // Current location becomes
            // the report location too.
            setSelectedLocation(
                latitude,
                longitude,
                "Your current location"
            );

        },


        function(error) {

            console.error(
                error
            );


            status.innerHTML =
                "⚠️ Location unavailable. " +
                "Click anywhere inside Western Province " +
                "to select a report location.";

        },


        {

            enableHighAccuracy:
                true,

            timeout:
                10000,

            maximumAge:
                60000

        }

    );

}


// ================================================================
// 18. CHECK WHETHER POINT IS INSIDE WESTERN PROVINCE
// ================================================================

function isInsideWesternProvince(
    latitude,
    longitude
) {

    if (
        !westernProvinceReady
    ) {

        return null;

    }


    const point =
        turf.point(
            [
                longitude,
                latitude
            ]
        );


    let inside =
        false;


    westernProvince.eachLayer(
        function(layer) {

            if (
                layer.feature
            ) {

                try {

                    if (
                        turf.booleanPointInPolygon(
                            point,
                            layer.feature
                        )
                    ) {

                        inside =
                            true;

                    }

                }

                catch(error) {

                    console.error(
                        "Boundary check error:",
                        error
                    );

                }

            }

        }
    );


    return inside;

}


// ================================================================
// 19. CLICK MAP TO SELECT REPORT LOCATION
// ================================================================

map.on(
    "click",
    function(event) {

        const latitude =
            event.latlng.lat;


        const longitude =
            event.latlng.lng;


        const inside =
            isInsideWesternProvince(
                latitude,
                longitude
            );


        if (
            inside === null
        ) {

            alert(
                "Please wait a moment while the Western Province boundary loads."
            );

            return;

        }


        if (
            !inside
        ) {

            alert(
                "⚠️ SafeWalk reports can only be submitted within Western Province."
            );

            return;

        }


        setSelectedLocation(
            latitude,
            longitude,
            "Selected report location"
        );

    }
);


// ================================================================
// 20. SEVERITY COLOUR
// ================================================================

function severityColor(
    value
) {

    const severity =
        String(value || "")
            .toLowerCase()
            .trim();


    if (
        severity.includes("severe") ||
        severity.includes("critical") ||
        severity.includes("high")
    ) {

        return "#d32f2f";

    }


    if (
        severity.includes("medium") ||
        severity.includes("moderate")
    ) {

        return "#f57c00";

    }


    if (
        severity.includes("low")
    ) {

        return "#2e7d32";

    }


    return "#757575";

}


// ================================================================
// 21. FIND SHEET HEADER
// ================================================================

function findHeader(
    row,
    patterns
) {

    const keys =
        Object.keys(row);


    for (
        const pattern of patterns
    ) {

        const exact =
            keys.find(
                key =>
                    key
                        .toLowerCase()
                        .trim() ===
                    pattern
                        .toLowerCase()
                        .trim()
            );


        if (
            exact
        ) {

            return exact;

        }

    }


    for (
        const pattern of patterns
    ) {

        const partial =
            keys.find(
                key =>
                    key
                        .toLowerCase()
                        .includes(
                            pattern
                                .toLowerCase()
                        )
            );


        if (
            partial
        ) {

            return partial;

        }

    }


    return null;

}


// ================================================================
// 22. CONVERT COORDINATE
// ================================================================

function coordinateToDecimal(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    let text =
        String(value)
            .trim();


    if (
        !text
    ) {

        return null;

    }


    // ------------------------------------------------------------
    // Decimal
    // ------------------------------------------------------------

    const decimalMatch =
        text.match(
            /^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/i
        );


    if (
        decimalMatch
    ) {

        let number =
            Number(
                decimalMatch[1]
            );


        const direction =
            (
                decimalMatch[2] || ""
            )
            .toUpperCase();


        if (
            direction === "S" ||
            direction === "W"
        ) {

            number =
                -Math.abs(number);

        }


        return number;

    }


    // ------------------------------------------------------------
    // DMS
    // ------------------------------------------------------------

    const dmsMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*[°º]\s*(\d+(?:\.\d+)?)?\s*['’′]?\s*(\d+(?:\.\d+)?)?\s*["”″]?\s*([NSEW])?/i
        );


    if (
        !dmsMatch
    ) {

        return null;

    }


    const degrees =
        Number(
            dmsMatch[1]
        );


    const minutes =
        Number(
            dmsMatch[2] || 0
        );


    const seconds =
        Number(
            dmsMatch[3] || 0
        );


    let result =
        degrees +
        minutes / 60 +
        seconds / 3600;


    const direction =
        (
            dmsMatch[4] || ""
        )
        .toUpperCase();


    if (
        direction === "S" ||
        direction === "W"
    ) {

        result =
            -result;

    }


    return result;

}


// ================================================================
// 23. UPDATE DASHBOARD
// ================================================================

function updateReportStatistics(
    data
) {

    const issueCounts =
        {};


    let lowCount =
        0;


    let mediumCount =
        0;


    let severeCount =
        0;


    data.forEach(
        function(row) {

            const issueKey =
                findHeader(
                    row,
                    [
                        "Issue Type",
                        "Issue"
                    ]
                );


            const severityKey =
                findHeader(
                    row,
                    [
                        "Severity Level",
                        "Severity"
                    ]
                );


            const issue =
                issueKey
                ?
                String(
                    row[issueKey] || ""
                )
                .trim()
                :
                "Other";


            const severity =
                severityKey
                ?
                String(
                    row[severityKey] || ""
                )
                .toLowerCase()
                .trim()
                :
                "";


            issueCounts[issue] =
                (
                    issueCounts[issue] || 0
                ) + 1;


            if (
                severity.includes("severe") ||
                severity.includes("critical") ||
                severity.includes("high")
            ) {

                severeCount++;

            }

            else if (
                severity.includes("medium") ||
                severity.includes("moderate")
            ) {

                mediumCount++;

            }

            else if (
                severity.includes("low")
            ) {

                lowCount++;

            }

        }
    );


    let html = `

        <div class="stats-title">
            🚨 SafeWalk Reports
        </div>


        <div class="total-reports">

            ${data.length}

            <span>
                Total Reports
            </span>

        </div>


        <div class="stats-section-title">
            Issue Types
        </div>

    `;


    const sortedIssues =
        Object.keys(
            issueCounts
        )
        .sort(
            function(a, b) {

                return (
                    issueCounts[b] -
                    issueCounts[a]
                );

            }
        );


    sortedIssues.forEach(
        function(issue) {

            html += `

                <div class="stat-row">

                    <span>
                        ${safeText(issue)}
                    </span>

                    <strong>
                        ${issueCounts[issue]}
                    </strong>

                </div>

            `;

        }
    );


    html += `

        <div class="stats-section-title">
            Severity
        </div>


        <div class="stat-row">

            <span>
                🟢 Low
            </span>

            <strong>
                ${lowCount}
            </strong>

        </div>


        <div class="stat-row">

            <span>
                🟠 Medium
            </span>

            <strong>
                ${mediumCount}
            </strong>

        </div>


        <div class="stat-row">

            <span>
                🔴 Severe
            </span>

            <strong>
                ${severeCount}
            </strong>

        </div>

    `;


    const dashboard =
        document.getElementById(
            "reportDashboard"
        );


    if (
        dashboard
    ) {

        dashboard.innerHTML =
            html;

    }

}


// ================================================================
// 24. LOAD GOOGLE SHEET
// ================================================================

function loadComplaintReports() {

    console.log(
        "Loading SafeWalk reports..."
    );


    const callbackName =
        "safeWalkCallback_" +
        Date.now();


    const sheetURL =

        "https://docs.google.com/spreadsheets/d/" +

        GOOGLE_SHEET_ID +

        "/gviz/tq" +

        "?gid=" +

        encodeURIComponent(
            GOOGLE_SHEET_GID
        ) +

        "&headers=1" +

        "&tqx=responseHandler:" +

        callbackName;


    console.log(
        "Google Sheet query:",
        sheetURL
    );


    window[
        callbackName
    ] =
        function(response) {

            try {

                processGoogleSheetResponse(
                    response
                );

            }

            catch(error) {

                console.error(
                    "Google Sheet processing error:",
                    error
                );

            }


            delete window[
                callbackName
            ];


            if (
                script.parentNode
            ) {

                script.parentNode.removeChild(
                    script
                );

            }

        };


    const script =
        document.createElement(
            "script"
        );


    script.src =
        sheetURL;


    script.onerror =
        function() {

            console.error(
                "Google Sheet could not be accessed."
            );

        };


    document.body.appendChild(
        script
    );

}


// ================================================================
// 25. PROCESS GOOGLE SHEET RESPONSE
// ================================================================

function processGoogleSheetResponse(
    response
) {

    console.log(
        "Google Sheet response:",
        response
    );


    if (
        !response ||
        !response.table
    ) {

        console.error(
            "No Google Sheet table received."
        );

        return;

    }


    const columns =
        response.table.cols || [];


    const rows =
        response.table.rows || [];


    const data =
        [];


    rows.forEach(
        function(row) {

            const object =
                {};


            columns.forEach(
                function(
                    column,
                    index
                ) {

                    let value =
                        "";


                    if (
                        row.c &&
                        row.c[index]
                    ) {

                        value =
                            row.c[index].v;

                    }


                    object[
                        column.label ||
                        column.id ||
                        `column_${index}`
                    ] =
                        value;

                }
            );


            data.push(
                object
            );

        }
    );


    console.log(
        "Google Sheet data:",
        data
    );


    updateReportStatistics(
        data
    );


    complaintLayer.clearLayers();


    let validReports =
        0;


    data.forEach(
        function(row) {

            const latitudeKey =
                findHeader(
                    row,
                    [
                        "Latitude",
                        "latitude",
                        "lat"
                    ]
                );


            const longitudeKey =
                findHeader(
                    row,
                    [
                        "Longitude",
                        "longitude",
                        "lng",
                        "lon"
                    ]
                );


            if (
                !latitudeKey ||
                !longitudeKey
            ) {

                console.warn(
                    "Latitude/Longitude columns not found:",
                    row
                );

                return;

            }


            const latitude =
                coordinateToDecimal(
                    row[latitudeKey]
                );


            const longitude =
                coordinateToDecimal(
                    row[longitudeKey]
                );


            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude)
            ) {

                console.warn(
                    "Invalid coordinates:",
                    row
                );

                return;

            }


            if (
                Math.abs(latitude) > 90 ||
                Math.abs(longitude) > 180
            ) {

                return;

            }


            const issueKey =
                findHeader(
                    row,
                    [
                        "Issue Type",
                        "Issue"
                    ]
                );


            const severityKey =
                findHeader(
                    row,
                    [
                        "Severity Level",
                        "Severity"
                    ]
                );


            const descriptionKey =
                findHeader(
                    row,
                    [
                        "Description of the Problem",
                        "Description"
                    ]
                );


            const dateKey =
                findHeader(
                    row,
                    [
                        "Date Observed",
                        "Date"
                    ]
                );


            const photoKey =
                findHeader(
                    row,
                    [
                        "Evidence (Upload a photo)",
                        "Evidence",
                        "Photo",
                        "Upload"
                    ]
                );


            const timestampKey =
                findHeader(
                    row,
                    [
                        "Timestamp"
                    ]
                );


            const issue =
                issueKey
                ?
                row[issueKey]
                :
                "Pedestrian Safety Issue";


            const severity =
                severityKey
                ?
                row[severityKey]
                :
                "Unknown";


            const description =
                descriptionKey
                ?
                row[descriptionKey]
                :
                "";


            const date =
                dateKey
                ?
                row[dateKey]
                :
                "";


            const photo =
                photoKey
                ?
                row[photoKey]
                :
                "";


            const timestamp =
                timestampKey
                ?
                row[timestampKey]
                :
                "";


            const marker =
                L.circleMarker(
                    [
                        latitude,
                        longitude
                    ],
                    {

                        radius:
                            9,

                        color:
                            "#ffffff",

                        weight:
                            2,

                        fillColor:
                            severityColor(
                                severity
                            ),

                        fillOpacity:
                            0.95

                    }
                );


            let popup = `

                <div class="popup-title">
                    🚨 SafeWalk Report
                </div>


                <table class="popup-table">


                    <tr>

                        <td>
                            Issue
                        </td>

                        <td>
                            ${safeText(issue)}
                        </td>

                    </tr>


                    <tr>

                        <td>
                            Severity
                        </td>

                        <td>
                            ${safeText(severity)}
                        </td>

                    </tr>

            `;


            if (
                date
            ) {

                popup += `

                    <tr>

                        <td>
                            Date
                        </td>

                        <td>
                            ${safeText(date)}
                        </td>

                    </tr>

                `;

            }


            if (
                description
            ) {

                popup += `

                    <tr>

                        <td>
                            Description
                        </td>

                        <td>
                            ${safeText(description)}
                        </td>

                    </tr>

                `;

            }


            if (
                timestamp
            ) {

                popup += `

                    <tr>

                        <td>
                            Reported
                        </td>

                        <td>
                            ${safeText(timestamp)}
                        </td>

                    </tr>

                `;

            }


            popup += `

                    <tr>

                        <td>
                            Latitude
                        </td>

                        <td>
                            ${latitude.toFixed(6)}
                        </td>

                    </tr>


                    <tr>

                        <td>
                            Longitude
                        </td>

                        <td>
                            ${longitude.toFixed(6)}
                        </td>

                    </tr>

            `;


            if (
                photo &&
                /^https?:\/\//i.test(
                    String(photo)
                )
            ) {

                popup += `

                    <tr>

                        <td>
                            Evidence
                        </td>

                        <td>

                            <a
                                href="${safeText(photo)}"
                                target="_blank"
                                rel="noopener"
                            >
                                📷 View Photo
                            </a>

                        </td>

                    </tr>

                `;

            }


            popup += `

                </table>

            `;


            marker.bindPopup(
                popup
            );


            marker.addTo(
                complaintLayer
            );


            validReports++;

        }
    );


    console.log(
        "Valid complaint reports:",
        validReports
    );


    const countElement =
        document.getElementById(
            "reportCount"
        );


    if (
        countElement
    ) {

        countElement.textContent =
            validReports;

    }


    // Automatically show complaint layer
    if (
        validReports > 0
    ) {

        if (
            !map.hasLayer(
                complaintLayer
            )
        ) {

            complaintLayer.addTo(
                map
            );

        }

    }

}


// ================================================================
// 26. GOOGLE FORM
// ================================================================

function buildPrefilledFormURL() {

    if (
        !currentLocation
    ) {

        return FORM_VIEW_URL;

    }


    const latitude =
        dmsString(
            currentLocation.lat,
            "N",
            "S"
        );


    const longitude =
        dmsString(
            currentLocation.lng,
            "E",
            "W"
        );


    const parameters =
        new URLSearchParams();


    parameters.set(
        "usp",
        "pp_url"
    );


    parameters.set(
        `entry.${FORM_ENTRY_LONGITUDE}`,
        longitude
    );


    parameters.set(
        `entry.${FORM_ENTRY_LATITUDE}`,
        latitude
    );


    return (

        FORM_VIEW_URL +
        "?" +
        parameters.toString()

    );

}


// ================================================================
// 27. OPEN REPORT FORM
// ================================================================

const modal =
    document.getElementById(
        "reportModal"
    );


const formFrame =
    document.getElementById(
        "formFrame"
    );


let activeFormURL =
    FORM_VIEW_URL;


function openReportForm() {

    if (
        !currentLocation
    ) {

        alert(

            "📍 First select a report location by clicking " +
            "My Location or clicking inside Western Province."

        );

        return;

    }


    activeFormURL =
        buildPrefilledFormURL();


    console.log(
        "Google Form:",
        activeFormURL
    );


    formFrame.src =
        activeFormURL;


    modal.classList.remove(
        "hidden"
    );

}


// ================================================================
// 28. REPORT BUTTON
// ================================================================

document
    .getElementById(
        "reportBtn"
    )
    .addEventListener(
        "click",
        openReportForm
    );


// ================================================================
// 29. CURRENT LOCATION BUTTON
// ================================================================

document
    .getElementById(
        "locateBtn"
    )
    .addEventListener(
        "click",
        locateUser
    );


// ================================================================
// 30. CLOSE MODAL FUNCTION
// ================================================================

function closeReportModal() {

    modal.classList.add(
        "hidden"
    );


    formFrame.src =
        "about:blank";


    // Refresh reports after returning
    // from Google Form.
    setTimeout(
        loadComplaintReports,
        3000
    );

}


// ================================================================
// 31. CLOSE BUTTONS
// ================================================================

document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeReportModal
    );


document
    .getElementById(
        "closeModalBottom"
    )
    .addEventListener(
        "click",
        closeReportModal
    );


// ================================================================
// 32. OPEN FORM IN NEW TAB
// ================================================================

document
    .getElementById(
        "openFormBtn"
    )
    .addEventListener(
        "click",
        function() {

            window.open(
                activeFormURL,
                "_blank",
                "noopener"
            );

        }
    );


// ================================================================
// 33. CLOSE MODAL BY CLICKING OUTSIDE
// ================================================================

modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeReportModal();

        }

    }
);


// ================================================================
// 34. LAYER CONTROL
// ================================================================

const baseMaps = {

    "🗺️ OpenStreetMap":
        osm,

    "🛰️ Satellite":
        satellite

};


const overlays = {

    "🟥 Western Province":
        westernProvince,

    "🛣️ Roads":
        roads,

    "🚆 Railway":
        railway,

    "🚉 Railway Stations":
        railwayStations,

    "🚌 Bus Stops":
        busStops,

    "🏫 Schools":
        schools,

    "🏥 Hospitals":
        hospitals,

    "🅿️ Parking":
        parking,

    "🚦 Traffic Lights":
        trafficLights,

    "🚸 Pedestrian Crossings":
        pedestrianCrossings,

    "🚨 Safety Complaints":
        complaintLayer

};


L.control.layers(
    baseMaps,
    overlays,
    {

        collapsed:
            false

    }
)
.addTo(map);


// ================================================================
// 35. SEVERITY LEGEND
// ================================================================

const severityLegend =
    L.control(
        {

            position:
                "bottomright"

        }
    );


severityLegend.onAdd =
    function() {

        const div =
            L.DomUtil.create(
                "div",
                "severity-legend"
            );


        div.innerHTML = `

            <div class="legend-title">
                Complaint Severity
            </div>


            <div class="legend-item">

                <span
                    class="legend-circle low"
                ></span>

                Low

            </div>


            <div class="legend-item">

                <span
                    class="legend-circle medium"
                ></span>

                Medium

            </div>


            <div class="legend-item">

                <span
                    class="legend-circle severe"
                ></span>

                Severe

            </div>

        `;


        L.DomEvent.disableClickPropagation(
            div
        );


        return div;

    };


severityLegend.addTo(
    map
);


// ================================================================
// 36. INITIAL LOAD
// ================================================================

loadComplaintReports();


// ================================================================
// 37. AUTOMATIC REPORT REFRESH
// Every 30 seconds
// ================================================================

setInterval(
    loadComplaintReports,
    30000
);


// ================================================================
// END SAFEWALK
// ================================================================
