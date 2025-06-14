document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeSwitcher = document.getElementById('theme-switcher');
    const addInput = document.getElementById('addt');
    const addBtn = document.getElementById('add-btn');
    const todosList = document.getElementById('todos-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const allBtn = document.getElementById('all');
    const activeBtn = document.getElementById('active');
    const completedBtn = document.getElementById('completed');
    
    // State
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let currentTheme = localStorage.getItem('theme') || 'dark';
    let draggedItem = null;
    
    // Initialize
    initTheme();
    updateItemsCount();
    renderTodos();
    setupEventListeners();
    
    // Functions
    function initTheme() {
      if (currentTheme === 'light') {
        document.body.classList.add('light');
        themeSwitcher.querySelector('i').classList.remove('fa-sun');
        themeSwitcher.querySelector('i').classList.add('fa-moon');
      }
    }
    
    function setupEventListeners() {
      // Theme Switching
      themeSwitcher.addEventListener('click', toggleTheme);
      
      // Add Todo
      addBtn.addEventListener('click', addTodo);
      addInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
      });
      
      // Filter Todos
      allBtn.addEventListener('click', () => setFilter('all'));
      activeBtn.addEventListener('click', () => setFilter('active'));
      completedBtn.addEventListener('click', () => setFilter('completed'));
      
      // Clear Completed
      clearCompletedBtn.addEventListener('click', clearCompleted);
      
      // Drag and Drop
      todosList.addEventListener('dragover', handleDragOver);
      todosList.addEventListener('dragstart', handleDragStart);
      todosList.addEventListener('dragend', handleDragEnd);
      todosList.addEventListener('drop', handleDrop);
    }
    
    function toggleTheme() {
      document.body.classList.toggle('light');
      const icon = themeSwitcher.querySelector('i');
      
      if (document.body.classList.contains('light')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
      } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
      }
    }
    
    function addTodo() {
      const text = addInput.value.trim();
      if (text) {
        todos.push({
          id: Date.now(),
          text,
          completed: false
        });
        addInput.value = '';
        saveAndRender();
      }
    }
    
    function toggleTodo(id) {
      todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      saveAndRender();
    }
    
    function deleteTodo(id) {
      const todoElement = document.querySelector(`[data-id="${id}"]`);
      if (todoElement) {
        todoElement.classList.add('fall');
        setTimeout(() => {
          todos = todos.filter(todo => todo.id !== id);
          saveAndRender();
        }, 500);
      }
    }
    
    function clearCompleted() {
      todos = todos.filter(todo => !todo.completed);
      saveAndRender();
    }
    
    function setFilter(filter) {
      currentFilter = filter;
      updateFilterButtons();
      renderTodos();
    }
    
    function updateFilterButtons() {
      allBtn.classList.remove('on');
      activeBtn.classList.remove('on');
      completedBtn.classList.remove('on');
      
      if (currentFilter === 'all') allBtn.classList.add('on');
      if (currentFilter === 'active') activeBtn.classList.add('on');
      if (currentFilter === 'completed') completedBtn.classList.add('on');
    }
    
    function updateItemsCount() {
      const activeCount = todos.filter(todo => !todo.completed).length;
      itemsLeft.textContent = activeCount;
    }
    
    function renderTodos() {
      todosList.innerHTML = '';
      
      if (todos.length === 0) {
        todosList.innerHTML = '<div class="empty-state">هیچ وظیفه‌ای ثبت نشده است</div>';
        return;
      }
      
      let filteredTodos = todos;
      if (currentFilter === 'active') {
        filteredTodos = todos.filter(todo => !todo.completed);
      } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(todo => todo.completed);
      }
      
      if (filteredTodos.length === 0) {
        todosList.innerHTML = '<div class="empty-state">هیچ وظیفه‌ای یافت نشد</div>';
        return;
      }
      
      filteredTodos.forEach(todo => {
        const todoEl = document.createElement('li');
        todoEl.className = `todo-card ${todo.completed ? 'checked' : ''}`;
        todoEl.draggable = true;
        todoEl.dataset.id = todo.id;
        
        todoEl.innerHTML = `
          <div class="cb-container">
            <input type="checkbox" class="cb-input" ${todo.completed ? 'checked' : ''}>
            <span class="check"><i class="fas fa-check"></i></span>
          </div>
          <div class="item">${todo.text}</div>
          <button class="clear-btn"><i class="fas fa-times"></i></button>
        `;
        
        // Add event listeners
        todoEl.querySelector('.cb-input').addEventListener('change', () => toggleTodo(todo.id));
        todoEl.querySelector('.clear-btn').addEventListener('click', () => deleteTodo(todo.id));
        
        todosList.appendChild(todoEl);
      });
    
    }
    
    function saveAndRender() {
      localStorage.setItem('todos', JSON.stringify(todos));
      updateItemsCount();
      renderTodos();
    }
    
    // Drag and Drop Functions
    function handleDragStart(e) {
      if (e.target.classList.contains('todo-card')) {
        draggedItem = e.target;
        setTimeout(() => {
          draggedItem.classList.add('dragging');
        }, 0);
      }
    }
    
    function handleDragOver(e) {
      e.preventDefault();
    }
    
    function handleDragEnd() {
      if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
      }
    }
    
    function handleDrop(e) {
      e.preventDefault();
      if (!draggedItem) return;
      
      const afterElement = getDragAfterElement(todosList, e.clientY);
      if (afterElement) {
        todosList.insertBefore(draggedItem, afterElement);
      } else {
        todosList.appendChild(draggedItem);
      }
      
      updateTodosOrder();
    }
    
    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.todo-card:not(.dragging)')];
      
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
          return { offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    function updateTodosOrder() {
      const newOrder = [...todosList.children].map(el => parseInt(el.dataset.id));
      todos = newOrder.map(id => todos.find(todo => todo.id === id));
      saveToLocalStorage();
    }
    
    function saveToLocalStorage() {
      localStorage.setItem('todos', JSON.stringify(todos));
    }
  });