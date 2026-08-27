// ================================================================
// SAFEWALK - PUBLIC PEDESTRIAN SAFETY WEB MAP
// Western Province, Sri Lanka
// Leaflet + GeoJSON + Google Forms + Google Sheets
// ================================================================


// ================================================================
// 1. GOOGLE FORM SETTINGS
// ================================================================

const FORM_VIEW_URL =
    "https://docs.google.com/forms/d/e/1FAIpQLSdgncnCOESnZJ2IJYGJAc-TssjL8kB_oAfr15CEbLBS63tLDQ/viewform";

// Your actual Google Form entry IDs
const FORM_ENTRY_LONGITUDE = "756715849";
const FORM_ENTRY_LATITUDE  = "1288249379";


// ================================================================
// 2. GOOGLE SHEET SETTINGS
// ================================================================

const GOOGLE_SHEET_ID =
    "185KFCSkrNdWvzWWPKBzxKDNuMXpfnJeSnX--gcWVn48";

const GOOGLE_SHEET_GID =
    "1834860223";


// ================================================================
// 3. MAP
// ================================================================

const map = L.map("map", {
    zoomControl: true
}).setView([6.9271, 79.8612], 9);


// OpenStreetMap
const osm = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
    }
).addTo(map);


// Satellite
const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles © Esri"
    }
);


// ================================================================
// 4. GENERAL FUNCTIONS
// ================================================================

function safeText(value) {

    return String(value ?? "")
        .replace(/[&<>\"']/g, function (character) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#039;"
            }[character];

        });
}


function featureName(properties) {

    return (
        properties?.name ||
        properties?.Name ||
        properties?.NAME ||
        "Unnamed location"
    );
}


function featureType(properties) {

    return (
        properties?.fclass ||
        properties?.type ||
        properties?.amenity ||
        ""
    );
}


function popupForFeature(title, properties) {

    const name = featureName(properties);
    const type = featureType(properties);

    return `
        <div class="popup-title">
            ${title}
        </div>

        <table class="popup-table">

            <tr>
                <td>Name</td>
                <td>${safeText(name)}</td>
            </tr>

            ${
                type
                ?
                `
                <tr>
                    <td>Type</td>
                    <td>${safeText(type)}</td>
                </tr>
                `
                :
                ""
            }

            ${
                properties?.osm_id
                ?
                `
                <tr>
                    <td>OSM ID</td>
                    <td>${safeText(properties.osm_id)}</td>
                </tr>
                `
                :
                ""
            }

        </table>
    `;
}


// ================================================================
// 5. LOAD GEOJSON
// ================================================================

async function loadGeoJSON(url, layer) {

    try {

        const response = await fetch(url);

        if (!response.ok) {

            throw new Error(
                `${url} returned ${response.status}`
            );

        }

        const data = await response.json();

        layer.addData(data);

        return data;

    }

    catch (error) {

        console.error(
            "GeoJSON loading error:",
            url,
            error
        );

    }

}


// ================================================================
// 6. WESTERN PROVINCE
// ================================================================

const westernProvince = L.geoJSON(
    null,
    {

        style: {

            color: "#d62828",
            weight: 3,
            fillColor: "#ffcccc",
            fillOpacity: 0.12

        },

        onEachFeature: function(feature, layer) {

            layer.bindPopup(`
                <div class="popup-title">
                    🟥 Western Province
                </div>

                <b>Province:</b> Western<br>
                <b>Country:</b> Sri Lanka
            `);

        }

    }
).addTo(map);


loadGeoJSON(
    "data/western_province.geojson",
    westernProvince
)
.then(function() {

    if (westernProvince.getBounds().isValid()) {

        map.fitBounds(
            westernProvince.getBounds(),
            {
                padding: [10, 10]
            }
        );

    }

});


// ================================================================
// 7. ROADS
// ================================================================

const roads = L.geoJSON(
    null,
    {

        style: {

            color: "#444",
            weight: 1.6,
            opacity: 0.75

        }

    }
);


