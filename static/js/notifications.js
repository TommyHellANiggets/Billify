/**
 * Функция для создания воздушных уведомлений в интерфейсе
 * @param {string} message - Текст сообщения
 * @param {string} type - Тип уведомления (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Получаем контейнер для уведомлений
    const container = document.getElementById('notifications-container');
    if (!container) return;
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-air`;
    
    // Подбираем цвет в зависимости от типа
    let color = '#3498db'; // info - голубой
    let iconName = 'fa-info-circle';
    
    if (type === 'success') {
        color = '#2ecc71'; // зеленый
        iconName = 'fa-check-circle';
    } else if (type === 'error') {
        color = '#e74c3c'; // красный
        iconName = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        color = '#f39c12'; // оранжевый
        iconName = 'fa-exclamation-triangle';
    }
    
    // Формируем содержимое уведомления
    notification.innerHTML = `
        <div class="notification-icon" style="color: ${color}">
            <i class="fas ${iconName}"></i>
        </div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">&times;</button>
    `;
    
    // Применяем стили программно, чтобы избежать необходимости изменять CSS в base.html
    notification.style.backgroundColor = '#ffffff';
    notification.style.boxShadow = '0 3px 20px rgba(0, 0, 0, 0.1), 0 3px 10px rgba(0, 0, 0, 0.05)';
    notification.style.border = 'none';
    notification.style.borderRadius = '12px';
    notification.style.padding = '16px';
    notification.style.marginBottom = '15px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.animationDuration = '0.5s';
    notification.style.transform = 'translateY(10px)';
    notification.style.opacity = '0';
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transition = 'all 0.5s ease';
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Стили для иконки
    const iconElement = notification.querySelector('.notification-icon');
    iconElement.style.marginRight = '15px';
    iconElement.style.fontSize = '24px';
    
    // Стили для текста
    const contentElement = notification.querySelector('.notification-content');
    contentElement.style.flex = '1';
    contentElement.style.color = '#555';
    contentElement.style.fontWeight = '500';
    
    // Стили для кнопки закрытия
    const closeButton = notification.querySelector('.notification-close');
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.style.color = '#aaa';
    closeButton.style.marginLeft = '10px';
    closeButton.style.transition = 'color 0.2s';
    
    // Эффект при наведении на кнопку закрытия
    closeButton.addEventListener('mouseover', () => {
        closeButton.style.color = '#555';
    });
    
    closeButton.addEventListener('mouseout', () => {
        closeButton.style.color = '#aaa';
    });
    
    // Добавляем уведомление в контейнер
    container.appendChild(notification);
    
    // Добавляем обработчик для кнопки закрытия
    closeButton.addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Автоматически скрываем уведомление через 5 секунд
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

/**
 * Закрывает уведомление с красивой анимацией
 * @param {HTMLElement} notification - Элемент уведомления
 */
function closeNotification(notification) {
    notification.style.transform = 'translateY(-10px)';
    notification.style.opacity = '0';
    
    setTimeout(() => {
        notification.remove();
    }, 500);
} 