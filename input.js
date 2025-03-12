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

let answers = {};
let currentQuestionIndex = 0;
let isCategorical = false; // Tracks when categorical questions begin
let survivalRate = 85
let chart; // Define chart globally
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("start_button").addEventListener("click", function () {
        loadSpecialQuestion(); // Start asking questions when the "Start" button is pressed
    });
});

function loadSpecialQuestion() {
    // Hide the introduction section
    document.getElementById("intro_section").style.display = 'none';

    let graphContainer = document.querySelector(".graph");
    
    // Initially center the question container
    let container = document.querySelector(".container");
    container.style.flexDirection = 'column'; // Ensure it's column until the graph is rendered
    
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
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Once the graph is created, change the container layout
    container.style.flexDirection = 'row'; // Align elements side by side
    
    // Show the graph now that it has been rendered
    graphContainer.style.display = 'flex';

    let questionContainer = document.querySelector(".question_container");

    // Update question form with diagnosis question
    questionContainer.innerHTML = `
        <form id="question_form">
            <div class="question">
                <label id="question_label" for="answer">Enter patient's diagnosis:</label>
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
            let multiplier = Math.random() * 2;

            survivalRate = survivalRate * multiplier;
            
            survivalRate = Math.max(60, Math.min(survivalRate, 98));
            chart.data.datasets[0].data[0] = survivalRate; // Update chart data
            chart.update(); // Re-render the chart with updated data
            loadNumQuestion(); 
        } else {
            alert("Please enter the diagnosis before proceeding.");
        }
    }, { once: true }); // Ensure the event listener only runs once
};


function loadNumQuestion() {
    if (currentQuestionIndex < numericalTopics.length) {
        // Update question label and input field for numerical questions
        document.getElementById("question_label").textContent = 
            `Enter your ${numericalTopics[currentQuestionIndex]} (${numUnits[currentQuestionIndex]}):`;

        let inputField = document.getElementById("answer");
        inputField.value = ""; // Clear previous input

        // Ensure the form submission works for numerical questions
        document.getElementById("question_form").onsubmit = function(event) {
            event.preventDefault();
            let userInput = inputField.value.trim();

            if (userInput !== "") {
                let aliasKey = attribute_alias[numericalTopics[currentQuestionIndex]]; // Get alias key
                answers[aliasKey] = userInput; // Store only the numerical value
                currentQuestionIndex++;
                let multiplier = Math.random() * 2;

                survivalRate = survivalRate * multiplier;
                
                survivalRate = Math.max(60, Math.min(survivalRate, 98));
                chart.data.datasets[0].data[0] = survivalRate; // Update chart data
                chart.update(); // Re-render the chart with updated data
                loadNumQuestion(); // Load next question or transition
            } else {
                alert("Please provide an answer before proceeding.");
            }
        };
    } else {
        // Transition to categorical questions
        document.querySelector(".question_container").innerHTML = `
            <h2>You will now answer categorical questions.</h2>
            <button id="proceed_button">Proceed</button>
        `;
        document.getElementById("proceed_button").addEventListener("click", function() {
            isCategorical = true;
            currentQuestionIndex = 0; // Reset index for categorical topics
            loadCateQuestion();
        });
    }
}

function loadCateQuestion() {
    if (currentQuestionIndex < cateTopics.length) {
        let questionContainer = document.querySelector(".question_container");
        questionContainer.innerHTML = `
            <form id="question_form">
                <div class="question">
                    <label id="question_label">Select your ${cateTopics[currentQuestionIndex]}:</label>
                    <select id="cate_select" required>
                        ${cateOptions[currentQuestionIndex].map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
                <button type="submit">Submit</button>
            </form>
        `;

        document.getElementById("question_form").addEventListener("submit", function(event) {
            event.preventDefault();
            let selectedValue = document.getElementById("cate_select").value;
            let aliasKey = attribute_alias[cateTopics[currentQuestionIndex]]; // Get alias key
            answers[aliasKey] = selectedValue;
            currentQuestionIndex++;
        
            if (currentQuestionIndex < cateTopics.length) {
                let multiplier = Math.random() * 2;

                survivalRate = survivalRate * multiplier;
                
                survivalRate = Math.max(60, Math.min(survivalRate, 98));
                chart.data.datasets[0].data[0] = survivalRate; // Update chart data
                chart.update(); // Re-render the chart with updated data
                loadCateQuestion();
            } else {
        
                document.querySelector(".question_container").innerHTML = `
                    <h2>Your expected Survival rate is ${survivalRate}%.</h2>
                    <a href="writeup.html">More information</a>
                `;
                console.log("User Answers:", answers); // Log answers for debugging
            }
        });
    }
}
