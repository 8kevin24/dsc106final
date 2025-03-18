import { loadData, euclideanDistance, 
         hammingDistance, knnRegression,
         runKNNPrediction } from './inputs/model.js';


console.log('input js');


let special = 'diagnosis';

let numericalTopics = ['age','weight','height','preoperative hemoglobin', 'preoperative platelet count'];
let numUnits = ['years', 'kg', 'cm', 'g/dL', 'x1000/mcL','']; // make sure the index matches

let cateTopics = ['sex','surgery type', 'surgery position', 'surgery approach', 'anesthesia type', 'emergency status'];
let cateOptions = [
    ['Male','Female'],
    ['Colorectal', 'Stomach', 'Biliary/Pancreas', 'Vascular', 'Major resection', 'Breast', 'Minor resection', 'Transplantation', 'Hepatic', 'Thyroid', 'Others'],
    ['Lithotomy', 'Supine', 'Reverse Trendelenburg', 'Prone', 'Left lateral decubitus', 'Right lateral decubitus', 'Trendelenburg', 'Sitting', 'Left kidney', 'Right kidney', 'Others'],
    ['Open', 'Videoscopic', 'Robotic'],
    ['General', 'Spinal', 'Sedationalgesia'],
    ['No', 'Yes'],
];

let attribute_alias = {
    'age': 'age',
    'weight': 'weight',
    'height': 'height',
    'preoperative hemoglobin': 'preop_hb',
    'preoperative platelet count': 'preop_plt',
    'sex': 'sex',
    'surgery type': 'optype', 
    'surgery position': 'position', 
    'surgery approach': 'approach', 
    'anesthesia type': 'ane_type', 
    'emergency status': 'emop',
};

let answers = {
    'sex': 'M', 
    'optype': 'Colorectal', 
    'position': 'Supine', 
    'approach': 'Open', 
    'ane_type': 'General', 
    'emop': 'No',
    'age': 57.296493,
    'height': 162.188832,
    'weight': 61.484922,
    'preop_hb': 12.833190,
    'preop_plt': 241.437738
}// filled with default value 



let currentQuestionIndex = 0;
let isCategorical = false; // Tracks when categorical questions begin
let survivalRate = 100
let chart; // Define chart globally
document.addEventListener("DOMContentLoaded", function () {
    loadData();
    document.getElementById("start_button").addEventListener("click", function () {

        loadSpecialQuestion(); // Start asking questions when the "Start" button is pressed
    });
});

