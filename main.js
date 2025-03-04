let filteredData = [];
let data = [];
let prevDeathCounts = [0,0]; //[death, alive]
let sliderRange = {
    'age': [0,0],
    'height': [0,0],
    'weight':[0,0]
};

let sliderAttr = ['age','height', 'weight'];

async function loadData() {
    data = await d3.csv("patient_input_data.csv");

    data.forEach(d => {
        d.height = +d.height;
        d.weight = +d.weight;
        d.sex = d.sex;
        d.age = +d.age;
        d.death_inhosp = +d.death_inhosp;
    });

    filteredData = data;
    console.log(filteredData);
    //prevDeathCounts = d3.rollup(data, v => v.length, d => d.death_inhosp);

    createSliders();
    createPieChart(filteredData);
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
        const maxVal = d3.max(data, d => d[attr]);
        const minVal = d3.min(data, d => d[attr]);
        
        // Initialize slider range
        sliderRange[attr] = [minVal, maxVal];

        const sliderContainer = d3.select(`#${attr}SliderContainer`);
        sliderContainer.html(""); // 清除舊的 slider

        // 建立 Slider 容器
        sliderContainer.append("div").attr("id", `${attr}Slider`);

        // 初始化 noUiSlider
        const slider = document.getElementById(`${attr}Slider`);
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
    filteredData = data.filter(d => d.age >= range.age[0] && d.age <= range.age[1]);
    createPieChart(filteredData);
}





loadData();

