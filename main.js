let data=[];
let dataPie=[];
let average;
let filteredData = [];
let filteredDataPie = [];
let currentFilter = 'all';
let prevFilter;
let prevDeathCounts = [0,0]; //[death, alive]
let sliderRange = {
    'age': [0,0],
    'height': [0,0],
    'weight':[0,0]
};

let sliderAttr = ['age','height', 'weight'];
const filterColors = {
    all: "lightblue",
    alive: "#6ABF69", // Soft Green
    deceased: "#E57373"  // Soft Red
};
const avgColors = { 
    avg_all: 'blue', 
    avg_0: 'green', 
    avg_1: 'red' 
}; // Color mapping

let xScale;
let yScale;
let svg;
let titleText='All Patient Data';

let columns = ['icu_days', 'bmi', 'preop_plt'];
let aliases={
    icu_days: "Days Spent in ICU",
    bmi: "BMI",
    preop_plt: "Platelet Count",
    age: 'Age',
    intraop_eph: "Ephedrine"
}

let units ={
    icu_days: 'days',
    bmi: 'kg/m^2',
    preop_plt: "x1000/mcL",
    age: 'years old',
    intraop_eph: "mg"
}

updateTooltipVisibility(false);

async function loadData() {
    
    data = await d3.csv("queried_data.csv");

    data.forEach(d => {
        d.caseid = +d.caseid;
        
        d.icu_days = +d.icu_days;
        d.death_inhosp = +d.death_inhosp;
        d.bmi = +d.bmi;
        // d.asa = +d.asa;
        // d.emop = +d.emop;
        // d.preop_htn = +d.preop_htn;
        // d.preop_dm = +d.preop_dm;
        // d.preop_hb = +d.preop_hb;
        d.preop_plt = +d.preop_plt;
        d.icu_days_z = +d.icu_days_z;
        d.bmi_z = +d.bmi_z;
        d.preop_plt_z = +d.preop_plt_z;
        d.ane_type = d.ane_type;
    });

    filteredData = data

    dataPie = await d3.csv("patient_input_data.csv");

    dataPie.forEach(d => {
        
        d.sex = +d.sex;
        d.age = +d.age;
        d.height=+d.height;
        d.weight=+d.weight;
    });
    filteredDataPie = dataPie
}


function createMenu(){
    const container = d3.select("#menu-container_dead_or_alive");

    // Append label
    container.append("label")
        .attr("for", "filter-menu") // Associate label with dropdown
        .text("Patient Status: ")
        .style("margin-right", "5px"); // Optional: Adds spacing between label and dropdown

    // Append dropdown menu
    const menu = container.append("select")
        .attr("id", "filter-menu")
        .on("change", function () { 
            updatePlot(this.value, columns);
        });

    // Append options to the dropdown
    menu.selectAll("option")
        .data(["all", "deceased", "alive"])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d.charAt(0).toUpperCase() + d.slice(1)); // Capitalize first letter
    //console.log('menu_done')
}

function selectColumnsMenu() {
    const menuContainer = d3.select("#menu-container")
        .attr("class", "dropdown-container"); // Optional: Add a class for styling

    // Create three separate dropdowns
    const createDropdown = (id, label, defaultValue) => {
        const dropdown = menuContainer
            .append("div")
            .attr("class", "dropdown-item"); // Optional: Add a class for each dropdown

        dropdown.append("label")
            .attr("for", id)
            .text(label);

        dropdown.append("select")
            .attr("id", id)
            .on("change", updateColumns) // Update columns on change
            .selectAll("option")
            //.data(["preop_plt", "icu_days", "bmi"]) // Define your column names
            //changes
            .data(["preop_plt", "icu_days", "bmi","age","intraop_eph"].map(col => aliases[col]))
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1)) // Capitalize the option text
            .attr("selected", d => d === defaultValue ? "selected" : null); // Set the default value
    };

    
    columns.forEach((col, index) => {
        createDropdown(`filter-menu-column${index + 1}`, `Select Column ${index+1} `, `${aliases[col]}`);
    });
}



// Function to update the selected columns and refresh the plot
function updateColumns() {
    // Update the global columns variable with selected values

    let selectedValues = [
        document.getElementById('filter-menu-column1').value,
        document.getElementById('filter-menu-column2').value,
        document.getElementById('filter-menu-column3').value
    ];
    columns = getKeysFromValues(selectedValues, aliases);
    columns = [...new Set(columns)];

    updatePlot(currentFilter, columns); // Pass the current filter and the selected columns
    console.log("Selected columns:", columns); // For debugging
}


// Reverse lookup function to get keys from values
function getKeysFromValues(values, aliasDict) {
    return values.map(value => 
        Object.keys(aliasDict).find(key => aliasDict[key] === value) || value
    );
}



