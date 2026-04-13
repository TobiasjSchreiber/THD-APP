import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

search_render = """        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(textSpan);
        list.appendChild(itemDiv);
    });
}"""

replace_render = """        const deleteBtn = document.createElement('div');
        deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        deleteBtn.style.color = "var(--text-sub)";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.padding = "4px";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTodo(idx);
        };

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(textSpan);
        itemDiv.appendChild(deleteBtn);
        list.appendChild(itemDiv);
    });
}

function deleteTodo(index) {
    todoItems.splice(index, 1);
    renderTodos();
    saveTodos();
}"""

content = content.replace(search_render, replace_render)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js updated.")
