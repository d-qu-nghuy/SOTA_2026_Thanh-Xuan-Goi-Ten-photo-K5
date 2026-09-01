import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrY4fM5QvKYPnSkbMWZ9hsRgV23rf7mGQ",
    authDomain: "media-queue-app-978f8.firebaseapp.com",
    databaseURL: "https://media-queue-app-978f8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "media-queue-app-978f8",
    storageBucket: "media-queue-app-978f8.firebasestorage.app",
    messagingSenderId: "730748075319",
    appId: "1:730748075319:web:b293c6bba8f3f91dc82eb2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const fixedLocations = [
    { id: "moc1", name: "Cổng Chính", lat: 20.980115, lng: 105.766486, region: "hadong" },
    { id: "moc2", name: "Căng Tin", lat:  20.980189, lng: 105.766140, region: "hadong" },
    { id: "moc3", name: "Đường Tố Hữu #1", lat: 20.979817, lng: 105.766155, region: "hadong" },
    { id: "moc4", name: "Đường Tố Hữu #2", lat: 20.979225, lng: 105.765431, region: "hadong" },
    { id: "moc5", name: "Đường Tố Hữu #3", lat: 20.978385, lng: 105.763954, region: "hadong" },
    { id: "moc6", name: "Đường Nguyễn Văn Luyện #1", lat: 20.978663, lng: 105.763251, region: "hadong" },
    { id: "moc7", name: "Đường Nguyễn Văn Luyện #2", lat: 20.979621, lng: 105.761863, region: "hadong" },
    { id: "moc8", name: "Đường Nguyễn Văn Luyện #3", lat: 20.980263, lng: 105.760949, region: "hadong" },
    { id: "moc9", name: "Nhà Ăn", lat: 21.139935, lng: 105.459997, region: "tungthien" },
    { id: "moc10", name: "Cầu Thang #1", lat: 21.139871, lng: 105.460223, region: "tungthien" },
    { id: "moc11", name: "Cầu Thang #2", lat: 21.139701, lng: 105.461032, region: "tungthien" },
    { id: "moc12", name: "Tòa Nhà TT1", lat: 21.139507, lng: 105.460651, region: "tungthien" },
    { id: "moc13", name: "Tòa Nhà TT2", lat: 21.139998, lng: 105.460690, region: "tungthien" },
    { id: "moc14", name: "Giảng Đường", lat: 21.140711, lng: 105.460145, region: "tungthien" },
    { id: "moc15", name: "Sân Bóng Đá", lat: 21.139874, lng: 105.461475, region: "tungthien" },
    { id: "moc16", name: "Sân Bóng Chuyền", lat: 21.139493, lng: 105.461325, region: "tungthien" }
];

let userData = {};
let map;
let markerPhotographer;
let photographerRadar;
let locationMarkers = {}; 
let selectedMarkerId = null;
let isAlertTriggered = false;
let currentPhotographerLat = null;
let currentPhotographerLng = null;

const bgMusic = document.getElementById('bg-music');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnReplay = document.getElementById('btn-replay');
const btnFirework = document.getElementById('btn-firework');
const statusTools = document.getElementById('status-tools');
const vinylRecord = document.getElementById('vinyl-record');

const validPrefixes = ["BIT", "BNS", "BCS", "BAI", "BSE", "BEC", "BBA", "BIB", "BLS", "BMK", "BEM", "BMC", "BPR", "BGD", "BGA", "BDA", "BCL", "BCB", "BKL"];