const width = 950;
const height = 300;

function createPlot(categories) {
    
    svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    //Define margins for better spacing
    const margin = { top: 10, right: 10, bottom: 20, left: 50 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
    // Add a title to the graph
    const title = svg.append("text")
    .attr("x", width / 2) // Center the title
    .attr("y", margin.top-10) // Position it near the top
    .attr("text-anchor", "middle") // Center alignment
    .attr("class", "graph-title") // Optional class for styling
    .style("font-size", "18px") // Set font size
    .style("font-weight", "bold") // Make it bold
    .text(titleText); // Default title

    //Define X-axis as a categorical scale
    
    xScale = d3.scaleBand()
        .domain(categories)  // Categories for X-axis
        .range([usableArea.left, usableArea.right]) 
        
        .padding(0.3); // Add spacing between categories

    //Define Y-axis as a numeric scale (0 to 24 hours)
    yScale = d3.scaleLinear()
        .domain([-4.5, 16]) 
        .range([usableArea.bottom, usableArea.top]) // Invert to match SVG coordinates

    //Append X-axis to SVG
    svg.append("g")
        .attr("transform", `translate(0, ${usableArea.bottom})`) // Move to bottom
        .call(d3.axisBottom(xScale).tickFormat(d => aliases[d] || d)) // Use dictionary lookup
        .selectAll("text") //
        .style("text-anchor", "middle");

    //Append Y-axis to SVG
    svg.append("g")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale));
        svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", `translate(${usableArea.left - 30}, ${usableArea.height / 2+50}) rotate(-90)`) // Rotate and position
        .text("Normalized Z-score"); 

    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
        
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create a map to store density counts
    let densityMap = {};

    // Count occurrences of each (x, y) position
    filteredData.forEach(d => {
        categories.forEach(category => {
            let xPos = xScale(category) + xScale.bandwidth() / 2;
            let yPos = yScale(d[`${category}_z`]);

            let key = `${xPos},${yPos}`;
            densityMap[key] = (densityMap[key] || 0) + 1;
        });
    });
    

    // Find the max density to normalize opacity
    let maxDensity = Math.max(...Object.values(densityMap));
    // console.log(filteredData);

    

    const dots = svg.append("g").attr("class", "dots");

    filteredData.forEach(d => {
        categories.forEach(category => {
            let jitter = (Math.random() - 0.5) * xScale.bandwidth() * 0.6; // Random offset
            let xPos = xScale(category) + xScale.bandwidth() / 2 + jitter;
            
            //console.log(d[`${category}`])
            let yPos = yScale(d[`${category}_z`]);
            let density = densityMap[`${xPos},${yPos}`] || 1; // Get density for this position
            let opacity = 0.6 + (0.4 * (density / maxDensity)); // Scale opacity (min 0.3, max 1)
            // console.log(d);
            // console.log("category:", category);
            // console.log("Expected key:", `${category}_z`);

            dots.append("circle")
                .attr("cx", xPos)
                .attr("cy", yPos)
                .attr("r", 4) // Dot size
                .attr("dataValue", JSON.stringify({ category: category, value: d[category] })) // Store the specific value
                .attr("data-label", "patient") // Label the circle as "patient"
                .attr("fill", filterColors[currentFilter])
                .style("fill-opacity", opacity) // Adjust opacity based on density
                .style("opacity", 0) // Start fully invisible
                .on("mouseenter", function (event) {
                    d3.select(event.currentTarget)
                        .raise()
                        .style("fill-opacity", 1)
                        .style("opacity", 1); // Ensure visibility; // Highlight dot
                    updateTooltipContent(event);
                    updateTooltipVisibility(true);
                    updateTooltipPosition(event);
                    // Log the stored value
                    //console.log("Hovered Data:", JSON.parse(d3.select(event.currentTarget).attr("dataValue")));
                })
                .on("mouseleave", function (event) {
                    d3.select(event.currentTarget)
                        .style("fill-opacity", 0.7); // Restore opacity
                    
                    updateTooltipVisibility(false);
                    
                })
                .transition() // Add animation
                .duration(1000) // 1-second fade-in
                .delay((d, i) => i * 2) // Stagger effect
                .style("opacity", 0.7); // Fade to final opacity
                
        });

     
    });


    // Define legend data
    let bigCircleColor = (currentFilter === "all" ? avgColors.avg_all :
                    currentFilter === "alive" ? avgColors.avg_0 :
                    avgColors.avg_1);
    //console.log(bigCircleColor);
    const legendData = [
        { label: "Averages", size: 10, color: bigCircleColor }, // Larger circle
        { label: "Individuals", size: 5, color: filterColors[currentFilter] } // Smaller circle
    ];

    // Append a group for the legend container
    const legendContainer = svg.append("g")
        .attr("class", "legend-container")
        .attr("transform", `translate(${width - 120}, -30)`); // Move to top-right

    // Add a background box for the legend
    legendContainer.append("rect")
        .attr("width", 120)  // Box width
        .attr("height", 50)  // Box height (adjust based on items)
        .attr("x", -10)      // Position slightly left
        .attr("y", -15)      // Position slightly up
        .style("fill", "#ffffff")  // White background
        .style("stroke", "#000")   // Black border
        .style("stroke-width", 1)
        .style("rx", 8)  // Rounded corners
        .style("ry", 8)
        .style("opacity", 0.8); // Slight transparency

    // Append legend items (circles)
    legendContainer.selectAll("legend-circles")
        .data(legendData)
        .enter()
        .append("circle")
        .attr("cx", 5) // Align circles inside the box
        .attr("cy", (d, i) => i * 20) // Space items
        .attr("r", d => d.size) // Use different sizes
        .style("fill", d => d.color)
        .style("opacity", 0) // Start fully invisible
        .transition() // Add animation
                .duration(1000) // 1-second fade-in
                .delay((d, i) => i * 2) // Stagger effect
                .style("opacity", 1); // Fade to final opacity

    // Append legend text
    legendContainer.selectAll("legend-text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 20) // Position text right of the circles
        .attr("y", (d, i) => i * 20 + 5) // Align with circles
        .style("fill", "#000") // Black text for contrast
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(d => d.label);

}

