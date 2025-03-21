let filteredData = [];
let data = [];


//let prevDeathCounts = [0,0]; //[death, alive]
let sliderRange = {
    // 'age': [0,0],
    // 'height': [0,0],
    // 'weight':[0,0]
};
let dropDownSelect = {};

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

let sliderAttr = ['age', 'height', 'weight', 'preop_hb', 'preop_plt'];
let AttrUnits = {
    'age': 'years',
    'height': 'cm',
    'weight': 'kg',
    'preop_hb': 'g/dL',
    'preop_plt': 'x1000/mcL'
}

let sliderAttrCate = ['sex', 'optype', 'position', 'approach', 'ane_type', 'emop']
let cate_options_dict = {
    'sex': ['Male', 'Female'],
    'surgery type': ['Colorectal', 'Stomach', 'Biliary/Pancreas', 'Vascular', 'Major resection', 'Breast', 'Minor resection', 'Transplantation', 'Hepatic', 'Thyroid', 'Others'],
    'surgery position': ['Lithotomy', 'Supine', 'Reverse Trendelenburg', 'Prone', 'Left lateral decubitus', 'Right lateral decubitus', 'Trendelenburg', 'Sitting', 'Left kidney', 'Right kidney', 'Others'],
    'surgery approach': ['Open', 'Videoscopic', 'Robotic'],
    'anesthesia type': ['General', 'Spinal', 'Sedationalgesia'],
    'emergency status': ['No', 'Yes']
}

const categoryValueMapping = {
    'sex': { 'Male': 'M', 'Female': 'F' },
    'optype': {
        'Colorectal': 'Colorectal',
        'Stomach': 'Stomach',
        'Biliary/Pancreas': 'Biliary/Pancreas',
        'Vascular': 'Vascular',
        'Major resection': 'Major resection',
        'Breast': 'Breast',
        'Minor resection': 'Minor resection',
        'Transplantation': 'Transplantation',
        'Hepatic': 'Hepatic',
        'Thyroid': 'Thyroid',
        'Others': 'Others'
    },
    'position': {
        'Lithotomy': 'Lithotomy',
        'Supine': 'Supine',
        'Reverse Trendelenburg': 'Reverse Trendelenburg',
        'Prone': 'Prone',
        'Left lateral decubitus': 'Left lateral decubitus',
        'Right lateral decubitus': 'Right lateral decubitus',
        'Trendelenburg': 'Trendelenburg',
        'Sitting': 'Sitting',
        'Left kidney': 'Left kidney',
        'Right kidney': 'Right kidney',
        'Others': null // Maps unknown values (e.g., NaN) to null
    },
    'approach': {
        'Open': 'Open',
        'Videoscopic': 'Videoscopic',
        'Robotic': 'Robotic'
    },
    'ane_type': {
        'General': 'General',
        'Spinal': 'Spinal',
        'Sedationalgesia': 'Sedationalgesia'
    },
    'emop': {
        'No': 'No',
        'Yes': 'Yes'
    }
};


