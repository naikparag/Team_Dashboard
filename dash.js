function resetTabs() {
    var tabs = Array.from(document.getElementById("tabs").getElementsByTagName("li"))
    tabs.forEach(tab => {
        tab.classList.remove('is-active')
    });

    var tabContainers = Array.from(document.getElementById("tab_containers").querySelectorAll('.tab_container'))
    tabContainers.forEach(tabContainer => {
        tabContainer.classList.remove('display-block')
        tabContainer.classList.add('display-none')
    })
}

function updateTab(tabName) {
    var tab = document.getElementById(tabName)
    resetTabs()
    tab.classList.add('is-active')

    var tabContainer = document.getElementById(tabName+'_container')
    tabContainer.classList.remove('display-none')
    tabContainer.classList.add('display-block')
}

function save() {
    var teamData = document.getElementById('team_textarea').value
    window.localStorage.setItem('team_data', teamData);
}

function init() {
    // get data from local storage and display
    document.getElementById('team_textarea').innerHTML = window.localStorage.getItem('team_data');
}

init()