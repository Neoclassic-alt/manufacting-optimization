function parseStrings(strings){
    values = strings.value.split('\n');
    for (let i = 0; i < values.length; i++){
        values[i] = values[i].split(',');
        for (let j = 0; j < values[i].length; j++){
            values[i][j] = parseInt(values[i][j]);
        }
    }
    return values;
}

// расчёт параметра t по данным
function calculate(values) {
    const arrayTimes = Array(values.length);
    for (let i = 0; i < values.length; i++){
        arrayTimes[i] = Array(values[0].length);
    }
    /* Даём значения в виде [a, b], где a - начало выполнения на диаграмме Ганта, b - конец */
    for (let i = 0; i < values[0].length; i++){
        for (let j = 0; j < values.length; j++){
            if (j == 0 && i == 0){
                arrayTimes[j][i] = [0, values[j][i]];
            }
            if (j > 0 && i == 0){
                arrayTimes[j][i] = [arrayTimes[j - 1][i][1], arrayTimes[j - 1][i][1] + values[j][i]];
            }
            if (j == 0 && i > 0){
                arrayTimes[j][i] = [arrayTimes[0][i - 1][1], arrayTimes[0][i - 1][1] + values[j][i]];
            }
            if (j > 0 && i > 0){
                const currentTime = Math.max(arrayTimes[j - 1][i][1], arrayTimes[j][i - 1][1]);
                arrayTimes[j][i] = [currentTime, currentTime + values[j][i]];
            }
        }
    }
    return arrayTimes;
}

function commonTime(values) {
    return values[values.length - 1][values[0].length - 1][1];
}

function arrange(values, order, pos){
    const new_values = structuredClone(values);
    for (let i = 0; i < new_values[0].length; i++){
        for (let j = 0; j < new_values.length; j++){
            new_values[j][i] = values[j][order[i][pos]];
        }
    }
    return new_values;
}

function drawGantt(canvasId, calculations, query){
    const canvas = document.getElementById(canvasId);
    const query_ = query.split(',');
    canvas.hidden = false;
    const machines = calculations.length;
    const details = calculations[0].length;
    const height = 200;
    const width = 600;
    const time = commonTime(calculations);
    const pxPerUnit = (width - 25)/ time;
    const pxPerMachine = (height - 20)/ machines;
    const fillColors = ['#FF7373', '#525252', '#415167', '#89105E', '#EF124A', '#7AC271', '#1902C3', 
	'#EEE415', '#145109', '#0E4891', '#6A317C', '#EEC892', '#AF238F', '#8018A5', '#8425AA'];
    const strokeColor = '#000000';
    const textColor = '#000000';
    const lineColor = '#666666';

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < machines; i++){
        for (let j = 0; j < details; j++){
            ctx.fillStyle = fillColors[j];
            ctx.fillRect(Math.round(pxPerUnit*calculations[i][j][0]) + 5, pxPerMachine*i + (pxPerMachine - 10)/2, pxPerUnit*(calculations[i][j][1] - calculations[i][j][0]), 20);
            ctx.strokeStyle = strokeColor;
            ctx.strokeRect(Math.round(pxPerUnit*calculations[i][j][0]) + 5, pxPerMachine*i + (pxPerMachine - 10)/2, pxPerUnit*(calculations[i][j][1] - calculations[i][j][0]), 20);
            if (calculations[i][j][1] != calculations[i][j][0]){
                ctx.fillStyle = textColor;
                ctx.font = "10pt Arial";
                ctx.fillText(query_[j], Math.round(pxPerUnit*(calculations[i][j][0] + calculations[i][j][1])/2) - 2, pxPerMachine*i + pxPerMachine/2 + 10);
            }
        }
    }
    // Рисуем линии слева и снизу
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(5, height - 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, height - 15);
    ctx.lineTo(width, height - 15);
    ctx.stroke();

    // Нарисуем снизу цифры
    const maxDividers = width / 25;
    const minUnits = Math.ceil(time / (maxDividers - 1));
    const distance = (width - 20) / time * minUnits;
    ctx.fillStyle = lineColor;
    for (let i = 0; i < time / minUnits; i++){
        ctx.font = "10pt Arial";
        ctx.textAlign = "center";
        ctx.fillText(minUnits*i, Math.round((distance+1)*i) + 5, height);
        ctx.beginPath();
        ctx.moveTo(Math.round((distance+1)*i), height - 15);
        ctx.lineTo(Math.round((distance+1)*i), height - 20);
        ctx.stroke();
    }
}

