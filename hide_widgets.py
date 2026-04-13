import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove checked attribute from weather and todo toggles
search_weather_toggle = """<input type="checkbox" class="toggle-input" checked onchange="toggleWidget('widget-weather', this)">"""
replace_weather_toggle = """<input type="checkbox" class="toggle-input" onchange="toggleWidget('widget-weather', this)">"""
content = content.replace(search_weather_toggle, replace_weather_toggle)

search_todo_toggle = """<input type="checkbox" class="toggle-input" checked onchange="toggleWidget('widget-todo', this)">"""
replace_todo_toggle = """<input type="checkbox" class="toggle-input" onchange="toggleWidget('widget-todo', this)">"""
content = content.replace(search_todo_toggle, replace_todo_toggle)

# Hide them by default on the dashboard
search_weather_widget = """<div class="weather-card" id="widget-weather" onclick="toggleWeatherDetails()" style="cursor: pointer;">"""
replace_weather_widget = """<div class="weather-card widget-hidden" id="widget-weather" onclick="toggleWeatherDetails()" style="cursor: pointer;">"""
content = content.replace(search_weather_widget, replace_weather_widget)

search_todo_widget = """<div class="todo-card" id="widget-todo">"""
replace_todo_widget = """<div class="todo-card widget-hidden" id="widget-todo">"""
content = content.replace(search_todo_widget, replace_todo_widget)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Widgets disabled by default.")
