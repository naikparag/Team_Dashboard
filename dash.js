var APP_GLOBAL

window.chartColors = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
};

function ProcessExcel(file) {
    var reader = new FileReader()
    reader.onload = function () {
        var fileData = reader.result;
        let wb = XLSX.read(fileData, {
            type: 'binary'
        })

        APP_GLOBAL.android = {}
        APP_GLOBAL.ios = {}
        APP_GLOBAL.fe = {}

        identifySheets(wb.SheetNames)
        processRoster(wb.Sheets[APP_GLOBAL.sheetname.roster])
        updateStatus('Roster processed')
        processDemand(wb.Sheets[APP_GLOBAL.sheetname.demand])
        updateStatus('Demand processed')
        processBench(wb.Sheets[APP_GLOBAL.sheetname.bench])
        updateStatus('Bench processed')

        syncGlobal()
        updateDashboard()
    }
    reader.readAsBinaryString(file)
}

function processDemand(sheet) {

    resultJson = XLSX.utils.sheet_to_json(sheet)

    resultJson = _.map(resultJson, function(row){
        row['Role Name'] = row['Role Name'].split('|')[0]
        return row
    })

    demandByRoles = _.groupBy(resultJson, 'Role Name')

    let androidDemand = _.sumBy(demandByRoles['Google Android'], 'Remaining Positions') || 0
    let iosDemand = _.sumBy(demandByRoles['Apple iOS'], 'Remaining Positions') || 0
    let feDemand = _.sumBy(demandByRoles['Digital Front End Development'], 'Remaining Positions') || 0

    APP_GLOBAL.android.demand = androidDemand
    APP_GLOBAL.ios.demand = iosDemand
    APP_GLOBAL.fe.demand = feDemand
}

function processBench(sheet) {

    resultJson = XLSX.utils.sheet_to_json(sheet)

    demandByRoles = _.groupBy(resultJson, 'Primary Skill')

    let androidBench = demandByRoles['Google Android'].length || 0
    let iosBench = demandByRoles['Apple iOS'].length || 0
    let feBench = demandByRoles['Digital Front End Development'].length || 0

    APP_GLOBAL.android.bench = androidBench
    APP_GLOBAL.ios.bench = iosBench
    APP_GLOBAL.fe.bench = feBench

}

function updateStatus(text) {

    let status_parent = document.getElementById('xls_process_result')

    var status_notification = document.createElement('div')
    status_notification.innerHTML = text
    status_notification.className = 'notification is-primary is-light'

    status_parent.appendChild(status_notification)
}

function identifySheets(sheetNames) {

    APP_GLOBAL.sheetname = {}
    const rosterMatch = sheetNames.filter(s => (s.toLowerCase()).includes('roster'))
    APP_GLOBAL.sheetname.roster = rosterMatch[0]
    const demandMatch = sheetNames.filter(s => (s.toLowerCase()).includes('demand'))
    APP_GLOBAL.sheetname.demand = demandMatch[0]
    const benchMatch = sheetNames.filter(s => (s.toLowerCase()).includes('bench'))
    APP_GLOBAL.sheetname.bench = benchMatch[0]
}

function processRoster(sheet) {

    resultJson = XLSX.utils.sheet_to_json(sheet)
    resultiOS = _.filter(resultJson, {
        'Primary Skill': 'Apple iOS'
    })
    resultAndroid = _.filter(resultJson, {
        'Primary Skill': 'Google Android'
    })
    resultFE = _.filter(resultJson, {
        'Primary Skill': 'Digital Front End Development'
    })
    resultMobile = _.filter(resultJson, function (row) {
        return row['Primary Skill'] == 'Xamarin' || row['Primary Skill'] == 'Apple iOS' || row['Primary Skill'] == 'Google Android'
    })

    APP_GLOBAL.result = {}
    APP_GLOBAL.json = resultJson
    APP_GLOBAL.result.iOS = resultiOS
    APP_GLOBAL.result.android = resultAndroid
    APP_GLOBAL.result.mobile = resultMobile
    APP_GLOBAL.result.FE = resultFE

}

// SKILL DISTRIBUTION DASHBOARD

