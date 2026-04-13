import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the weather widget html to include a subtitle
search_weather = """            <span style="font-size: 14px; font-weight: 600; color: var(--text-sub);" data-translate="widget_weather_city">Deggendorf</span>
            <span style="font-size: 32px; font-weight: 300;" id="weather-temp">18°C</span>
            <span style="font-size: 12px; color: var(--text-sub);" id="weather-desc" data-translate="widget_weather_desc">Leicht bewölkt</span>"""

replace_weather = """            <div style="display: flex; align-items: baseline; gap: 6px;">
                <span style="font-size: 14px; font-weight: 600; color: var(--text-main);" data-translate="widget_weather_city">Deggendorf</span>
                <span style="font-size: 12px; font-weight: 500; color: var(--accent-blue);" id="weather-time" data-translate="widget_weather_today">Heute</span>
            </div>
            <span style="font-size: 32px; font-weight: 300;" id="weather-temp">18°C</span>
            <span style="font-size: 12px; color: var(--text-sub);" id="weather-desc" data-translate="widget_weather_desc">Leicht bewölkt</span>"""

content = content.replace(search_weather, replace_weather)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Add translation strings to app.js
search_tr_de = """        widget_todo: "To-Do Liste","""
replace_tr_de = """        widget_todo: "To-Do Liste",\n        widget_weather_today: "Heute",\n        widget_weather_tomorrow: "Morgen","""
app_js = app_js.replace(search_tr_de, replace_tr_de)

search_tr_en = """        widget_todo: "To-Do List","""
replace_tr_en = """        widget_todo: "To-Do List",\n        widget_weather_today: "Today",\n        widget_weather_tomorrow: "Tomorrow","""
app_js = app_js.replace(search_tr_en, replace_tr_en)

search_tr_fi = """        widget_todo: "Tehtävälista","""
replace_tr_fi = """        widget_todo: "Tehtävälista",\n        widget_weather_today: "Tänään",\n        widget_weather_tomorrow: "Huomenna","""
app_js = app_js.replace(search_tr_fi, replace_tr_fi)

# Update the toggle logic
search_toggle_weather = """function toggleWeatherDetails() {
    const desc = document.getElementById('weather-desc');
    if (desc) {
        if (desc.innerText.includes('Regen')) {
            desc.innerText = currentLanguage === 'de' ? 'Leicht bewölkt' : (currentLanguage === 'fi' ? 'Puolipilvistä' : 'Partly cloudy');
            document.getElementById('weather-temp').innerText = '18°C';
        } else {
            desc.innerText = currentLanguage === 'de' ? 'Regen' : (currentLanguage === 'fi' ? 'Sade' : 'Rain');
            document.getElementById('weather-temp').innerText = '12°C';
        }
    }
}"""

replace_toggle_weather = """function toggleWeatherDetails() {
    const timeEl = document.getElementById('weather-time');
    const descEl = document.getElementById('weather-desc');
    const tempEl = document.getElementById('weather-temp');

    if (timeEl && descEl && tempEl) {
        if (timeEl.getAttribute('data-translate') === 'widget_weather_tomorrow') {
            timeEl.setAttribute('data-translate', 'widget_weather_today');
            timeEl.innerText = translations[currentLanguage].widget_weather_today;

            descEl.innerText = currentLanguage === 'de' ? 'Leicht bewölkt' : (currentLanguage === 'fi' ? 'Puolipilvistä' : 'Partly cloudy');
            tempEl.innerText = '18°C';
        } else {
            timeEl.setAttribute('data-translate', 'widget_weather_tomorrow');
            timeEl.innerText = translations[currentLanguage].widget_weather_tomorrow;

            descEl.innerText = currentLanguage === 'de' ? 'Regen' : (currentLanguage === 'fi' ? 'Sade' : 'Rain');
            tempEl.innerText = '12°C';
        }
    }
}"""

app_js = app_js.replace(search_toggle_weather, replace_toggle_weather)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print("Weather logic and translations updated.")
