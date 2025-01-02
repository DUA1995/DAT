document.getElementById('analyzeBtn').addEventListener('click', analyzeData);
document.getElementById('exportBtn').addEventListener('click', exportToWord);

function analyzeData() {
    const input = document.getElementById('dataInput').value.trim();
    const categoriesInput = document.getElementById('categories').value.trim();

    if (!input || !categoriesInput) {
        alert('Please provide data and ranges/categories for analysis.');
        return;
    }

    // Split and clean input data
    const data = input.split(/[\s,]+/).map(item => item.trim());
    const categories = categoriesInput.split(',').map(item => item.trim());

    const results = categories.map(category => analyzeCategory(data, category));

    // Add total row
    const totalFrequency = results.reduce((sum, row) => sum + row.frequency, 0);
    results.push({
        category: 'Total',
        frequency: totalFrequency,
        percentage: '100%'
    });

    displayAnalysis(results);
    createCharts(results);
}

function analyzeCategory(data, category) {
    let frequency = 0;

    if (!isNaN(category) || category.includes('-') || category.startsWith('<') || category.startsWith('>')) {
        // Numerical category or range
        frequency = analyzeNumericalCategory(data, category);
    } else {
        // Text category
        frequency = data.filter(item => item.toLowerCase() === category.toLowerCase()).length;
    }

    const percentage = ((frequency / data.length) * 100).toFixed(2);
    return { category, frequency, percentage: percentage + '%' };
}

function analyzeNumericalCategory(data, category) {
    const numericalData = data.filter(item => !isNaN(item)).map(Number);

    if (category.includes('-')) {
        // Handle range (e.g., 2-10)
        const [start, end] = category.split('-').map(Number);
        if (isNaN(start) || isNaN(end)) {
            alert(`Invalid range: ${category}`);
            return 0;
        }

        return numericalData.filter(item => item >= start && item <= end).length;
    } else if (category.startsWith('<')) {
        // Handle less than (e.g., <2)
        const limit = Number(category.slice(1).trim());
        if (isNaN(limit)) {
            alert(`Invalid range: ${category}`);
            return 0;
        }

        return numericalData.filter(item => item < limit).length;
    } else if (category.startsWith('>')) {
        // Handle greater than (e.g., >10)
        const limit = Number(category.slice(1).trim());
        if (isNaN(limit)) {
            alert(`Invalid range: ${category}`);
            return 0;
        }

        return numericalData.filter(item => item > limit).length;
    } else {
        // Handle single numerical value
        const target = Number(category);
        if (isNaN(target)) {
            alert(`Invalid category: ${category}`);
            return 0;
        }

        return numericalData.filter(item => item === target).length;
    }
}

function displayAnalysis(results) {
    const table = document.createElement('table');
    table.border = '1';
    table.style.width = '100%';
    table.innerHTML = `
        <tr>
            <th>Category/Range</th>
            <th>Frequency</th>
            <th>Percentage</th>
        </tr>
        ${results.map(row => `
        <tr>
            <td>${row.category}</td>
            <td>${row.frequency}</td>
            <td>${row.percentage}</td>
        </tr>`).join('')}
    `;

    const tableContainer = document.getElementById('analysisTable');
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

function createCharts(results) {
    const labels = results.slice(0, -1).map(row => row.category);
    const frequencies = results.slice(0, -1).map(row => row.frequency);
    const percentages = results.slice(0, -1).map(row => parseFloat(row.percentage));

    // Remove existing charts
    if (window.pieChart) window.pieChart.destroy();
    if (window.barChart) window.barChart.destroy();

    // Create pie chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    window.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Percentage',
                data: percentages,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#FF9800']
            }]
        }
    });

    // Create bar chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    window.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: frequencies,
                backgroundColor: '#36A2EB'
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
}

function exportToWord() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Adding table to PDF
    const table = document.getElementById("analysisTable").innerHTML;
    doc.html(table, {
        callback: function (doc) {
            // Capture pie chart as image
            html2canvas(document.getElementById('pieChart')).then(canvas => {
                const imgDataPie = canvas.toDataURL("image/png");
                doc.addImage(imgDataPie, 'PNG', 10, 100, 180, 160);
                
                // Capture bar chart as image
                html2canvas(document.getElementById('barChart')).then(canvas => {
                    const imgDataBar = canvas.toDataURL("image/png");
                    doc.addImage(imgDataBar, 'PNG', 10, 260, 180, 160);
                    
                    // Save the document
                    doc.save('analysis_report.docx');
                });
            });
        }
    });
}