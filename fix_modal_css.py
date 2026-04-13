import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

search_modal = """      <div class="modal-info" style="margin-bottom: 20px; max-height: 60vh; overflow-y: auto; padding-right: 5px;">"""
replace_modal = """      <div class="modal-info" style="margin-bottom: 20px; max-height: 60vh; overflow-y: auto; overflow-x: hidden; padding-right: 5px; box-sizing: border-box;">"""
content = content.replace(search_modal, replace_modal)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("index.html modal css fixed.")
