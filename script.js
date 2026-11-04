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

updateTrafficCamData();

const camSelector = document.getElementById("selectCam");

for (const [key, name] of Object.entries(cameras)){
    const newOption = document.createElement("option");
    newOption.value = key;
    newOption.textContent = name;
    camSelector.appendChild(newOption);
}

const camViewer = document.getElementById("camImage");
const timeShower = document.getElementById("time");

camSelector.addEventListener("change", () => {
    localStorage.setItem("cam", camSelector.value);
    updateImage();
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

function updateImage() {
    const url = `https://tdcctv.data.one.gov.hk/${camSelector.value}.JPG?t=${Date.now()}`;
    const img = new Image();

    img.onload = () => {
        camViewer.src = url;
    };

    img.onerror = () => {
        camViewer.src = "backup.png";
    };

    img.src = url;
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