loadGeoJSON(
    "data/roads.geojson",
    roads
);


// ================================================================
// 8. RAILWAY
// ================================================================

const railway = L.geoJSON(
    null,
    {

        style: {

            color: "#8B4513",
            weight: 3,
            dashArray: "8,6"

        }

    }
);


loadGeoJSON(
    "data/railway.geojson",
    railway
);


// ================================================================
// 9. POINT LAYERS
// ================================================================

function pointLayer(
    file,
    color,
    title,
    emoji
) {

    const layer = L.geoJSON(
        null,
        {

            pointToLayer: function(
                feature,
                latlng
            ) {

                return L.circleMarker(
                    latlng,
                    {

                        radius: 6,

                        color: "#ffffff",

                        weight: 1.5,

                        fillColor: color,

                        fillOpacity: 0.9

                    }
                );

            },


            onEachFeature: function(
                feature,
                layer
            ) {

                layer.bindPopup(
                    popupForFeature(
                        `${emoji} ${title}`,
                        feature.properties || {}
                    )
                );

            }

        }
    );


    loadGeoJSON(
        `data/${file}`,
        layer
    );


    return layer;
}


const railwayStations =
    pointLayer(
        "railway_stations.geojson",
        "#8B0000",
        "Railway Station",
        "🚉"
    );


const busStops =
    pointLayer(
        "busstops.geojson",
        "#008000",
        "Bus Stop",
        "🚌"
    );


const schools =
    pointLayer(
        "schools.geojson",
        "#0066cc",
        "School",
        "🏫"
    );


const hospitals =
    pointLayer(
        "hospitals.geojson",
        "#e63946",
        "Hospital",
        "🏥"
    );


const parking =
    pointLayer(
        "parking.geojson",
        "#7b2cbf",
        "Parking",
        "🅿️"
    );


const trafficLights =
    pointLayer(
        "traffic_lights.geojson",
        "#f77f00",
        "Traffic Light",
        "🚦"
    );


const pedestrianCrossings =
    pointLayer(
        "pedestrian_crossings.geojson",
        "#d4a017",
        "Pedestrian Crossing",
        "🚸"
    );


// ================================================================
// 10. COMPLAINT LAYER
// ================================================================

let complaintLayer = L.layerGroup();


// ================================================================
// 11. CONVERT DMS COORDINATES TO DECIMAL
// ================================================================

function dmsToDecimal(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    let text =
        String(value).trim();


    if (!text) {

        return null;

    }


    // Decimal coordinate
    const decimalMatch =
        text.match(
            /^(-?\d+(?:\.\d+)?)\s*([NSEW])?$/i
        );


    if (decimalMatch) {

        let number =
            Number(decimalMatch[1]);

        const direction =
            (
                decimalMatch[2] || ""
            ).toUpperCase();


        if (
            direction === "S" ||
            direction === "W"
        ) {

            number =
                -Math.abs(number);

        }


        return number;

    }


    // DMS coordinate
    const dmsMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*[°º]\s*(\d+(?:\.\d+)?)?\s*['’′]?\s*(\d+(?:\.\d+)?)?\s*["”″]?\s*([NSEW])?/i
        );


    if (!dmsMatch) {

        return null;

    }


    const degrees =
        Number(dmsMatch[1]);


    const minutes =
        Number(dmsMatch[2] || 0);


    const seconds =
        Number(dmsMatch[3] || 0);


    let result =
        degrees +
        minutes / 60 +
        seconds / 3600;


    const direction =
        (
            dmsMatch[4] || ""
        ).toUpperCase();


    if (
        direction === "S" ||
        direction === "W"
    ) {

        result = -result;

    }


    return result;

}


// ================================================================
// 12. FIND COLUMN
// ================================================================

function findHeader(
    row,
    patterns
) {

    const keys =
        Object.keys(row);


    // Exact match
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


        if (exact) {

            return exact;

        }

    }


    // Partial match
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


        if (partial) {

            return partial;

        }

    }


    return null;

}


