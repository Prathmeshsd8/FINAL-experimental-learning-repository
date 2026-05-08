/* =====================================================================
   script.js — External JavaScript for Nagpur Weather Dashboard
   Populates UI with demo Nagpur data, handles navigation between pages,
   search simulation, forecast expansion, filtering and sorting of metrics.
   Replace simulated data with real API calls (OpenWeatherMap, WeatherAPI).
   ===================================================================== */

(function () {
  // ---------- Demo data (Nagpur) ----------
  const demo = {
    city: "Nagpur, India",
    localTime: "Friday, 8 May 2026 • 20:03 IST",
    temperature: 34,
    feelsLike: 36,
    humidity: 60,
    wind: { speed: 14, dir: "NE" },
    pressure: 1011,
    uv: 7,
    sunrise: "05:40 AM",
    sunset: "06:50 PM",
    aqi: { value: 55, label: "Good" },
    visibility: "10 km",
    condition: { text: "Partly Cloudy", icon: "fa-cloud-sun" },
    forecast: [
      { day: "Mon", icon: "fa-cloud-sun", high: 35, low: 25, precip: 10 },
      { day: "Tue", icon: "fa-cloud-showers-heavy", high: 33, low: 24, precip: 60 },
      { day: "Wed", icon: "fa-bolt", high: 34, low: 26, precip: 45 },
      { day: "Thu", icon: "fa-cloud", high: 36, low: 27, precip: 5 },
      { day: "Fri", icon: "fa-sun", high: 37, low: 28, precip: 0 },
      { day: "Sat", icon: "fa-cloud-sun-rain", high: 34, low: 25, precip: 40 },
      { day: "Sun", icon: "fa-smog", high: 32, low: 24, precip: 15 }
    ]
  };

  // A longer metrics list for details table
  const baseMetrics = [
    { name: "Temperature", value: demo.temperature, unit: "°C", trend: "+1", notes: "Feels warm" },
    { name: "Feels Like", value: demo.feelsLike, unit: "°C", trend: "+1", notes: "Heat index" },
    { name: "Humidity", value: demo.humidity, unit: "%", trend: "-2", notes: "Comfortable" },
    { name: "Wind Speed", value: demo.wind.speed, unit: "km/h", trend: "0", notes: demo.wind.dir + " " + demo.wind.speed + " km/h" },
    { name: "Pressure", value: demo.pressure, unit: "hPa", trend: "-1", notes: "Stable" },
    { name: "UV Index", value: demo.uv, unit: "", trend: "+1", notes: "High - use protection" },
    { name: "Visibility", value: 10, unit: "km", trend: "0", notes: "Good" },
    { name: "Dew Point", value: 24, unit: "°C", trend: "+1", notes: "Moderate" },
    { name: "Cloud Cover", value: 40, unit: "%", trend: "-5", notes: "Partly cloudy" },
    { name: "Air Quality Index", value: demo.aqi.value, unit: "AQI", trend: "-5", notes: demo.aqi.label }
  ];

  // Expand metrics to create a longer table
  const metrics = [];
  for (let i = 0; i < 6; i++) {
    baseMetrics.forEach(m => {
      const clone = Object.assign({}, m);
      if (i > 0) clone.name = `${m.name} • ${i + 1}`;
      metrics.push(clone);
    });
  }

  // ---------- Helpers ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ---------- Populate Home ----------
  function populateHome(data) {
    $('#cityName').textContent = data.city;
    $('#localTime').textContent = data.localTime;
    $('#tempValue').innerHTML = data.temperature + '<span class="deg">°C</span>';
    $('#feelsLike').textContent = 'Feels like ' + data.feelsLike + '°C';
    $('#conditionText').textContent = data.condition.text;
    $('#statHumidity').textContent = data.humidity + '%';
    $('#statWind').textContent = data.wind.speed + ' km/h';
    $('#statPressure').textContent = data.pressure + ' hPa';
    $('#statUV').textContent = data.uv;
    $('#previewSunrise').textContent = data.sunrise;
    $('#previewSunset').textContent = data.sunset;
    $('#previewAQI').textContent = `${data.aqi.label} (AQI ${data.aqi.value})`;
    $('#previewVisibility').textContent = data.visibility;
    $('#widgetSun').textContent = `Sunrise ${data.sunrise} • Sunset ${data.sunset}`;
    $('#widgetAQI').textContent = `${data.aqi.label} • AQI ${data.aqi.value}`;

    const iconEl = $('#mainIcon');
    iconEl.className = 'fa-solid ' + data.condition.icon + ' large-icon';
    iconEl.setAttribute('title', data.condition.text);
  }

  // ---------- Populate Forecast ----------
  function populateForecast(list) {
    const strip = $('#forecastStrip');
    strip.innerHTML = '';
    list.forEach((d, idx) => {
      const card = document.createElement('article');
      card.className = 'forecast-card';
      card.innerHTML = `
        <div class="top">
          <div class="day">${d.day}</div>
          <div class="icon"><i class="fa-solid ${d.icon}"></i></div>
        </div>
        <div class="temps">
          <div style="font-weight:700">${d.high}° / ${d.low}°</div>
          <div class="muted" style="margin-top:6px">Precip ${d.precip}%</div>
        </div>
        <div class="details">
          <div class="muted"><i class="fa-solid fa-droplet"></i> ${d.precip}%</div>
          <div class="muted"><i class="fa-solid fa-wind"></i> 12 km/h</div>
          <div><button class="expandBtn btn-small" data-idx="${idx}">Expand</button></div>
        </div>
        <div class="expandable" aria-hidden="true">
          <div class="hourly"></div>
        </div>
      `;
      strip.appendChild(card);

      // Expand handler
      const btn = card.querySelector('.expandBtn');
      const panel = card.querySelector('.expandable');
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('data-open') === 'true';
        if (open) {
          panel.style.display = 'none';
          panel.setAttribute('aria-hidden', 'true');
          btn.setAttribute('data-open', 'false');
          btn.textContent = 'Expand';
        } else {
          // populate hourly
          const hourly = panel.querySelector('.hourly');
          hourly.innerHTML = '';
          const hours = generateHourly(6, 18, d.high, d.low);
          hours.forEach(h => {
            const hEl = document.createElement('div');
            hEl.className = 'hour';
            hEl.innerHTML = `<div style="font-weight:700">${h.hour}</div>
                             <div style="font-size:18px;margin:6px 0"><i class="fa-solid ${h.icon}" style="color:var(--accent)"></i></div>
                             <div style="font-size:13px;color:var(--muted)">${h.temp}° • ${h.precip}%</div>`;
            hourly.appendChild(hEl);
          });
          panel.style.display = 'block';
          panel.setAttribute('aria-hidden', 'false');
          btn.setAttribute('data-open', 'true');
          btn.textContent = 'Collapse';
          card.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      });
    });
  }

  function generateHourly(start, end, high, low) {
    const arr = [];
    for (let h = start; h <= end; h++) {
      const temp = Math.round(low + Math.random() * (high - low));
      const precip = Math.round(Math.random() * 60);
      const icon = pickIcon(temp);
      arr.push({ hour: `${h}:00`, temp, precip, icon });
    }
    return arr;
  }

  function pickIcon(temp) {
    if (temp >= 36) return 'fa-sun';
    if (temp >= 32) return 'fa-cloud-sun';
    if (temp >= 28) return 'fa-cloud';
    return 'fa-cloud-showers-heavy';
  }

  // ---------- Populate Mini Forecast (sidebar) ----------
  function populateMini(list) {
    const container = $('#miniForecast');
    container.innerHTML = '';
    list.forEach(d => {
      const el = document.createElement('div');
      el.className = 'mini-card';
      el.innerHTML = `<div class="day">${d.day}</div>
                      <div class="icon"><i class="fa-solid ${d.icon}"></i></div>
                      <div class="temps">${d.high}° / ${d.low}°</div>`;
      container.appendChild(el);
    });
  }

  // ---------- Populate Metrics Table ----------
  function renderMetrics(list) {
    const tbody = $('#metricsBody');
    tbody.innerHTML = '';
    list.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.name}</td>
                      <td>${row.value}</td>
                      <td>${row.unit || ''}</td>
                      <td>${row.trend || ''}</td>
                      <td>${row.notes || ''}</td>`;
      tbody.appendChild(tr);
    });
  }

  // ---------- Navigation ----------
  function setupNavigation() {
    const navBtns = $$('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        const target = btn.getAttribute('data-target');
        showPage(target);
      });
    });

    $('#openForecast').addEventListener('click', () => {
      document.querySelector('.nav-btn[data-target="forecast"]').click();
    });
    $('#openDetails').addEventListener('click', () => {
      document.querySelector('.nav-btn[data-target="details"]').click();
    });

    $('#refreshBtn').addEventListener('click', (e) => {
      e.preventDefault();
      // small rotation animation
      const el = e.currentTarget;
      el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700 });
      // simulate update
      setTimeout(() => {
        demo.temperature += Math.random() > 0.5 ? 1 : -1;
        demo.feelsLike = demo.temperature + 2;
        demo.humidity = Math.max(30, Math.min(90, demo.humidity + Math.round(Math.random() * 6 - 3)));
        populateHome(demo);
      }, 700);
    });
  }

  function showPage(name) {
    $$('.page').forEach(p => p.classList.add('hidden'));
    const target = $(`#${name}`);
    if (target) target.classList.remove('hidden');
  }

  // ---------- Search (simulated) ----------
  function setupSearch() {
    $('#searchBtn').addEventListener('click', () => {
      const q = $('#cityInput').value.trim();
      if (!q) {
        $('#cityInput').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
        return;
      }
      if (/nagpur/i.test(q)) {
        populateHome(demo);
        populateForecast(demo.forecast);
        populateMini(demo.forecast);
        alert('Showing demo data for Nagpur.');
      } else {
        // simulate alternate city
        const alt = JSON.parse(JSON.stringify(demo));
        alt.city = q + ', India';
        alt.temperature = Math.round(demo.temperature + (Math.random() * 6 - 3));
        alt.feelsLike = alt.temperature + 1;
        alt.humidity = Math.max(20, Math.min(95, demo.humidity + Math.round(Math.random() * 10 - 5)));
        populateHome(alt);
        populateForecast(alt.forecast);
        populateMini(alt.forecast);
        alert('Demo: simulated data for ' + q + '. Replace with API integration for live results.');
      }
    });

    $('#cityInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#searchBtn').click();
    });
  }

  // ---------- Filtering & Sorting ----------
  function setupTableControls() {
    const filterInput = $('#filterInput');
    const sortSelect = $('#sortSelect');

    function apply() {
      let list = metrics.slice();
      const q = filterInput.value.trim().toLowerCase();
      if (q) {
        list = list.filter(r => r.name.toLowerCase().includes(q) || (r.notes && r.notes.toLowerCase().includes(q)));
      }
      const sort = sortSelect.value;
      if (sort === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
      if (sort === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
      if (sort === 'value-asc') list.sort((a, b) => Number(a.value) - Number(b.value));
      if (sort === 'value-desc') list.sort((a, b) => Number(b.value) - Number(a.value));
      renderMetrics(list);
    }

    filterInput.addEventListener('input', apply);
    sortSelect.addEventListener('change', apply);
    $('#exportBtn').addEventListener('click', () => {
      alert('Export demo: integrate CSV/XLSX export in production.');
    });

    // initial render
    renderMetrics(metrics);
  }

  // ---------- Init ----------
  function init() {
    populateHome(demo);
    populateForecast(demo.forecast);
    populateMini(demo.forecast);
    setupNavigation();
    setupSearch();
    setupTableControls();
    // announce loaded
    const live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    live.style.position = 'absolute';
    live.style.left = '-9999px';
    live.textContent = `Nagpur weather dashboard loaded. Current temperature ${demo.temperature} degrees Celsius.`;
    document.body.appendChild(live);
  }

  // Run
  init();

})();
