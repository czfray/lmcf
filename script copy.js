let response = await fetch("stations.json");
const stations = await response.json();

response = await fetch("lines.json");
const lines = await response.json();

const stnSelector = document.getElementById("selectStn");
const timeShower = document.getElementById("time");

const trainList = document.getElementById("trainList");
const lineTemplate = document.getElementById("lineTemplate");
const trainTemplate = document.getElementById("trainTemplate");
const failureTemplate = document.getElementById("failureTemplate");

let time;
let isUpdating = false;

for (const [code, station] of Object.entries(stations)){
    const newOption = document.createElement("option");
    newOption.value = code;
    newOption.textContent = station["name"]["tc"] + " " + station["name"]["en"];
    stnSelector.appendChild(newOption);
}

let linesObjs = [];

const savedStation = localStorage.getItem("station");
if (savedStation && stations[savedStation]) {
    stnSelector.value = savedStation;
}
else{
    stnSelector.value = "ADM";
    localStorage.setItem("station", "ADM");
}

update();

stnSelector.addEventListener("change", () => {
    localStorage.setItem("station", stnSelector.value);
    update();
});

setInterval(update, 5000);

async function update(){
    if (isUpdating) return;
    isUpdating = true;
    try {
        await updateLists();
        updateVisuals();
    } catch (error) {
        console.error("Update failed:", error);
    } finally {
        isUpdating = false;
    }
}

async function updateLists(){
    console.log("Updating lists...");

    linesObjs = [];
    const station = stnSelector.value;
    console.log("Updating station: " + station);
    for (const line of stations[station].lines){
        console.log("Updating line: " + line);
        const mtrData = await requestMTRData(line, station);
        console.log(`Got MTR Data of ${line} in station ${station}`);

        const trains = getTrains(mtrData, line, station);
        if (Object.keys(trains).length <= 0) {
            console.log(`Line ${line} has no more train.`);
            continue;
        }

        let lineObj = {
            line: line,
            trains: trains
        }
        linesObjs.push(lineObj);

        time = mtrData.sys_time;
    }

    console.log("List updated (" + stnSelector.value + ")");
    console.log(linesObjs)
}

function updateVisuals(){
    trainList.replaceChildren();
    for (const lineObj of linesObjs){
        const lineVisual = lineTemplate.content.cloneNode(true);
        const lineName = lines[lineObj.line].name;
        lineVisual.querySelector(".lineName").textContent = lineName.tc + " " + lineName.en;

        const trainContainer = lineVisual.querySelector(".trains");
        for (const [dest, mins] of Object.entries(lineObj["trains"])){
            const trainVisual = trainTemplate.content.cloneNode(true);
            const destName = stations[dest].name;
            trainVisual.querySelector(".trainName").textContent = destName.tc + " " + destName.en;

            for (let i = 0; i < 4; i++) {
                let minText;
                if (i < mins.length){
                    minText = mins[i];
                    if (mins[i] <= 0){
                        minText = "Arr";
                    }
                } else {
                    minText = "-";
                }
                trainVisual.querySelector(".trainMin" + i).textContent = minText;
            }
            trainContainer.appendChild(trainVisual);
        }
        lineVisual.appendChild(trainContainer);
        trainList.appendChild(lineVisual);
    }

    if (linesObjs.length <= 0){
        const noTrainsVisual = failureTemplate.content.cloneNode(true);
        noTrainsVisual.querySelector(".failtc").textContent = "呢個站依家冇車，或者個app壞咗";
        noTrainsVisual.querySelector(".failen").textContent = "Stopped service or connection failure";
        trainList.appendChild(noTrainsVisual);
    }

    timeShower.textContent = "最後更新 Last Update: " + time;
}

async function requestMTRData(line, station){
    const response = await fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${line}&sta=${station}`);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
}

function getTrains(mtrData, line, station){
    let trains = {};
    const stationData = mtrData.data[`${line}-${station}`];
    addTrainsMinutes(trains, stationData.UP);
    addTrainsMinutes(trains, stationData.DOWN);
    
    console.log(trains);
    return trains;
}

function addTrainsMinutes(trains, upDownData){
    if (!upDownData) return;
    for (const {dest, ttnt} of upDownData){
        if (!(dest in trains)){
            trains[dest] = []
        }
        trains[dest].push(ttnt);
    }
}