function loadSpecialQuestion() {
    let introSection = document.getElementById("intro_section");
    let questionContainer = document.querySelector(".question_container");
    let graphContainer = document.querySelector(".graph");
    let container = document.querySelector(".container");

    // Apply fade-out effect to the intro section
    introSection.classList.add("fade-out");

    setTimeout(() => {
        introSection.style.display = "none"; // Hide intro after fade-out

        // Show the new question section with a fade-in effect
        questionContainer.classList.remove("hidden");
        questionContainer.classList.add("fade-in");

        // Show the graph with fade-in effect
        graphContainer.classList.remove("hidden");
        graphContainer.classList.add("fade-in");

        // Ensure it's column until the graph is rendered
        container.style.flexDirection = 'column'; 
        
        // Create and append canvas for the survival rate chart
        let canvas = document.createElement("canvas");
        canvas.id = "survivalChart";
        canvas.width = 200;
        canvas.height = 400;
        graphContainer.appendChild(canvas);
        
        // Initialize the bar chart
        const ctx = document.getElementById("survivalChart").getContext("2d");
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Current Survival Rate'],
                datasets: [{
                    label: 'Survival Rate (%)',
                    data: [survivalRate],
                    backgroundColor: 'rgba(0, 123, 255, 0.5)', // Use a more vibrant blue with more opacity
                    borderColor: 'rgba(0, 123, 255, 1)', // Darker blue for contrast
                    borderWidth: 2,
                    borderRadius: 8, // Round bar edges for modern look
                    barThickness: 150 // Make bar thicker for better visibility
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#ffffff', // Legend text color
                            font: {
                                size: 14
                            }
                        },
                        position: 'top' // Move legend to the top
                    },
                    tooltip: {
                        backgroundColor: '#004A99', // Dark blue tooltip
                        titleFont: { size: 14 },
                        bodyFont: { size: 12 },
                        bodyColor: '#ffffff', // White text for readability
                        titleColor: '#ffffff'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#ffffff', // Change y-axis text color to white
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.4)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff', // Change x-axis text color to white
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.4)', // Light white grid lines
                            lineWidth: 1.5 // Make x-axis grid lines thicker
                        }
                    }
                }
            }
        });

        // Show the graph now that it has been rendered
        graphContainer.style.display = 'flex';

        // Update question form with diagnosis question
        questionContainer.innerHTML = `
            <form id="question_form">
                <div class="question">
                    <label id="question_label" for="answer" class="diagnosis-label">
                    Enter patient's diagnosis:
                    </label>
                    <input type="text" id="answer" required>
                </div>
                <button type="submit">Submit</button>
            </form>
        `;

        let inputField = document.getElementById("answer");
        inputField.value = ""; // Clear input field

        // Attach event listener to the form
        document.getElementById("question_form").addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent form submission

            let userInput = inputField.value.trim();

            if (userInput !== "") {
                answers["diagnosis"] = userInput; // Store diagnosis
                
                chart.data.datasets[0].data[0] = survivalRate; // Update chart data
                chart.update(); // Re-render the chart with updated data

                // Apply fade-out effect before loading next question
                questionContainer.classList.add("fade-out");
                setTimeout(() => {
                    questionContainer.classList.remove("fade-out");
                    questionContainer.classList.add("fade-in");
                    loadNumQuestion();
                }, 500);

            } else {
                alert("Please enter the diagnosis before proceeding.");
            }
        }, { once: true }); // Ensure the event listener only runs once

    },500); // Wait for fade-out before updating content
}



function loadNumQuestion() {
    if (currentQuestionIndex < numericalTopics.length) {
        let questionContainer = document.querySelector(".question_container");

        // Apply fade-out effect before changing the question
        questionContainer.classList.add("fade-out");

        setTimeout(() => {
            questionContainer.classList.remove("fade-out");
            questionContainer.classList.add("fade-in");

            // Update question label and input field for numerical questions
            document.getElementById("question_label").textContent = 
                `Enter your ${numericalTopics[currentQuestionIndex]} (${numUnits[currentQuestionIndex]}):`;

            let inputField = document.getElementById("answer");
            inputField.value = ""; // Clear previous input

        }, 500); // Delay to match the fade-out animation

        // Ensure the form submission works for numerical questions
        document.getElementById("question_form").onsubmit = function(event) {
            event.preventDefault();
            let userInput = document.getElementById("answer").value.trim();

            if (userInput !== "") {
                let aliasKey = attribute_alias[numericalTopics[currentQuestionIndex]]; // Get alias key
                answers[aliasKey] = userInput; // Store only the numerical value
                currentQuestionIndex++;

                runKNNPrediction(answers).then(deathChance => {
                    console.log("KNN Prediction received:", deathChance);
                    
                    let survivalRate = Math.round((1 - deathChance) * 100 * 100) / 100;
                    console.log("Survival Rate:", survivalRate);

                    // Update chart correctly
                    chart.data.datasets[0].data[0] = survivalRate; 
                    chart.update(); // Re-render the chart

                    // Apply fade-out before loading the next question
                    questionContainer.classList.add("fade-out");

                    setTimeout(() => {
                        questionContainer.classList.remove("fade-out");
                        questionContainer.classList.add("fade-in");
                        loadNumQuestion(); // Load next question
                    }, 500);

                }).catch(error => {
                    console.error("Error in KNN Prediction:", error);
                    alert("An error occurred while processing your response. Please try again.");
                });

            } else {
                alert("Please provide an answer before proceeding.");
            }
        };

    } else {
        // Transition to categorical questions
        let questionContainer = document.querySelector(".question_container");

        // Apply fade-out before switching to categorical questions
        questionContainer.classList.add("fade-out");

        setTimeout(() => {
            questionContainer.classList.remove("fade-out");
            questionContainer.classList.add("fade-in");

            questionContainer.innerHTML = `
                <h2>You will now answer categorical questions.</h2>
                <button id="proceed_button">Proceed</button>
            `;

            document.getElementById("proceed_button").addEventListener("click", function() {
                isCategorical = true;
                currentQuestionIndex = 0; // Reset index for categorical topics
                loadCateQuestion();
            });

        }); // Fade-out delay
    }
}


