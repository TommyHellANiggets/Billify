document.addEventListener('DOMContentLoaded', function() {
    // Автоматическая отправка формы при изменении select
    const typeFilter = document.querySelector('.type-filter select');
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            this.closest('form').submit();
        });
    }
    
    // Динамическая подсветка строк таблицы при наведении
    const tableRows = document.querySelectorAll('.clients-list tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(0, 102, 204, 0.05)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });
    
    // Анимация появления элементов списка
    const animateRows = function() {
        const rows = document.querySelectorAll('.clients-list tbody tr');
        
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 50 * index);
        });
    };
    
    // Запускаем анимацию
    animateRows();
}); 