function updateDashboard() {

    let existingData = JSON.parse(sessionStorage.getItem('APP_GLOBAL'))

    if (existingData === null) {
        return
    } else {
        APP_GLOBAL = existingData
    }

    androidDist = _.countBy(APP_GLOBAL.result.android, 'Level Group (Employee) (Current)')
    iOSDist = _.countBy(APP_GLOBAL.result.iOS, 'Level Group (Employee) (Current)')
    feDist = _.countBy(APP_GLOBAL.result.FE, 'Level Group (Employee) (Current)')
    mobileDist = _.countBy(APP_GLOBAL.result.mobile, 'Level Group (Employee) (Current)')

    chartData = [
        getDistDataForChart(androidDist),
        getDistDataForChart(iOSDist),
        getDistDataForChart(mobileDist),
        getDistDataForChart(feDist)
    ]

    chartDataT = _.zip.apply(_, chartData)

    updateDistChart('chart_distribution_num', chartDataT, ['Android', 'iOS', 'Mobile', 'FE'])

    chartDataPct = [
        getPctDist(getDistDataForChart(androidDist)),
        getPctDist(getDistDataForChart(iOSDist)),
        getPctDist(getDistDataForChart(mobileDist)),
        getPctDist(getDistDataForChart(feDist)),
        [1, 7, 27, 40, 25, 0, 0]
    ]

    chartDataPctT = _.zip.apply(_, chartDataPct)

    updateDistChart('chart_distribution_pct', chartDataPctT, ['Android', 'iOS', 'Mobile', 'FE', 'Reference'])
}

function getPctDist(distArray) {
    let sum = _.sum(distArray)
    let pctDist = _.map(distArray, function (x) {
        return Math.round(x * 100 / sum)
    })
    return pctDist
}


function updateDistChart(canvasElementId, chartDataT, labels) {

    let barChartData = {
        labels: labels,
        datasets: [{
            label: 'SM',
            data: chartDataT[0],
            backgroundColor: 'rgba(255, 99, 132, 0.8)'
        }, {
            label: 'M',
            data: chartDataT[1],
            backgroundColor: 'rgba(54, 162, 235, 0.8)'
        }, {
            label: 'SCon',
            data: chartDataT[2],
            backgroundColor: 'rgba(255, 206, 86, 0.8)'
        }, {
            label: 'Con',
            data: chartDataT[3],
            backgroundColor: 'rgba(75, 192, 192, 0.8)'
        }, {
            label: 'AA/BTA',
            data: chartDataT[4],
            backgroundColor: 'rgba(153, 102, 255, 0.8)'
        }, {
            label: 'Intern',
            data: chartDataT[5],
            backgroundColor: 'rgba(255, 159, 64, 0.8)'
        }, {
            label: 'Others',
            data: chartDataT[6],
            backgroundColor: 'rgba(255, 99, 132, 0.8)'
        }]
    }

    let ctxDistribution = document.getElementById(canvasElementId).getContext('2d');
    new Chart(ctxDistribution, {
        type: 'horizontalBar',
        data: barChartData,
        options: {
            tooltips: {
                mode: 'index',
                intersect: false
            },
            responsive: true,
            scales: {
                xAxes: [{
                    stacked: true,
                }],
                yAxes: [{
                    stacked: true
                }]
            }
        }
    })
}

function getDistDataForChart(dist) {
    let result = []
    result.push(dist['SR Manager'] || 0)
    result.push(dist['Manager'] || 0)
    result.push(dist['Senior/Senior Consultant'] || 0)
    result.push(dist['Staff/Consultant'] || 0)
    result.push(dist['Junior Staff/Analyst'] || 0)
    result.push(dist['Intern'] || 0)
    result.push(dist['Client Service-Other Support'] || 0)

    return result
}

// INIT

function init() {
    // get data from local storage and display
    // document.getElementById('team_textarea').innerHTML = window.localStorage.getItem('team_data')
    APP_GLOBAL = {}
    APP_GLOBAL.status = 'start'
    updateDashboard()
}

init()


// HANDLE TABS

function resetTabs() {
    var tabs = Array.from(document.getElementById("tabs").getElementsByTagName("li"))
    tabs.forEach(tab => {
        tab.classList.remove('is-active')
    });

    var tabContainers = Array.from(document.getElementById("tab_containers").querySelectorAll('.tab_container'))
    tabContainers.forEach(tabContainer => {
        // tabContainer.classList.remove('display-block')
        tabContainer.classList.add('display-none')
    })
}

function updateTab(tabName) {
    var tab = document.getElementById(tabName)
    resetTabs()
    tab.classList.add('is-active')

    var tabContainer = document.getElementById(tabName + '_container')
    tabContainer.classList.remove('display-none')
}

// HANDLE DRAG DROP

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                let file = ev.dataTransfer.files[0]
                console.log('... file[' + i + '].name = ' + file.name)

                ProcessExcel(file)
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

// HELPER FUNCTIONS

function dispalyStats() {
    let result = APP_GLOBAL.result

    console.log(_.countBy(result.iOS, 'Level Group (Employee) (Current)'))
}

function syncGlobal() {
    sessionStorage.setItem('APP_GLOBAL', JSON.stringify(APP_GLOBAL))
}