window.addEventListener('DOMContentLoaded', () => {
    const savedData = sessionStorage.getItem('k5_military_data');
    if (savedData) {
        userData = JSON.parse(savedData);
        document.getElementById('step1-screen').classList.remove('active');
        document.getElementById('step23-screen').classList.add('active');
        
        setTimeout(() => {
            initSelectionMap();
            
            if (userData.location) {
                document.getElementById('region-selector-container').classList.add('hidden');
                document.getElementById('map-instruction').classList.add('hidden');
                document.getElementById('flashcard-ui').classList.remove('hidden');
                document.getElementById('queue-ui').classList.remove('hidden');
                document.getElementById('action-ui').classList.remove('hidden');
                statusTools.classList.remove('hidden');
                
                document.getElementById('map').style.height = "280px"; 
                setTimeout(() => {
                    if (map) map.invalidateSize();
                }, 400);

                document.getElementById('display-name').innerText = userData.fullname;
                document.getElementById('display-mssv').innerText = userData.studentid;
                document.getElementById('display-zalo').innerText = userData.zalo;

                Object.keys(locationMarkers).forEach(key => {
                    if (key !== userData.location.id) map.removeLayer(locationMarkers[key]);
                });

                bgMusic.play().then(() => {
                    btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Tạm Dừng Nhạc</span>';
                    vinylRecord.classList.add('playing'); 
                }).catch(() => {
                    btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span>Tiếp Tục Phát</span>';
                    vinylRecord.classList.remove('playing'); 
                });

            } else {
                const regionSelector = document.getElementById('region-selector-container');
                if (regionSelector) regionSelector.classList.remove('hidden');
                
                document.getElementById('map-instruction').classList.remove('hidden');
                document.getElementById('flashcard-ui').classList.add('hidden');
                document.getElementById('queue-ui').classList.add('hidden');
                document.getElementById('action-ui').classList.add('hidden');
                statusTools.classList.add('hidden');
                document.getElementById('map').style.height = "450px"; 
                setTimeout(() => {
                    if (map) map.invalidateSize();
                }, 400);
            }
        }, 100);
    }
});

document.getElementById('btn-next-map').addEventListener('click', () => {
    const fullname = document.getElementById('fullname').value.trim();
    let rawStudentId = document.getElementById('studentid').value.trim();
    const zalo = document.getElementById('zalo').value.trim();

    const studentid = rawStudentId.length >= 3 
        ? rawStudentId.substring(0, 3).toUpperCase() + rawStudentId.substring(3) 
        : rawStudentId.toUpperCase();

    if(!fullname || !studentid || !zalo) {
        alert("Vui lòng điền đầy đủ thông tin cá nhân!");
        return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(zalo)) {
        alert("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số (VD: 0399182748).");
        return;
    }

    const mssvPrefix = studentid.substring(0, 3);
    const mssvNumbers = studentid.substring(3);
    const isPrefixValid = validPrefixes.includes(mssvPrefix);
    const isNumbersValid = /^\d{6}$/.test(mssvNumbers);

    if (!isPrefixValid || !isNumbersValid) {
        alert("Mã số sinh viên không hợp lệ! Bắt buộc gồm 3 chữ cái mã ngành và 6 chữ số (VD: BEC250024).");
        return;
    }

    userData.fullname = fullname;
    userData.studentid = studentid;
    userData.zalo = zalo;
    sessionStorage.setItem('k5_military_data', JSON.stringify(userData));

    document.getElementById('step1-screen').classList.remove('active');
    document.getElementById('step23-screen').classList.add('active');
    setTimeout(initSelectionMap, 100);
});

function renderMarkers(region) {
    Object.keys(locationMarkers).forEach(key => map.removeLayer(locationMarkers[key]));
    locationMarkers = {};

    const filteredLocs = fixedLocations.filter(loc => loc.region === region);
    filteredLocs.forEach(loc => {
        let marker = L.marker([loc.lat, loc.lng]).addTo(map);
        marker.bindPopup(`<b>${loc.name}</b><br><button onclick="selectLocation('${loc.id}')" style="margin-top:8px; padding:8px 12px; background:#ea580c; color:white; border:none; border-radius:8px; cursor:pointer; width:100%; font-weight:bold;">Chọn mốc này</button>`);
        locationMarkers[loc.id] = marker;
    });
}

