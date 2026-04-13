import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure loadTodos() is also called when setup is NOT completed (or move it to DOMContentLoaded)
search_init = """      loadAllData();
      ensureMailIds();
      initMailTimestamps();"""

replace_init = """      loadAllData();
      loadTodos();
      ensureMailIds();
      initMailTimestamps();"""

content = content.replace(search_init, replace_init)

# Remove the redundant loadTodos() from the end of loadAllData()
search_end = """        calculateGPAFromList(); // Den anfänglichen Notenschnitt ebenfalls korrekt aus der Liste laden
        loadTodos();
    }"""

replace_end = """        calculateGPAFromList(); // Den anfänglichen Notenschnitt ebenfalls korrekt aus der Liste laden
    }"""
content = content.replace(search_end, replace_end)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js updated.")