function createCircles(columns){
    
    let avgSummary = {};

    columns.forEach(col => {
        let colz = col + '_z';
        let allValues = data.map(d => d[colz]).filter(v => !isNaN(v));
        let zeroValues = data.filter(d => d.death_inhosp == 0).map(d => d[colz]).filter(v => !isNaN(v));
        let oneValues = data.filter(d => d.death_inhosp == 1).map(d => d[colz]).filter(v => !isNaN(v));

        // Compute averages
        avgSummary[col+ '_z'] = {
            avg_all: allValues.length ? d3.mean(allValues) : null,
            avg_0: zeroValues.length ? d3.mean(zeroValues) : null,
            avg_1: oneValues.length ? d3.mean(oneValues) : null
        };
    });
    
    average = avgSummary;
    //console.log(average);
    // Create and Store Average Circles
    Object.entries(average).forEach(([category, values]) => {
        values.circle = svg.append("circle")
            .attr("class", `avg-circle avg-${category}`)
            .attr("cx", xScale(category.slice(0,-2)) + xScale.bandwidth() / 2)
            .attr("cy", yScale(values.prevFilter)) // Default to avg_all
            .attr("r", 10)
            .attr("fill", avgColors.prevFilter)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            .style("opacity", 1);
    });

    // Move Average Circles Based on Current Filter
    Object.entries(average).forEach(([category, values]) => {
        let newY = currentFilter === "all" ? values.avg_all :
                currentFilter === "alive" ? values.avg_0 :
                values.avg_1;

        let newColor = currentFilter === "all" ? avgColors.avg_all :
                    currentFilter === "alive" ? avgColors.avg_0 :
                    avgColors.avg_1;

        values.circle.transition()
            .duration(1000) // Smooth transition
            .attr("cy", yScale(newY)) // Move to new Y position
            .attr("fill", newColor) // Update color
            .on("end", () => {
                values.prevFilter = newY;
            });
    });

}

function updatePlot(filterType,selectedColumns) {
    prevFilter = currentFilter;
    currentFilter = filterType;

    // Filter Data Based on Selection
    if (filterType === "all") {
        filteredData = data;
        titleText = "All Patient Data";
    } else if (filterType === "deceased") {
        filteredData = data.filter(d => d.death_inhosp === 1);
        titleText = "Deceased Patient Data";
    } else if (filterType === "alive") {
        filteredData = data.filter(d => d.death_inhosp === 0);
        titleText = "Survived Patient Data";
    }

    //console.log(`Filtered Data (${filterType}):`, filteredData);

    // Remove previous plot
    d3.select("#chart").select("svg").remove();
    
    
    // Recreate the plot with filtered data
    createPlot(selectedColumns); 
    createCircles(selectedColumns);
    //moveAverageDot()

     // Update the title text
}


function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('patient-tooltip');
    if(!tooltip) return; // safty check

    if(isVisible){
        tooltip.style.display = 'block'; // Show tooltip
        tooltip.style.opacity = '1'; 
    }
    else {
        if (!document.querySelector("#patient-tooltip:hover")) { 
            tooltip.style.opacity = '0'; // Fade out effect
            tooltip.style.display = 'none'; // Hide tooltip after fade
        }
    }
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('patient-tooltip');
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Position tooltip BELOW and to the LEFT of the mouse cursor
    tooltip.style.left = `${mouseX + 10}px`;  // Move left by 30px
    tooltip.style.top = `${mouseY + 10}px`;   // Move down by 20px
}