// ================================================================
// 13. SEVERITY COLOR
// ================================================================

function severityColor(
    value
) {

    const severity =
        String(value || "")
            .toLowerCase();


    if (
        severity.includes("critical")
    ) {

        return "#8e0000";

    }


    if (
        severity.includes("high")
    ) {

        return "#c62828";

    }


    if (
        severity.includes("medium")
    ) {

        return "#ef6c00";

    }


    return "#2e7d32";

}


// ================================================================
// 14. GOOGLE SHEETS → LEAFLET
// ================================================================

function displayGoogleSheetData(
    response
) {

    console.log(
        "Google Sheet response received:",
        response
    );


    if (
        !response ||
        !response.table
    ) {

        console.error(
            "Google Sheet returned no table."
        );

        return;

    }


    const table =
        response.table;


    const columns =
        table.cols || [];


    const rows =
        table.rows || [];


    console.log(
        "Google Sheet columns:",
        columns
    );


    console.log(
        "Google Sheet rows:",
        rows
    );


    // Convert Google DataTable into normal objects
    const data = [];


    rows.forEach(
        function(row) {

            const object = {};


            columns.forEach(
                function(column, index) {

                    let value = "";


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
                    ] = value;

                }
            );


            data.push(object);

        }
    );


    console.log(
        "Converted complaint data:",
        data
    );


    // Clear old points
    complaintLayer.clearLayers();


    let validReports = 0;


    data.forEach(
        function(row) {

            console.log(
                "Processing report:",
                row
            );


            // ----------------------------------------------------
            // Find Latitude
            // ----------------------------------------------------

            const latitudeKey =
                findHeader(
                    row,
                    [
                        "Latitude",
                        "lat",
                        "latitude"
                    ]
                );


            // ----------------------------------------------------
            // Find Longitude
            // ----------------------------------------------------

            const longitudeKey =
                findHeader(
                    row,
                    [
                        "Longitude",
                        "lng",
                        "lon",
                        "longitude"
                    ]
                );


            console.log(
                "Latitude column:",
                latitudeKey
            );


            console.log(
                "Longitude column:",
                longitudeKey
            );


            if (
                !latitudeKey ||
                !longitudeKey
            ) {

                console.warn(
                    "Latitude or longitude column not found.",
                    row
                );

                return;

            }


            const latitude =
                dmsToDecimal(
                    row[latitudeKey]
                );


            const longitude =
                dmsToDecimal(
                    row[longitudeKey]
                );


            console.log(
                "Converted coordinates:",
                latitude,
                longitude
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


            // ----------------------------------------------------
            // Find other columns
            // ----------------------------------------------------

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
                "";


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


            // ----------------------------------------------------
            // Create marker
            // ----------------------------------------------------

            const marker =
                L.circleMarker(
                    [
                        latitude,
                        longitude
                    ],
                    {

                        radius: 9,

                        color: "#ffffff",

                        weight: 2,

                        fillColor:
                            severityColor(
                                severity
                            ),

                        fillOpacity: 0.95

                    }
                );


            // ----------------------------------------------------
            // Popup
            // ----------------------------------------------------

            let popupHTML = `

                <div class="complaint-popup">

                    <div class="popup-title">
                        🚨 SafeWalk Report
                    </div>

                    <table class="popup-table">

                        <tr>
                            <td>Issue</td>
                            <td>
                                ${safeText(issue)}
                            </td>
                        </tr>

                        <tr>
                            <td>Severity</td>
                            <td>
                                ${safeText(severity)}
                            </td>
                        </tr>

            `;


            if (date) {

                popupHTML += `

                    <tr>
                        <td>Date</td>
                        <td>
                            ${safeText(date)}
                        </td>
                    </tr>

                `;

            }


            if (timestamp) {

                popupHTML += `

                    <tr>
                        <td>Reported</td>
                        <td>
                            ${safeText(timestamp)}
                        </td>
                    </tr>

                `;

            }


            if (description) {

                popupHTML += `

                    <tr>
                        <td>Description</td>
                        <td>
                            ${safeText(description)}
                        </td>
                    </tr>

                `;

            }


            popupHTML += `

                    <tr>
                        <td>Latitude</td>
                        <td>
                            ${latitude.toFixed(6)}
                        </td>
                    </tr>

                    <tr>
                        <td>Longitude</td>
                        <td>
                            ${longitude.toFixed(6)}
                        </td>
                    </tr>

            `;


            // Evidence/photo
            if (
                photo &&
                /^https?:\/\//i.test(
                    String(photo)
                )
            ) {

                popupHTML += `

                    <tr>
                        <td>Evidence</td>

                        <td>
                            <a
                                href="${safeText(photo)}"
                                target="_blank"
                                rel="noopener"
                            >
                                View Photo
                            </a>
                        </td>

                    </tr>

                `;

            }


            popupHTML += `

                    </table>

                </div>

            `;


            marker.bindPopup(
                popupHTML
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


    // Update report count
    const countElement =
        document.getElementById(
            "reportCount"
        );


    if (countElement) {

        countElement.textContent =
            validReports;

    }


    // Automatically show complaint layer
    // if reports exist.
    if (
        validReports > 0 &&
        !map.hasLayer(
            complaintLayer
        )
    ) {

        complaintLayer.addTo(map);

    }

}


// ================================================================
// 15. LOAD GOOGLE SHEET USING JSONP
// ================================================================

function loadComplaintReports() {

    console.log(
        "Loading SafeWalk reports..."
    );


    const callbackName =
        "safeWalkSheetCallback_" +
        Date.now();


    // Google Visualization query
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
        "Google Sheet URL:",
        sheetURL
    );


    // Create global callback
    window[
        callbackName
    ] = function(response) {

        try {

            displayGoogleSheetData(
                response
            );

        }

        catch (error) {

            console.error(
                "Error processing Google Sheet:",
                error
            );

        }


        // Remove callback
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


    // Create script element
    const script =
        document.createElement(
            "script"
        );


    script.src =
        sheetURL;


    script.onerror =
        function() {

            console.error(
                "Could not access Google Sheet."
            );


            console.error(
                "Check that the sheet is public/published."
            );

        };


    document.body.appendChild(
        script
    );

}


// ================================================================
// 16. CURRENT LOCATION
// ================================================================

let currentLocation = null;

let locationMarker = null;

let accuracyCircle = null;

let selectedMarker = null;


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


function updateStatus(
    latitude,
    longitude,
    label
) {

    const status =
        document.getElementById(
            "locationStatus"
        );


    if (!status) {

        return;

    }


    status.innerHTML =
        `${safeText(label)} — ` +
        `${latitude.toFixed(6)}, ` +
        `${longitude.toFixed(6)}`;

}


function setSelectedLocation(
    latitude,
    longitude,
    label
) {

    currentLocation = {

        lat: latitude,

        lng: longitude

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
                draggable: true
            }
        )
        .addTo(map);


    selectedMarker.bindPopup(
        "📍 Report location<br>" +
        "Drag the pin to adjust the location."
    );


    selectedMarker.openPopup();


    selectedMarker.on(
        "dragend",
        function() {

            const position =
                selectedMarker.getLatLng();


            currentLocation = {

                lat: position.lat,

                lng: position.lng

            };


            updateStatus(
                position.lat,
                position.lng,
                "Selected report location"
            );

        }
    );


    updateStatus(
        latitude,
        longitude,
        label
    );

}


// ================================================================
// 17. GET CURRENT USER LOCATION
// ================================================================

function locateUser() {

    if (
        !navigator.geolocation
    ) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;

    }


    document.getElementById(
        "locationStatus"
    ).textContent =
        "Requesting your location...";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            currentLocation = {

                lat: latitude,

                lng: longitude

            };


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

                        radius: 8,

                        color: "#1565c0",

                        fillColor: "#42a5f5",

                        fillOpacity: 0.9,

                        weight: 3

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

                        color: "#1565c0",

                        weight: 1,

                        fillOpacity: 0.08

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


            updateStatus(
                latitude,
                longitude,
                "Your current location"
            );

        },


        function(error) {

            console.error(
                error
            );


            document.getElementById(
                "locationStatus"
            ).textContent =
                "Location permission was not available. Click the map to select a location.";

            alert(
                "We could not access your current location. " +
                "Please allow location access, or click the map."
            );

        },


        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 60000

        }

    );

}


