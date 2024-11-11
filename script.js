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
let imageLoaded = false;

// Set canvas size to a square
const canvasSize = 400;
canvas.width = canvasSize;
canvas.height = canvasSize;

// Load and display the image as a square, cropping if necessary
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        // Calculate cropping for a square
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        // Draw the cropped square image to fit the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, canvas.width, canvas.height);
        imageLoaded = true;
    };
    img.src = URL.createObjectURL(file);
});

// Set calibration mode to mark two points and enter real-world distance
setDistanceBtn.addEventListener('click', () => {
    if (!imageLoaded) {
        alert("Please upload an image first.");
        return;
    }

    if (realDistanceInput.value && rangeInput.value) {
        realDistance = parseFloat(realDistanceInput.value);
        range = parseFloat(rangeInput.value);
        isCalibrating = true;
        calibrationPoints = [];
        points = [];  // Clear other points until calibration is set
        output.textContent = "Select two points for calibration.";
    } else {
        alert("Please enter a real-world distance and range first.");
    }
});

// Handle click events for calibration and marking points
canvas.addEventListener('click', (event) => {
    if (!isCalibrating && calibrationPoints.length < 2) {
        alert("Please complete calibration first by selecting two points.");
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isCalibrating) {
        // Mark calibration points in blue
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
        // Mark other points in red
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
    imageLoaded = false;
});
