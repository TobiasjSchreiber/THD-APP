import re

with open('app.js', 'r') as f:
    content = f.read()

# Let's try simpler regex or find string
start_idx = content.find('function toggleWeatherDetails() {')
if start_idx != -1:
    # find the end of the function. We know it ends around '    }\n}'
    end_idx = content.find('    }\n}\n', start_idx)
    if end_idx != -1:
        end_idx += 7 # include the '    }\n}\n'
        old_func = content[start_idx:end_idx]

        new_code = """let currentForecastIndex = 0;

function getWeatherForecasts() {
    const today = currentLanguage === 'de' ? '(Heute)' : (currentLanguage === 'fi' ? '(Tänään)' : '(Today)');
    const tomorrow = currentLanguage === 'de' ? '(Morgen)' : (currentLanguage === 'fi' ? '(Huomenna)' : '(Tomorrow)');
    const day3 = currentLanguage === 'de' ? '(Übermorgen)' : (currentLanguage === 'fi' ? '(Ylihuomenna)' : '(Day after tomorrow)');
    const day4 = currentLanguage === 'de' ? '(In 3 Tagen)' : (currentLanguage === 'fi' ? '(3 päivän päästä)' : '(In 3 days)');

    return [
        {
            temp: '18°C',
            desc: currentLanguage === 'de' ? 'Leicht bewölkt' : (currentLanguage === 'fi' ? 'Puolipilvistä' : 'Partly cloudy'),
            dayStr: '', // Empty for today to keep it clean
            condition: 'cloudy'
        },
        {
            temp: '12°C',
            desc: currentLanguage === 'de' ? 'Regen' : (currentLanguage === 'fi' ? 'Sade' : 'Rain'),
            dayStr: tomorrow,
            condition: 'rain'
        },
        {
            temp: '22°C',
            desc: currentLanguage === 'de' ? 'Sonnig' : (currentLanguage === 'fi' ? 'Aurinkoista' : 'Sunny'),
            dayStr: day3,
            condition: 'sunny'
        },
        {
            temp: '-2°C',
            desc: currentLanguage === 'de' ? 'Schnee' : (currentLanguage === 'fi' ? 'Lumisade' : 'Snow'),
            dayStr: day4,
            condition: 'snow'
        }
    ];
}

function getWeatherSvg(condition) {
    if (condition === 'sunny') {
        return `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #FF9500; overflow: visible;">
            <g class="weather-sun">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </g>
        </svg>`;
    } else if (condition === 'snow') {
        return `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #A0C4FF; overflow: visible;">
            <path d="M12 2v20M17 7l-10 10M22 12H2M17 17L7 7" />
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
            <circle cx="16" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="18" cy="16" r="1.5" fill="currentColor"/>
        </svg>`;
    } else if (condition === 'rain') {
        return `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #4A90E2; overflow: visible;">
            <line class="weather-drop-1" x1="8" y1="19" x2="8" y2="21"></line>
            <line class="weather-drop-2" x1="12" y1="19" x2="12" y2="21"></line>
            <line class="weather-drop-3" x1="16" y1="19" x2="16" y2="21"></line>
            <path class="weather-cloud" style="fill: var(--card-bg); stroke: var(--text-main);" d="M7 19h10a4.5 4.5 0 0 0 .68-8.95a6 6 0 0 0-11.36 0A4.5 4.5 0 0 0 7 19Z"></path>
        </svg>`;
    } else { // cloudy
        return `<svg viewBox="0 0 24 24" width="100%" height="100%" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #FF9500; overflow: visible;">
            <g class="weather-sun">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </g>
            <path class="weather-cloud" style="fill: var(--card-bg); stroke: var(--text-main);" d="M7 19h10a4.5 4.5 0 0 0 .68-8.95a6 6 0 0 0-11.36 0A4.5 4.5 0 0 0 7 19Z"></path>
        </svg>`;
    }
}

function updateWeatherWidget() {
    const desc = document.getElementById('weather-desc');
    const weatherIconContainer = document.getElementById('weather-icon-container');
    const settingsWeatherIconContainer = document.getElementById('settings-weather-icon-container');

    const forecasts = getWeatherForecasts();
    const currentForecast = forecasts[currentForecastIndex];

    if (desc) {
        desc.innerText = currentForecast.desc;
        document.getElementById('weather-temp').innerText = currentForecast.temp;
        const locationText = currentForecast.dayStr ? `Deggendorf ${currentForecast.dayStr}` : 'Deggendorf';
        document.querySelector('[data-translate="widget_weather_city"]').innerText = locationText;

        const svgCode = getWeatherSvg(currentForecast.condition);
        if (weatherIconContainer) {
            weatherIconContainer.innerHTML = svgCode;
            weatherIconContainer.dataset.condition = currentForecast.condition;
        }
        if (settingsWeatherIconContainer) settingsWeatherIconContainer.innerHTML = svgCode;
    }
}\n"""
        content = content[:start_idx] + new_code + content[end_idx:]
        with open('app.js', 'w') as f:
            f.write(content)
        print("Replaced toggleWeatherDetails successfully using find.")
    else:
        print("End index not found.")
else:
    print("Start index not found.")