// ================================================================
// 18. CLICK MAP TO SELECT REPORT LOCATION
// ================================================================

map.on(
    "click",
    function(event) {

        setSelectedLocation(
            event.latlng.lat,
            event.latlng.lng,
            "Selected report location"
        );

    }
);


document.getElementById(
    "locateBtn"
)
.addEventListener(
    "click",
    locateUser
);


// ================================================================
// 19. GOOGLE FORM PREFILL
// ================================================================

function buildPrefilledFormURL() {

    if (
        !currentLocation
    ) {

        return FORM_VIEW_URL;

    }


    const latitudeDMS =
        dmsString(
            currentLocation.lat,
            "N",
            "S"
        );


    const longitudeDMS =
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
        longitudeDMS
    );


    parameters.set(
        `entry.${FORM_ENTRY_LATITUDE}`,
        latitudeDMS
    );


    return (
        FORM_VIEW_URL +
        "?" +
        parameters.toString()
    );

}


// ================================================================
// 20. REPORT MODAL
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
            "First click 'My Location' or click the map to select the location you want to report."
        );

        return;

    }


    activeFormURL =
        buildPrefilledFormURL();


    console.log(
        "Prefilled Google Form:",
        activeFormURL
    );


    formFrame.src =
        activeFormURL;


    modal.classList.remove(
        "hidden"
    );

}