function updateTooltipContent(event) {
    // const tooltip = document.getElementById('patient-tooltip');
    // if (!tooltip) return;

    // const circle = event.currentTarget;
    // const value = circle.getAttribute("dataValue"); // Retrieve stored dataValue

    // if (!value) {
    //     tooltip.style.display = 'none';
    //     return;
    // }

    // tooltip.innerHTML = `
    //     <strong>Data Value:</strong> ${value}
    // `;

    // tooltip.style.display = 'block';

    const tooltip = document.getElementById('patient-tooltip');

    const circle = event.currentTarget;
    const data = JSON.parse(circle.getAttribute("dataValue")); // ✅ Parse the JSON string
    console.log(data)

    const category = data.category; // Extract category
    const value = data.value; // Extract value
    const unit = units[category] || ""; // Get the unit, fallback to empty if not found

    tooltip.innerHTML = `
        <strong>Value:</strong> ${value} ${unit}
    `;

    tooltip.style.display = 'block';
}

function createPieChart(data) {
    
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    d3.select("#piechart").select("svg").remove();

    const deathCounts = d3.rollup(data, v => v.length, d => d.death_inhosp);
    const pieData = Array.from(deathCounts, ([key, value]) => ({ key, value }));
    const total = d3.sum(pieData, d => d.value);
    
    // Define start and end angles based on previous and current data
    const start_angles = prevDeathCounts.map(count => (count / total) * 2 * Math.PI);
    const end_angles = pieData.map(d => (d.value / total) * 2 * Math.PI);

    const color = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["#4CAF50", "#F44336"]);

    const svg = d3.select("#piechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const arcs = svg.selectAll(".arc")
        .data(pie(pieData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.key))
        .transition()
        .duration(1000)
        .attrTween("d", function(d,i) {
            const interpolate = d3.interpolate({ startAngle: start_angles[i], endAngle: start_angles[i] }, { startAngle: d.startAngle, endAngle: d.endAngle });
            return function(t) {
                return arc(interpolate(t));
            };
        });
    prevDeathCounts = [deathCounts.get(1) || 0, deathCounts.get(0) || 0];
    // prevDeathCounts = pieData.map(d => d.value);
}

function createSliders() {
    
    sliderAttr.forEach(attr => {
        console.log("Processing attribute:", attr);
        const maxVal = d3.max(dataPie, d => d[attr]);
        const minVal = d3.min(dataPie, d => d[attr]);
        console.log(minVal);
        console.log(maxVal);

        if (minVal === undefined || maxVal === undefined) {
            console.error(`⚠️ Missing or invalid data for attribute: ${attr}`);
        }
        // Initialize slider range
        sliderRange[attr] = [minVal, maxVal];

        const sliderContainer = d3.select(`#${attr}SliderContainer`);
        sliderContainer.html(""); // 清除舊的 slider

        // 建立 Slider 容器
        sliderContainer.append("div").attr("id", `${attr}Slider`);

        // 初始化 noUiSlider
        const slider = document.getElementById(`${attr}Slider`);
        console.log("creating slider for attribute:", attr);
        noUiSlider.create(slider, {
            start: [minVal, maxVal], // 初始範圍
            connect: true,
            range: {
                min: minVal,
                max: maxVal
            },
            step: 1,
        });

        // 顯示當前範圍
        sliderContainer.append("span").attr("id", `${attr}MinValue`).text(minVal);
        sliderContainer.append("span").text(" - ");
        sliderContainer.append("span").attr("id", `${attr}MaxValue`).text(maxVal);

        // 監聽 Slider 變化，更新數據範圍
        slider.noUiSlider.on("update", function (values) {
            const [selectedMin, selectedMax] = values.map(v => Math.round(v));
            
            d3.select(`#${attr}MinValue`).text(selectedMin);
            d3.select(`#${attr}MaxValue`).text(selectedMax);

            // 更新 sliderRange
            sliderRange[attr] = [selectedMin, selectedMax];
            
            // 更新圓餅圖
            updatePieChart(sliderRange);
        });
    });
}

function updatePieChart(range) {
    // 根據範圍篩選數據
    filteredDataPie = dataPie.filter(d => d.age >= range.age[0] && d.age <= range.age[1]);
    createPieChart(filteredDataPie);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    

    createMenu();
    selectColumnsMenu();
    createPlot(columns);
    createCircles(columns);
    createSliders();
    createPieChart(filteredDataPie);
  });