function ready(){
    const params = document.getElementById("params");
    const johnson = document.getElementById("johnson");
    const sokol = document.getElementById("sokol");
    const button = document.getElementById("calculate");
    const sourceElement = document.getElementById("sourceTime");
    const resultElement = document.getElementById("results");
    const queryElement = document.getElementById("query");

    const firstText = document.getElementById("first-text");
    const firstTimeResult = document.getElementById("first-time-result");
    const firstQuery = document.getElementById("first-query");
    const secondText = document.getElementById("second-text");
    const secondTimeResult = document.getElementById("second-time-result");
    const secondQuery = document.getElementById("second-query");
    const diffText = document.getElementById("diff-text");
    const diffTimeResult = document.getElementById("diff-time-result");
    const diffQuery = document.getElementById("diff-query");
    const absDiffText = document.getElementById("abs-diff-text");
    const absDiffTimeResult = document.getElementById("abs-diff-time-result");
    const absDiffQuery = document.getElementById("abs-diff-query");

    let values = [];
	
	const loadFileInput = document.getElementById("loadfile");
	loadFileInput.onchange = function () {
		let reader = new FileReader();
		const file = loadFileInput.files[0];
		reader.readAsText(file);
		reader.onload = function() {
			params.value = reader.result;
		}
	}
	
    button.onclick = function (){
        values = parseStrings(params);
        const width = values[0].length;
        const height = values.length;
        const sourceTime = commonTime(calculate(values));
        let query = "";
        sourceElement.innerText = `Результат при заданной очереди: ${sourceTime}`;
        if (johnson.checked) {
            let first = []; // время выполнения на первом не больше, чем на втором
            let second = []; // время выполнения на втором меньше, чем на втором
            for (let i = 0; i < width; i++){
                if (values[0][i] <= values[height - 1][i]){
                    first.push([values[0][i], values[height - 1][i], i]);
                } else {
                    second.push([values[0][i], values[height - 1][i], i]);
                }
            }
            first.sort((a, b) => a[0] - b[0]);
            second.sort((a, b) => b[1] - a[1]);
            const common = first.concat(second);
            const new_values = arrange(values, common, 2);
            console.log(new_values);
            for (let i = 0; i < width; i++){
                query += common[i][2] + 1 + ", ";
            }
            for (let i = 0; i < width; i++){
                values[0][i] = common[i][0];
                values[1][i] = common[i][1];
            }
            const calculations = calculate(new_values)
            const johnsonTime = commonTime(calculations);
            resultElement.innerText = `Результат, полученный при помощи метода Джонсона: ${johnsonTime}`;
            queryElement.innerText = `Очередь выполнения: ${query.slice(0, -2)}`;
            drawGantt("gantt", calculations, query);
        }
        if (sokol.checked) {
            const first_sums = [];
            const second_sums = [];
            const diff_sums = [];
            const abs_diff_sums = [];
            let temp_sum = 0;
            for (let i = 0; i < width; i++){
                temp_sum = 0;
                for (let j = 0; j < height; j++){
                    temp_sum += values[j][i];
                }
                first_sums.push([temp_sum - values[height - 1][i], i]);
                second_sums.push([temp_sum - values[0][i], i]);
                diff_sums.push([second_sums[i] - first_sums[i], i]);
                abs_diff_sums.push([Math.abs(diff_sums[i]), i]);
            }

            first_sums.sort((a, b) => b[0] - a[0]); let firstQueryText = "";
            second_sums.sort((a, b) => a[0] - b[0]); let secondQueryText = "";
            diff_sums.sort((a, b) => b[0] - a[0]); let diffQueryText = "";
            abs_diff_sums.sort((a, b) => b[0] - a[0]); let absDiffQueryText = "";

            for (let i = 0; i < width; i++){
                firstQueryText += first_sums[i][1] + 1 + ', ';
                secondQueryText += second_sums[i][1] + 1 + ', ';
                diffQueryText += diff_sums[i][1] + 1 + ', ';
                absDiffQueryText += abs_diff_sums[i][1] + 1 + ', ';
            }

            firstText.hidden = false;
            secondText.hidden = false;
            diffText.hidden = false;
            absDiffText.hidden = false;

            const first_results = calculate(arrange(values, first_sums, 1));
            const second_results = calculate(arrange(values, second_sums, 1));
            const diff_results = calculate(arrange(values, diff_sums, 1));
            const abs_diff_results = calculate(arrange(values, abs_diff_sums, 1));

            firstQuery.innerText = `Очередь выполнения: ${firstQueryText.slice(0, -2)}`;
            firstTimeResult.innerText = `Время: ${commonTime(first_results)}`;
            secondQuery.innerText = `Очередь выполнения: ${secondQueryText.slice(0, -2)}`;
            secondTimeResult.innerText = `Время: ${commonTime(second_results)}`;
            diffQuery.innerText = `Очередь выполнения: ${diffQueryText.slice(0, -2)}`;
            diffTimeResult.innerText = `Время: ${commonTime(diff_results)}`;
            absDiffQuery.innerText = `Очередь выполнения: ${absDiffQueryText.slice(0, -2)}`;
            absDiffTimeResult.innerText = `Время: ${commonTime(abs_diff_results)}`;
            drawGantt("first-gantt", first_results, firstQueryText);
            drawGantt("second-gantt", second_results, secondQueryText);
            drawGantt("diff-gantt", diff_results, diffQueryText);
            drawGantt("abs-diff-gantt", abs_diff_results, absDiffQueryText);
        }
    }
}

document.addEventListener("DOMContentLoaded", ready);