function initSelectionMap() {
    if (map) return; 

    let centerLat = 20.980115; 
    let centerLng = 105.766486;
    let initialRegion = 'hadong';

    if (userData.location) {
        centerLat = userData.location.lat;
        centerLng = userData.location.lng;
        initialRegion = userData.location.region;
        document.getElementById('region-selector').value = initialRegion;
    }

    map = L.map('map', { attributionControl: false }).setView([centerLat, centerLng], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });
    
    markerPhotographer = L.marker([-90, 0], {icon: redIcon, opacity: 0}).addTo(map)
        .bindPopup("<b>Vị trí hiện tại của Nháy!</b>");

    function getPixelRadius(lat) {
        let latOffset = 30 / 111320; 
        let p1 = map.project([lat, centerLng], map.getZoom());
        let p2 = map.project([lat + latOffset, centerLng], map.getZoom());
        return Math.abs(p1.y - p2.y);
    }

    let radarHtml = `
        <div class="radar-wrapper">
            <div class="radar-bg"></div>
            <div class="radar-arm">
                <span class="radar-label">30m</span>
            </div>
        </div>
    `;
    let radarIcon = L.divIcon({ className: 'custom-radar-icon', html: radarHtml, iconSize: [0, 0] });

    photographerRadar = L.marker([-90, 0], {icon: radarIcon, interactive: false, opacity: 0}).addTo(map);

    function updateRadarSize() {
        if(map) {
            let px = getPixelRadius(centerLat);
            document.documentElement.style.setProperty('--radar-px', px + 'px');
        }
    }

    map.on('zoom', updateRadarSize);
    map.on('zoomend', updateRadarSize);
    updateRadarSize();

    renderMarkers(initialRegion);

    document.getElementById('region-selector').addEventListener('change', (e) => {
        const region = e.target.value;
        renderMarkers(region);
        if (region === 'hadong') {
            map.flyTo([20.980115, 105.766486], 17, { duration: 1 });
        } else if (region === 'tungthien') {
            map.flyTo([21.139935, 105.459997], 17, { duration: 1 });
        }
    });

    // === LẮNG NGHE TRẠNG THÁI & TỌA ĐỘ TỪ ADMIN ===
    const photographerRef = ref(db, 'photographer');
    onValue(photographerRef, (snapshot) => {
        const data = snapshot.val();
        
        const currentStatus = (data && data.status) ? data.status : "😴😴😴";
        document.getElementById('photographer-status').innerText = currentStatus;

        if (!data || data.isOnline === false) {
            currentPhotographerLat = null;
            currentPhotographerLng = null;
            if(map && markerPhotographer) map.removeLayer(markerPhotographer);
            if(map && photographerRadar) map.removeLayer(photographerRadar);
            startTrackingSimulation('offline');
        } else if (data.lat === undefined || data.lat === null) {
            currentPhotographerLat = null;
            currentPhotographerLng = null;
            if(map && markerPhotographer) map.removeLayer(markerPhotographer);
            if(map && photographerRadar) map.removeLayer(photographerRadar);
            startTrackingSimulation('loading'); 
        } else {
            currentPhotographerLat = data.lat;
            currentPhotographerLng = data.lng;
            
            const newLatLng = new L.LatLng(data.lat, data.lng);
            
            if(map && !map.hasLayer(markerPhotographer)) markerPhotographer.addTo(map);
            if(map && !map.hasLayer(photographerRadar)) photographerRadar.addTo(map);

            markerPhotographer.setLatLng(newLatLng);
            photographerRadar.setLatLng(newLatLng);
            
            if(markerPhotographer) markerPhotographer.setOpacity(1);
            if(photographerRadar) photographerRadar.setOpacity(1);
            
            if (userData.location) {
                const realDistance = Math.round(map.distance(
                    [userData.location.lat, userData.location.lng], 
                    [data.lat, data.lng]
                ));
                startTrackingSimulation(realDistance);
            }
        }
    });
}

window.selectLocation = function(locId) {
    selectedMarkerId = locId;
    const selectedLoc = fixedLocations.find(l => l.id === locId);
    userData.location = selectedLoc;
    
    const studentRef = ref(db, 'queue/' + userData.studentid);
    
    set(studentRef, { 
        fullname: userData.fullname, 
        studentid: userData.studentid, 
        zalo: userData.zalo, 
        locationId: locId, 
        timestamp: Date.now() 
    });

    userData.firebaseKey = userData.studentid;
    sessionStorage.setItem('k5_military_data', JSON.stringify(userData));

    document.getElementById('region-selector-container').classList.add('hidden');
    document.getElementById('map-instruction').classList.add('hidden');
    document.getElementById('flashcard-ui').classList.remove('hidden');
    document.getElementById('queue-ui').classList.remove('hidden');
    document.getElementById('action-ui').classList.remove('hidden');
    
    statusTools.classList.remove('hidden');
    bgMusic.play().then(() => {
        btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Tạm Dừng Nhạc</span>';
        vinylRecord.classList.add('playing'); 
    }).catch(() => {
        btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span>Tiếp Tục Phát</span>';
        vinylRecord.classList.remove('playing'); 
    });

    document.getElementById('map').style.height = "280px"; 
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 400);

    document.getElementById('display-name').innerText = userData.fullname;
    document.getElementById('display-mssv').innerText = userData.studentid;
    document.getElementById('display-zalo').innerText = userData.zalo;

    Object.keys(locationMarkers).forEach(key => {
        if (key !== locId) {
            map.removeLayer(locationMarkers[key]);
        }
    });

    const bounds = L.latLngBounds(
        [selectedLoc.lat, selectedLoc.lng],
        [selectedLoc.lat + 0.005, selectedLoc.lng + 0.005] // Zoom gần mốc
    );
    map.fitBounds(bounds, { padding: [40, 40] });

    if (currentPhotographerLat !== null && currentPhotographerLng !== null) {
        const realDistance = Math.round(map.distance(
            [selectedLoc.lat, selectedLoc.lng], 
            [currentPhotographerLat, currentPhotographerLng]
        ));
        startTrackingSimulation(realDistance);
    } 
    let fwCount = 0;
    btnFirework.click(); 
    fwCount++;
    const fwInterval = setInterval(() => {
        if (fwCount >= 3) {
            clearInterval(fwInterval);
            return;
        }
        btnFirework.click(); 
        fwCount++;
    }, 1000); 
};

