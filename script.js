const lang = "Tc"; //En, Tc, Sc
let response = await fetch(`https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_${lang}.xml`);
const trafficCamData = await response.text();

const parser = new DOMParser();
const xml = parser.parseFromString(trafficCamData, "application/xml");

let regions;
let regionCameras;
let districts;
let cameras;
let time;

const regionSelector = document.getElementById("selectRegion");
const districtSelector = document.getElementById("selectDistrict");
const camSelector = document.getElementById("selectCam");
const failureShower = document.getElementById("failure");

updateTrafficCamData();
initOptions();

const camViewer = document.getElementById("camImage");
const timeShower = document.getElementById("time");

camSelector.addEventListener("change", () => {
    localStorage.setItem("cam", camSelector.value);
    updateImage();
});

districtSelector.addEventListener("change", () => {
    setCamSelectorOptions();
});

regionSelector.addEventListener("change", () => {
    setDistrictSelectorOptions();
});

const savedCam = localStorage.getItem("cam");
if (savedCam && cameras[savedCam]) {
    camSelector.value = savedCam;
}
else{
    camSelector.selectedIndex = 0;
    localStorage.setItem("cam", camSelector.value);
}

updateImage();
setInterval(updateImage, 5000);

function initOptions() {
    regionSelector.replaceChildren();
    const allRegOption = document.createElement("option");
    allRegOption.value = "ALL";
    allRegOption.textContent = lang == "En" ? "All Regions" : "所有地區";
    regionSelector.appendChild(allRegOption);

    for (const key of Object.keys(regions)) {
        const newOption = document.createElement("option");
        newOption.value = key;
        newOption.textContent = key;
        regionSelector.appendChild(newOption);
    }

    districtSelector.replaceChildren();
    const allDisOption = document.createElement("option");
    allDisOption.value = "ALL";
    allDisOption.textContent = lang == "En" ? "All Districts" : "所有區域";
    districtSelector.appendChild(allDisOption);

    for (const key of Object.keys(districts)) {
        const newOption = document.createElement("option");
        newOption.value = key;
        newOption.textContent = key;
        districtSelector.appendChild(newOption);
    }

    camSelector.replaceChildren();
    for (const [key, name] of Object.entries(cameras)) {
        const newOption = document.createElement("option");
        newOption.value = key;
        newOption.textContent = name;
        camSelector.appendChild(newOption);
    }
}

function setDistrictSelectorOptions(){
    const previousDistrict = districtSelector.value;
    districtSelector.replaceChildren();

    let districtCanChoose = Object.keys(districts);
    if (regionSelector.value != "ALL"){
        districtCanChoose = regions[regionSelector.value];
    }

    const allDisOption = document.createElement("option");
    allDisOption.value = "ALL";
    allDisOption.textContent = lang == "En" ? "All Districts" : "所有區域";
    districtSelector.appendChild(allDisOption);
    
    for (const district of districtCanChoose){
        const newOption = document.createElement("option");
        newOption.value = district;
        newOption.textContent = district;
        districtSelector.appendChild(newOption);
    }

    if (districtCanChoose.includes(previousDistrict)) {
        districtSelector.value = previousDistrict;
    } else {
        districtSelector.selectedIndex = 0;
    }
    setCamSelectorOptions();
}

function setCamSelectorOptions(){
    const previousCam = camSelector.value;
    camSelector.replaceChildren();
    
    let camCanChoose = Object.keys(cameras);
    if (districtSelector.value != "ALL"){
        camCanChoose = districts[districtSelector.value];
    } else if (regionSelector.value != "ALL"){
        camCanChoose = regionCameras[regionSelector.value];
    }
    
    for (const cam of camCanChoose) {
        const newOption = document.createElement("option");
        newOption.value = cam;
        newOption.textContent = cameras[cam];
        camSelector.appendChild(newOption);
    }
    
    if (camCanChoose.includes(previousCam)) {
        camSelector.value = previousCam;
    } else {
        camSelector.selectedIndex = 0;
    }
    localStorage.setItem("cam", camSelector.value);
    
    updateImage();
}

function updateImage(){
    camViewer.onerror = function() {
        this.style.display = 'none';
        failureShower.style.display = 'block';
    };
    camViewer.onload = function() {
        this.style.display = 'block';
        failureShower.style.display = 'none';
    };

    camViewer.src = `https://tdcctv.data.one.gov.hk/${camSelector.value}.JPG?t=${Date.now()}`;
    timeShower.textContent = `最後更新 Last Update: ${new Date().toLocaleString()}`;
}

function updateTrafficCamData() {
    regions = {};
    regionCameras = {};
    districts = {};
    cameras = {};

    const camerasDatas = xml.querySelectorAll("image-list image");
    for (const cameraData of camerasDatas) {
        const key = cameraData.querySelector("key").textContent;
        const name = cameraData.querySelector("description").textContent;
        const region = cameraData.querySelector("region").textContent;
        const district = cameraData.querySelector("district").textContent;

        cameras[key] = name.replaceAll(`[${key}]`, "").trim();

        if (!regions[region]) {
            regions[region] = [];
        }
        if (!regions[region].includes(district)) {
            regions[region].push(district);
        }

        if(!regionCameras[region]){
            regionCameras[region] = [];
        }
        if(!regionCameras[region].includes(key)){
            regionCameras[region].push(key);
        }


        if (!districts[district]) {
            districts[district] = [];
        }
        if (!districts[district].includes(key)) {
            districts[district].push(key);
        }
        
    }

    console.log("Regions:", regions, regionCameras);
    console.log("Districts:", districts);
    console.log("Cameras:", cameras);
}