function loadCateQuestion() {
    if (currentQuestionIndex < cateTopics.length) {
        let questionContainer = document.querySelector(".question_container");

        // Apply fade-out effect before changing the question
        questionContainer.classList.add("fade-out");

        setTimeout(() => {
            questionContainer.classList.remove("fade-out");
            questionContainer.classList.add("fade-in");

            questionContainer.innerHTML = `
                <form id="question_form">
                    <div class="question">
                        <label id="question_label" class="diagnosis-label">
                            Select your ${cateTopics[currentQuestionIndex]}:
                        </label>
                        <select id="cate_select" required>
                            ${cateOptions[currentQuestionIndex].map(option => `<option value="${option}">${option}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit">Submit</button>
                </form>
            `;

            // Add event listener for form submission
            document.getElementById("question_form").addEventListener("submit", function(event) {
                event.preventDefault();
                let selectedValue = document.getElementById("cate_select").value;
                let aliasKey = attribute_alias[cateTopics[currentQuestionIndex]]; // Get alias key
                answers[aliasKey] = selectedValue;
                currentQuestionIndex++;

                if (currentQuestionIndex < cateTopics.length) {
                    console.log("Waiting for KNN Prediction...");

                    // Ensure prediction is completed before updating survival rate
                    runKNNPrediction(answers).then(deathChance => {
                        console.log("KNN Prediction received:", deathChance);

                        let survivalRate = Math.round((1 - deathChance) * 100 * 100) / 100;
                        console.log('Survival Rate:', survivalRate);

                        // Update chart with the new survival rate
                        chart.data.datasets[0].data[0] = survivalRate;
                        chart.update(); // Re-render the chart

                        // Apply fade-out effect before loading the next categorical question
                        questionContainer.classList.add("fade-out");

                        setTimeout(() => {
                            questionContainer.classList.remove("fade-out");
                            questionContainer.classList.add("fade-in");
                            loadCateQuestion();
                        }, 500);

                    }).catch(error => {
                        console.error("Error in KNN Prediction:", error);
                        alert("An error occurred while processing your response. Please try again.");
                    });

                } else {
                    // Recalculate prediction one final time
                    console.log("Final prediction after all categorical answers...");

                    runKNNPrediction(answers).then(deathChance => {
                        console.log("Final KNN Prediction received:", deathChance);

                        let survivalRate = (1 - deathChance) * 100;
                        console.log('Final Survival Rate:', survivalRate);

                        questionContainer.classList.add("fade-out");

                        setTimeout(() => {
                            questionContainer.classList.remove("fade-out");
                            questionContainer.classList.add("fade-in");

                            questionContainer.innerHTML = `
                                <h2>Your expected Survival rate is ${survivalRate.toFixed(2)}%.</h2>
                                <a href="../piechart.html">More information</a>
                            `;
                            console.log("Final User Answers:", answers); // Log final answers for debugging
                        }, 500);

                    }).catch(error => {
                        console.error("Error in final KNN Prediction:", error);
                        alert("An error occurred while calculating the final survival rate. Please try again.");
                    });
                }
            });

        }, 500); // Fade-out animation delay
    }
}