function startTrackingSimulation(realDistance) {
    const queueText = document.getElementById('queue-text');
    let queueNumber = 1; 

    if (realDistance === 'offline') {
        queueText.innerHTML = `Xin lỗi nhé, người chụp hiện đang offline 😴`;
        document.body.classList.remove('alert-mode');
        document.getElementById('flashcard-ui').classList.remove('neon-alert');
        isAlertTriggered = false; 
        return; 
    }

    if (realDistance === 'loading') {
        queueText.innerHTML = `Đang đợi kết nối Radar GPS... <i class="fa-solid fa-spinner fa-spin"></i>`;
        document.body.classList.remove('alert-mode');
        document.getElementById('flashcard-ui').classList.remove('neon-alert');
        isAlertTriggered = false; 
        return; 
    }

    let distanceStr = "";
    if (realDistance > 1000) {
        distanceStr = (realDistance / 1000).toFixed(1).replace('.', ',') + "km";
    } else {
        distanceStr = realDistance + "m";
    }

    queueText.innerText = `Bạn là số ${queueNumber} trong hàng đợi. Khoảng cách hiện tại: ${distanceStr}`;

    if (realDistance <= 30) {
        document.body.classList.add('alert-mode');
        document.getElementById('flashcard-ui').classList.add('neon-alert');
        queueText.innerText = `🔥 Người chụp đang ở rất gần (${distanceStr})! Chuẩn bị tác phong ngay! 🔥`;
        
        document.getElementById('alert-sound').play().catch(e => console.log("Cần tương tác để phát âm thanh"));

        if (!isAlertTriggered) {
            fireConfetti();
            isAlertTriggered = true;
        }
    } else {
        document.body.classList.remove('alert-mode');
        document.getElementById('flashcard-ui').classList.remove('neon-alert');
        isAlertTriggered = false; 
    }
}

function fireConfetti() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

document.getElementById('btn-cancel').addEventListener('click', () => {
    if(confirm("Hủy xếp hàng chụp ảnh?")) {
        if(userData.firebaseKey) {
            remove(ref(db, 'queue/' + userData.firebaseKey));
        }
        sessionStorage.removeItem('k5_military_data');
        location.reload();
    }
});

document.getElementById('btn-change-location').addEventListener('click', () => {
    if(confirm("Xác nhận đổi mốc hẹn?")) {
        if(userData.firebaseKey) {
            remove(ref(db, 'queue/' + userData.firebaseKey));
        }
        delete userData.location;
        delete userData.firebaseKey;
        sessionStorage.setItem('k5_military_data', JSON.stringify(userData));
        location.reload();
    }
});

btnFirework.addEventListener('click', () => {
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 40, spread: 360, ticks: 100, zIndex: 9999, shapes: ['circle'], colors: ['#FFD700', '#FF8C00', '#FF4500', '#FFFFFF', '#00FF00'] };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }
    
    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 60 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.4) },
            gravity: 0.8, scalar: randomInRange(0.5, 1.2)
        }));
    }, 250);
});

btnPlayPause.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play();
        btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Tạm Dừng Nhạc</span>';
        vinylRecord.classList.add('playing'); 
    } else {
        bgMusic.pause();
        btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> <span>Tiếp Tục Phát</span>';
        vinylRecord.classList.remove('playing'); 
    }
});

btnReplay.addEventListener('click', () => {
    bgMusic.currentTime = 0;
    bgMusic.play();
    btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Tạm Dừng Nhạc</span>';
    vinylRecord.classList.add('playing');
});