window.gdmApp = window.gdmApp || {};

(function () {
  const appState = window.gdmApp;
  const ministryCards = document.getElementById('ministryCards');
  const ministryTableBody = document.getElementById('ministryTableBody');
  const ministriesSearch = document.getElementById('ministriesSearch');

  function renderMinistries(filter = '') {
    const query = filter.toLowerCase();
    const source = appState.ministries || appState.dashboardData?.ministries || [];
    console.log("MINISTRY DATA:", source);
    const filtered = source.filter((ministry) => {
      const title = (ministry.title || '').toLowerCase();
      const lead = (ministry.lead || '').toLowerCase();
      const focus = (ministry.focus || '').toLowerCase();
      return title.includes(query) || lead.includes(query) || focus.includes(query);
    });

    if (ministryCards) {
      ministryCards.innerHTML = '';
      filtered.forEach((ministry) => {
        const card = document.createElement('article');
        card.className = 'ministry-card';
        card.innerHTML = `
          <h4>${ministry.title}</h4>
          <p>${ministry.focus}</p>
          <div class="progress-bar"><span style="width:${ministry.progress}%"></span></div>
          <div class="timeline-meta"><span>${ministry.members} members</span><strong>${ministry.status}</strong></div>
        `;
        ministryCards.appendChild(card);
      });
    }

    if (ministryTableBody) {
      ministryTableBody.innerHTML = '';
      filtered.forEach((ministry) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${ministry.title}</td>
          <td>${ministry.lead}</td>
          <td>${ministry.progress}%</td>
          <td>${ministry.members}</td>
          <td>${ministry.status}</td>
        `;
        ministryTableBody.appendChild(row);
      });
    }
  }

  if (ministriesSearch) {
    ministriesSearch.addEventListener('input', () => {
        renderMinistries(ministriesSearch.value);
    });
}


function initialMinistryRender(){

    if(
        appState.ministries &&
        appState.ministries.length > 0
    ){

        renderMinistries();

    }

}


if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialMinistryRender
    );

} else {

    initialMinistryRender();

}

  appState.renderMinistries = renderMinistries;


// Wait for Firestore data update
document.addEventListener("gdmDataLoaded", () => {

    console.log(
      "Firestore data received, rendering ministries..."
    );

    renderMinistries();

});

})();
