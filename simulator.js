var c = document.getElementById("myCanvas");
var display = document.getElementById("display");
var ctx = c.getContext("2d");

var real_width = 10; // In meters
var real_height = 10; // In meters
var boxPerMeter = 10;

var boxSize = 500 / (real_width * boxPerMeter);
var width = real_width * boxPerMeter;
var height = real_height * boxPerMeter;
var interval;

chart = plotChart();

var distanceFromSurface, 
    power, 
    surface, 
    simulationTime,
    p,
    speed,
    desiredDose,
    areaSterilized,
    chart,
    t,
    direction,
    directionInRadians,
    bumperSpeedX,
    bumperSpeedY;


function makeSimulation(){

    boxPerMeter = Number(document.getElementById("boxes").value);
    real_width = Number(document.getElementById("width").value);
    // real_height = Number(document.getElementById("height").value);
    real_height = real_width;
    width = real_width * boxPerMeter;
    height = real_width * boxPerMeter;

    boxSize = 500 / (real_width * boxPerMeter)

    surface = new Array(height);
    simulationTime = document.getElementById("simulation_time").value;

    areaSterilized = 0

    // light source atributes
    power = document.getElementById("power").value; 
    distanceFromSurface = document.getElementById("distance").value;
    p = [
        Number(document.getElementById("x").value), 
        Number(document.getElementById("y").value)
    ]; // position in relation to the surface

    speed = document.getElementById("speed").value;
    desiredDose = Number(document.getElementById("dose").value);



    for (let i = 0; i < width; i++) {
        let row = new Array(height)
        for (let j = 0; j < height; j++) {
            row[j] = 0;
        }
        surface[i] = row;
    }

    chart.destroy();
    chart = plotChart();

    t = 0;
    clearInterval(interval);
    interval = setInterval(simulate, 0);

    direction = document.getElementById("direction").value; // in degrees
    directionInRadians = direction * Math.PI/180;
    bumperSpeedX = speed * Math.cos(directionInRadians);
    bumperSpeedY = speed * Math.sin(directionInRadians);
}

function simulate() {
    // simulate dose
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let d = Math.pow(distanceFromSurface, 2) + Math.pow(p[0] - (i / boxPerMeter), 2) + Math.pow(p[1] - (j / boxPerMeter), 2);
            let irradiance = power / (4 * Math.PI * d);
            let irr = irradiance * distanceFromSurface/Math.sqrt(d); //irradiance * sin(theta)
            surface[i][j] += irr;
        }
    }
    drawScene(surface);
    t++;
    bumperMove();

    if (t > simulationTime) {
        clearInterval(interval);
        console.log("----> SIMULATION FINISHED");
    }
}


function bumperMove() {
    if (p[0] <= 0 || p[0] >= real_width) {
        bumperSpeedX = -bumperSpeedX;
    } 
    if (p[1] <= 0 || p[1] >= real_height) {
        bumperSpeedY = -bumperSpeedY;
    }  
    p[0] += bumperSpeedX;
    p[1] += bumperSpeedY;
}


function drawRect(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, boxSize, boxSize);
    ctx.rect(x, y, boxSize, boxSize);
}

function drawScene(surface) {
    areaSterilized = 0;
    ctx.clearRect(0, 0, c.height, c.width);
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let color = "#0000FF";
            if (surface[i][j] < desiredDose) { 
                c = Number.parseInt (255 * surface[i][j] / desiredDose);
                color = rgbToHex(255 - c, c, c)
            } else {
                areaSterilized++;
            }
            drawRect(i * boxSize, j * boxSize, color);
        }
    }
    addData(chart, t, areaSterilized/Math.pow(boxPerMeter, 2));

    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "#ccccff";
    ctx.arc(p[0] * boxPerMeter * boxSize + boxSize/2, p[1] * boxPerMeter * boxSize + boxSize/2, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    display.innerHTML = 'Sterilized Surface Area: ' + areaSterilized/Math.pow(boxPerMeter, 2) + ' m² <br>  Elapsed Time: ' + t + ' s';
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


function plotChart() {
    /* -------------------------------- CHART ---------------------------------------- */
    const chartCtx = document.getElementById('myChart').getContext('2d');
    let labels = [] //Array.from(Array(simulationTime).keys())
    const myChart = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sterilized Area',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    myChart.options.animation = false;
    myChart.options.animations.x = false;
    return myChart;
}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}