async function loadData() {
    data = await d3.csv("chart_data.csv");

    data.forEach(d => {
        d.height = +d.height;
        d.weight = +d.weight;
        d.age = +d.age;
        d.preop_hb = +d.preop_hb;
        d.preop_plt = +d.preop_plt;

        d.sex = d.sex;
        d.optype = d.optype;
        d.position = d.position;
        d.approach = d.approach;
        d.ane_type = d.ane_type;
        d.emop = d.emop;
        
        d.death_inhosp = +d.death_inhosp;
    });

    filteredData = data;
    console.log(filteredData);
    //prevDeathCounts = d3.rollup(data, v => v.length, d => d.death_inhosp);

    createSliders();
    createDropdown();
    createPieChart(filteredData);
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function createPieChart(data) {
    const maxRadius = 260; // Editable max radius
    const width = maxRadius * 2.5;
    const height = maxRadius * 2.5;
    const totalPoints = 6388; // Total dataset points
    const minRadius = 0; // Minimum size to avoid disappearing

    // Calculate dynamic foreground pie radius based on area change
    const dataSizeRatio = Math.max(data.length / totalPoints, 0.1); // Avoid zero radius
    const foregroundRadius = minRadius + (maxRadius - minRadius) * Math.sqrt(dataSizeRatio); // Adjust by area change

    // Clear previous elements
    d3.select("#piechart").select("svg").remove();
    d3.select("#top-left-legend").remove(); // Remove old floating legend
    d3.select("#legend").html(""); // Clear static corner legend
    d3.select("#piechart").select(".no-data-message").remove();

    // === STATIC BACKGROUND PIE DATA (Full Dataset) ===
    const backgroundData = [
        { key: 0, value: 6331 }, // Survivals (99.11%)
        { key: 1, value: 57 }    // Deaths (0.89%)
    ];

    // === DYNAMIC FOREGROUND PIE DATA (Based on input) ===
    const deathCounts = d3.rollup(data, v => v.length, d => d.death_inhosp);
    const pieData = Array.from(deathCounts, ([key, value]) => ({ key, value }));

    // If there's no data, display a message
    if (pieData.length === 0) {
        d3.select("#piechart")
            .append("div")
            .attr("class", "no-data-message")
            .style("text-align", "center")
            .style("color", "#999")
            .style("font-size", "16px")
            .text("Not enough data");
        return;
    }

    const total = d3.sum(pieData, d => d.value);
    const matchPercentage = (data.length / totalPoints * 100).toFixed(2); // Percentage match

    // Colors for foreground chart
    const color = d3.scaleOrdinal().domain([0, 1]).range(["#4CAF50", "#F44336"]);

    // Colors for background chart (faded)
    const fadedColor = d3.scaleOrdinal().domain([0, 1]).range(["#A5D6A7", "#EF9A9A"]);

    // Create SVG container
    const svg = d3.select("#piechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie().value(d => d.value);
    const arcBackground = d3.arc().innerRadius(0).outerRadius(maxRadius); // Fixed background
    const arcForeground = d3.arc().innerRadius(0).outerRadius(foregroundRadius); // Scaled by area

    // === STATIC BACKGROUND PIE CHART (Fixed Proportions) ===
    const bgArcs = svg.selectAll(".bg-arc")
        .data(pie(backgroundData))
        .enter()
        .append("g")
        .attr("class", "bg-arc");

    bgArcs.append("path")
        .attr("fill", d => fadedColor(d.data.key))
        .attr("opacity", 0.3)
        .attr("d", arcBackground);

    // === DYNAMIC FOREGROUND PIE CHART ===
    const arcs = svg.selectAll(".arc")
        .data(pie(pieData))
        .enter()
        .append("g")
        .attr("class", "arc");

    arcs.append("path")
        .attr("fill", d => color(d.data.key))
        .transition()
        .duration(1000)
        .attrTween("d", function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function(t) {
                return arcForeground(interpolate(t));
            };
        });

    // === STATIC CORNER LEGEND (Based on Foreground Pie Chart) ===
    const legend = d3.select("#legend");

    pieData.forEach(d => {
        const label = d.key == 1 ? "Deaths" : "Survivals";
        const percentage = ((d.value / total) * 100).toFixed(2) + "%";

        legend.append("div")
            .attr("class", "legend-item")
            .html(`
                <span class="legend-color" style="background:${color(d.key)}"></span>
                <span class="legend-label">${label}:</span>
                <span class="legend-count">${d.value} (${percentage})</span>
            `);
    });

    // Add total count row
    legend.append("div")
        .attr("class", "legend-total")
        .html(`<strong>Total:</strong> ${total}`);

    // === STATIC TOP-LEFT LEGEND WITH ARROW ===
    const topLeftLegend = d3.select("#piechart").append("div")
        .attr("id", "top-left-legend")
        .style("position", "absolute")
        .style("top", "10px")
        .style("left", "10px")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "8px")
        .style("padding", "10px")
        .style("box-shadow", "2px 2px 10px rgba(0,0,0,0.2)");

    topLeftLegend.append("div")
        .attr("class", "legend-text")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`Your scenario matches ${matchPercentage}% of the original data.`);


}



