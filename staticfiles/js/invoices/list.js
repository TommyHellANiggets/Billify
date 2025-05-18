document.addEventListener('DOMContentLoaded', () => {
    // Плавная анимация для статистики
    animateCounters();
    
    // Фильтрация таблицы счетов
    const invoiceFilter = document.getElementById('invoice-filter');
    if (invoiceFilter) {
        invoiceFilter.addEventListener('input', filterInvoices);
    }
    
    // Инициализация всплывающих подсказок
    initTooltips();
    
    // Обработчики для плиток категорий
    const categoryTiles = document.querySelectorAll('.category-tile');
    categoryTiles.forEach(tile => {
        tile.addEventListener('click', function() {
            const url = this.dataset.url;
            if (url) {
                window.location.href = url;
            }
        });
    });
    
    // Подсветка текущего типа фильтрации
    const urlParams = new URLSearchParams(window.location.search);
    const currentType = urlParams.get('type');
    const currentStatus = urlParams.get('status');
    
    if (currentType) {
        const typeSelect = document.querySelector('select[name="type"]');
        if (typeSelect) {
            typeSelect.value = currentType;
        }
    }
    
    if (currentStatus) {
        const statusSelect = document.querySelector('select[name="status"]');
        if (statusSelect) {
            statusSelect.value = currentStatus;
        }
    }
    
    // Адаптивные улучшения для мобильных устройств
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    adjustForMobile(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', (e) => {
        adjustForMobile(e.matches);
    });
});

// Анимация для счетчиков статистики
function animateCounters() {
    const counters = document.querySelectorAll('.stat-value');
    
    counters.forEach(counter => {
        const targetValue = parseInt(counter.getAttribute('data-value'), 10);
        const duration = 1000; // ms
        const stepTime = 20;
        const steps = duration / stepTime;
        const stepValue = targetValue / steps;
        let currentValue = 0;
        
        function updateCounter() {
            currentValue += stepValue;
            if (currentValue < targetValue) {
                counter.textContent = Math.round(currentValue);
                setTimeout(updateCounter, stepTime);
            } else {
                counter.textContent = targetValue;
            }
        }
        
        updateCounter();
    });
}

// Фильтрация таблицы счетов
function filterInvoices() {
    const filterValue = this.value.toLowerCase();
    const tableRows = document.querySelectorAll('.invoice-table tbody tr');
    
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(filterValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Показать сообщение, если нет совпадений
    const tbody = document.querySelector('.invoice-table tbody');
    const visibleRows = tbody.querySelectorAll('tr[style=""]').length;
    
    let emptyRow = tbody.querySelector('.empty-filter-results');
    
    if (visibleRows === 0) {
        if (!emptyRow) {
            emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-filter-results';
            const cell = document.createElement('td');
            cell.colSpan = '6'; // Количество колонок в таблице
            cell.className = 'empty-table';
            cell.textContent = 'Совпадений не найдено';
            emptyRow.appendChild(cell);
            tbody.appendChild(emptyRow);
        }
    } else if (emptyRow) {
        tbody.removeChild(emptyRow);
    }
}

// Инициализация всплывающих подсказок
function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', function() {
            const tooltipText = this.dataset.tooltip;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = tooltipText;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
            tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
            tooltip.style.opacity = '1';
            
            this.addEventListener('mouseleave', function() {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    });
}

function adjustForMobile(isMobile) {
    if (isMobile) {
        // Действия для мобильных устройств
        const actionButtons = document.querySelectorAll('.actions .btn-action');
        actionButtons.forEach(button => {
            // Убедиться, что кнопки хорошо видны на мобильных
            button.style.padding = '8px';
        });
    } else {
        // Вернуть нормальный вид для настольных устройств
        const actionButtons = document.querySelectorAll('.actions .btn-action');
        actionButtons.forEach(button => {
            button.style.padding = '';
        });
    }
} 