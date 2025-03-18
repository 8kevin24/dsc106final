let data = [];
console.log('script loaded');


let numColumn = ['age', 'height', 'weight', 'preop_hb', 'preop_plt'];
let cateColumn = ['sex', 'optype', 'position', 'approach', 'ane_type', 'emop']

let cate_options_dict = {
    'sex': ['Male', 'Female'],
    'surgery type': ['Colorectal', 'Stomach', 'Biliary/Pancreas', 'Vascular', 'Major resection', 'Breast', 'Minor resection', 'Transplantation', 'Hepatic', 'Thyroid', 'Others'],
    'surgery position': ['Lithotomy', 'Supine', 'Reverse Trendelenburg', 'Prone', 'Left lateral decubitus', 'Right lateral decubitus', 'Trendelenburg', 'Sitting', 'Left kidney', 'Right kidney', 'Others'],
    'surgery approach': ['Open', 'Videoscopic', 'Robotic'],
    'anesthesia type': ['General', 'Spinal', 'Sedationalgesia'],
    'emergency status': ['No', 'Yes']
}


export async function loadData() {
    console.log('loading data');
    data = await d3.csv("chart_data.csv");

    data.forEach(d => {
        d.height = +d.height;
        d.weight = +d.weight;
        d.age = +d.age;
        d.preop_hb = +d.preop_hb;
        d.preop_plt = +d.preop_plt;

        d.sex = d.sex;
        d.optype = d.optype;
        d.position = d.position.trim() === "" ? "Others" : d.position; // Replace NaN with 'Others'
        d.approach = d.approach;
        d.ane_type = d.ane_type;
        d.emop = d.emop;
        
        d.death_inhosp = +d.death_inhosp;
    });
    console.log(data);

    // The following is for cheking unique values
    // const uniquePositions = Array.from(new Set(data.map(d => d.position)));

    // console.log("Unique values in 'position':", uniquePositions);

    // const numericColumns = ["height", "weight", "age", "preop_hb", "preop_plt", "death_inhosp"];
    // const allColumns = Object.keys(data[0]); // Get all column names
    // const nonNumericColumns = allColumns.filter(col => !numericColumns.includes(col));

    // // Find unique values for each non-numeric column
    // let uniqueValues = {};
    // nonNumericColumns.forEach(col => {
    //     uniqueValues[col] = Array.from(new Set(data.map(d => d[col])));
    // });
    // console.log("Unique values for non-numeric columns:", uniqueValues);
}


// Euclidean Distance for numerical features
export function euclideanDistance(point1, point2, numColumns) {
    return Math.sqrt(
        numColumns.reduce((sum, col) => sum + Math.pow(point1[col] - point2[col], 2), 0)
    );
}

// Hamming Distance for categorical features
export function hammingDistance(point1, point2, catColumns) {
    return catColumns.reduce((sum, col) => sum + (point1[col] !== point2[col] ? 1 : 0), 0);
}

// KNN Regression Prediction
export function knnRegression(trainingData, testPoint, k, numColumns, catColumns, weight = 1) {
    let distances = trainingData.map(point => {
        let numDist = euclideanDistance(point, testPoint, numColumns);
        let catDist = hammingDistance(point, testPoint, catColumns);
        let totalDistance = numDist + weight * catDist;  // Adjust weighting factor

        return { distance: totalDistance, death_inhosp: point.death_inhosp };
    });

    // Sort by distance and select K nearest neighbors
    distances.sort((a, b) => a.distance - b.distance);
    let neighbors = distances.slice(0, k);

    // Compute prediction as the proportion of neighbors with death_inhosp = 1
    let predictedValue = neighbors.reduce((sum, n) => sum + n.death_inhosp, 0) / k;
    // This is currently the death chance

    return predictedValue;
}








// Function to Run KNN Prediction
export async function runKNNPrediction(inputPoint) {
    //console.log(data);
    console.log('running knn');

    let numColumns = ['age', 'height', 'weight', 'preop_hb', 'preop_plt'];
    let catColumns = ['sex', 'optype', 'position', 'approach', 'ane_type', 'emop'];

    // Hardcoded test values
    
    let k = 20;  
    let prediction = knnRegression(data, inputPoint, k, numColumns, catColumns, 0.5);
    console.log('death chance',prediction);
    return prediction
}

// Add Event Listener to Button After DOM is Loaded
document.addEventListener("DOMContentLoaded", function() {
});