function createSliders() {
    const controlsContainer = d3.select("#controlsContainer"); // Select the container

    sliderAttr.forEach(attr => {
        const labelText = Object.keys(attribute_alias).find(key => attribute_alias[key] === attr) || attr; // Find original key
        const alias = attribute_alias[attr] || attr; // Use alias or fallback to attr itself

        // Add to sliderRange dynamically using the original attribute name
        sliderRange[attr] = [0, 0];

        // Create slider box dynamically
        const sliderBox = controlsContainer.append("div")
            .attr("class", "sliderBox")
            .attr("id", `${attr}SliderContainer`);

        // Create label with optional tooltip
        const label = sliderBox.append("label")
            .attr("for", `${attr}Slider`)
            .text(capitalizeFirstLetter(labelText) + " (" + AttrUnits[attr] + ') '); // Display original key as label

        // Add tooltip icon only for preop_hb and preop_plt
        if (attr === 'preop_hb' || attr === 'preop_plt') {
            label.append("span")
                .attr("class", "info-icon")
                .attr("title", attr === 'preop_hb' ? 
                    "Preoperative Hemoglobin: A measure of hemoglobin levels before surgery (g/dL)." :
                    "Preoperative Platelet Count: A measure of platelets in the blood before surgery (x1000/mcL).")
                .html(" ℹ️");
        }

        // Add slider div
        sliderBox.append("div")
            .attr("id", `${attr}Slider`)
            .classed("slider", true);

        // Get min and max values from data
        const maxVal = d3.max(data, d => d[attr]) || 100;
        const minVal = d3.min(data, d => d[attr]) || 0;
        
        // Update slider range with original attribute name
        sliderRange[attr] = [minVal, maxVal];

        // Get slider element
        const slider = document.getElementById(`${attr}Slider`);
        noUiSlider.create(slider, {
            start: [minVal, maxVal],
            connect: true,
            range: {
                min: minVal,
                max: maxVal
            },
            step: 1,
            tooltips: [true, true],
            format: {
                to: value => Math.round(value),
                from: value => Number(value)
            }
        });

        // Update sliderRange on change
        slider.noUiSlider.on("update", function (values) {
            sliderRange[attr] = values.map(v => Math.round(v));
            updatePieChart(sliderRange, dropDownSelect);
        });
    });
}


function createDropdown() {
    const controlsContainer = d3.select("#controlsContainer"); // Select parent container

    sliderAttrCate.forEach(attrCate => {
        const labelText = Object.keys(cate_options_dict).find(key => attribute_alias[key] === attrCate) || attrCate; // Get original key
        const options = cate_options_dict[labelText] || []; // Get category options

        // Initialize dropdown selection with a null value
        dropDownSelect[attrCate] = null;

        // Create dropdown box dynamically
        const dropdownBox = controlsContainer.append("div")
            .attr("class", "dropDownBox")
            .attr("id", `${attrCate}DropdownContainer`);

        // Add label with original category name
        dropdownBox.append("label")
            .attr("for", `${attrCate}Dropdown`)
            .text(labelText + ":");

        // Create dropdown select element
        const select = dropdownBox.append("select")
            .attr("id", `${attrCate}Dropdown`)
            .classed("dropdown", true)
            .on("change", function () {
                const selectedValue = this.value;
                dropDownSelect[attrCate] = selectedValue === "" ? null : selectedValue; // Update dropDownSelect
                updatePieChart(sliderRange,dropDownSelect); // Call filtering function when dropdown is updated
            });

        // Add default option (null)
        select.append("option")
            .attr("value", "")
            .text("Select an option"); // Default null value

        // Populate dropdown with options
        options.forEach(option => {
            select.append("option")
                .attr("value", option)
                .text(option);
        });
    });
}


function updatePieChart(range, categories) {
    console.log("Slider Range:", range);
    console.log("Dropdown Selections (Before Mapping):", categories);

    // First, filter based on numerical (slider) values
    let filteredData = data.filter(d => {
        return Object.entries(range).every(([key, [min, max]]) => {
            return d[key] >= min && d[key] <= max;
        });
    });

    console.log("After Slider Filtering:", filteredData.length);

    // Then, apply categorical filtering using the mapping
    filteredData = filteredData.filter(d => {
        return Object.entries(categories).every(([key, value]) => {
            if (value === null) return true; // Ignore if no selection

            const mappedValue = categoryValueMapping[key]?.[value] || value; // Get the mapped value
            return d[key] && d[key].trim() === mappedValue; // Compare using mapped value
        });
    });

    console.log("Final Filtered Data:", filteredData.length);
    createPieChart(filteredData); // Refresh pie chart with new filtered data
}







loadData();

