// Get DOM elements
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const setDistanceBtn = document.getElementById('setDistanceBtn');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const realDistanceInput = document.getElementById('realDistance');
const rangeInput = document.getElementById('rangeInput');
const output = document.getElementById('output');

// Variables for marking points and calculating values
let points = [];
let calibrationPoints = [];
let realDistance = 0;
let range = 0;
let isCalibrating = false;

// Load and display the image
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    };
    img.src = URL.createObjectURL(file);
});

// Set calibration mode to mark two points and enter real-world distance
setDistanceBtn.addEventListener('click', () => {
    if (realDistanceInput.value && rangeInput.value) {
        realDistance = parseFloat(realDistanceInput.value);
        range = parseFloat(rangeInput.value);
        isCalibrating = true;
        calibrationPoints = [];
        output.textContent = "Select two points for calibration.";
    } else {
        alert("Please enter a real-world distance and range first.");
    }
});

// Handle click events for calibration and marking points
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isCalibrating) {
        calibrationPoints.push({ x, y });
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        if (calibrationPoints.length === 2) {
            isCalibrating = false;
            output.textContent = "Calibration complete. Select points to calculate.";
        }
    } else {
        points.push({ x, y });
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
});

// Calculate the real-world angle for the selected points
calculateBtn.addEventListener('click', () => {
    if (calibrationPoints.length < 2 || points.length < 1) {
        alert("Please complete calibration and mark points.");
        return;
    }

    // Calculate scale in pixels-per-meter
    const [p1, p2] = calibrationPoints;
    const pixelDistance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const scale = realDistance / pixelDistance;

    // Convert pixel positions to real-world radians
    const angles = points.map(point => {
        const dx = (point.x - p1.x) * scale;
        const dy = (point.y - p1.y) * scale;
        return Math.atan2(dy, range); // Projected angle in radians
    });

    // Calculate mean and standard deviation of angles
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const stdDev = Math.sqrt(angles.reduce((sum, angle) => sum + (angle - mean) ** 2, 0) / angles.length);

    output.textContent = `Mean Angle: ${mean.toFixed(4)} rad, Std Dev: ${stdDev.toFixed(4)} rad`;
});

// Reset the canvas and clear points
resetBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    points = [];
    calibrationPoints = [];
    realDistance = 0;
    range = 0;
    realDistanceInput.value = '';
    rangeInput.value = '';
    output.textContent = '';
    fileInput.value = null;
});
