(function () {
  var api = window.CONTROLLER_URL || 'http://localhost:8082';
  var token = sessionStorage.getItem('controllerToken');
  var status = document.getElementById('status');
  var apps = document.getElementById('apps');
  function showApps() {
    if (!token) return;
    fetch(api + '/apps', { headers: { authorization: 'Bearer ' + token } }).then(function (r) { return r.json(); }).then(function (data) {
      apps.hidden = false; document.getElementById('app-list').textContent = JSON.stringify(data.apps, null, 2); status.textContent = 'Authenticated';
    }).catch(function () { status.textContent = 'Controller is unavailable'; });
  }
  document.getElementById('login').addEventListener('submit', function (event) {
    event.preventDefault(); var form = new FormData(event.target);
    fetch(api + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form)) }).then(function (r) { return r.json(); }).then(function (data) {
      if (!data.token) { status.textContent = 'Sign-in failed'; return; } token = data.token; sessionStorage.setItem('controllerToken', token); showApps();
    });
  });
  document.getElementById('refresh').addEventListener('click', showApps); showApps();
}());