document.getElementById(
    "reportBtn"
)
.addEventListener(
    "click",
    openReportForm
);


// ================================================================
// 21. CLOSE FORM
// ================================================================

document.getElementById(
    "closeModal"
)
.addEventListener(
    "click",
    function() {

        modal.classList.add(
            "hidden"
        );


        formFrame.src =
            "about:blank";


        // Wait a little for Google Sheets
        // to receive the new response.
        setTimeout(
            loadComplaintReports,
            2500
        );

    }
);


// ================================================================
// 22. OPEN GOOGLE FORM IN NEW TAB
// ================================================================

document.getElementById(
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
// 23. MANUAL REFRESH
// ================================================================

document.getElementById(
    "refreshReportsBtn"
)
.addEventListener(
    "click",
    function() {

        loadComplaintReports();

    }
);


// ================================================================
// 24. CLOSE MODAL BY CLICKING OUTSIDE
// ================================================================

modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            modal.classList.add(
                "hidden"
            );


            formFrame.src =
                "about:blank";


            setTimeout(
                loadComplaintReports,
                2500
            );

        }

    }
);


// ================================================================
// 25. LAYER CONTROL
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
        collapsed: false
    }
).addTo(map);


// ================================================================
// 26. REPORT COUNTER
// ================================================================

const countControl =
    L.control({
        position: "topright"
    });


countControl.onAdd =
    function() {

        const div =
            L.DomUtil.create(
                "div",
                "leaflet-control leaflet-bar"
            );


        div.style.background =
            "#ffffff";


        div.style.padding =
            "7px 10px";


        div.style.fontSize =
            "12px";


        div.style.fontWeight =
            "700";


        div.innerHTML =
            'Reports: <span id="reportCount">0</span>';


        L.DomEvent
            .disableClickPropagation(
                div
            );


        return div;

    };


countControl.addTo(map);


// ================================================================
// 27. LOAD REPORTS WHEN WEBSITE STARTS
// ================================================================

loadComplaintReports();


// ================================================================
// 28. AUTOMATIC REFRESH EVERY 30 SECONDS
// ================================================================

setInterval(
    loadComplaintReports,
    30000
);


// ================================================================
// END SAFEWALK
// ================================================================
