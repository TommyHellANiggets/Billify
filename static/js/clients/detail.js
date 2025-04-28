document.addEventListener('DOMContentLoaded', function() {
    // Анимация появления секций
    const sections = document.querySelectorAll('.client-info-section, .related-section');
    
    sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Подсветка пустых полей серым цветом
    const emptyValues = document.querySelectorAll('.info-value');
    
    emptyValues.forEach(valueEl => {
        if (valueEl.textContent.trim() === 'Не указано') {
            valueEl.style.color = '#999';
            valueEl.style.fontStyle = 'italic';
        }
    });
    
    // Обработчик клика по кнопке удаления
    const deleteButton = document.querySelector('.action-buttons .btn-secondary');
    
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            if (!confirm('Вы уверены, что хотите удалить этого клиента?')) {
                e.preventDefault();
            }
        });
    }
}); 