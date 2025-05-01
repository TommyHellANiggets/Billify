document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы
    const featuresSection = document.querySelector('.features-section');
    if (!featuresSection) return; // Если секции нет на странице, выходим
    
    const tabHeaders = featuresSection.querySelectorAll('.tab-header');
    const tabContents = featuresSection.querySelectorAll('.tab-content');
    
    // Текущая активная вкладка
    let activeTabIndex = 0;
    
    // Функция для активации вкладки по индексу
    function activateTab(index) {
        if (index < 0 || index >= tabHeaders.length) return;
        
        // Убираем активный класс у всех вкладок и контентов
        tabHeaders.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Устанавливаем активный класс для выбранной вкладки и контента
        tabHeaders[index].classList.add('active');
        tabContents[index].classList.add('active');
        
        activeTabIndex = index;
    }
    
    // Обработка клика по заголовкам вкладок
    tabHeaders.forEach((header, index) => {
        header.addEventListener('click', function() {
            activateTab(index);
        });
    });
    
    // Делаем активной первую вкладку по умолчанию
    activateTab(0);
    
    // Простая прокрутка для переключения вкладок (опциональная функция)
    // Будет работать для видимой секции при прокрутке
    let isScrollingEnabled = true;
    let scrollTimeout = null;
    
    window.addEventListener('wheel', function(event) {
        // Проверяем, находится ли секция в поле зрения
        const rect = featuresSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible && isScrollingEnabled) {
            const delta = Math.sign(event.deltaY);
            
            if (delta > 0 && activeTabIndex < tabHeaders.length - 1) {
                // Прокрутка вниз - следующая вкладка
                activateTab(activeTabIndex + 1);
                isScrollingEnabled = false;
            } else if (delta < 0 && activeTabIndex > 0) {
                // Прокрутка вверх - предыдущая вкладка
                activateTab(activeTabIndex - 1);
                isScrollingEnabled = false;
            }
            
            // Устанавливаем задержку перед следующим переключением
            if (!isScrollingEnabled) {
                if (scrollTimeout) clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrollingEnabled = true;
                }, 500);
            }
        }
    }, { passive: true }); // Делаем его пассивным, чтобы не блокировать прокрутку страницы
    
    // Обработка свайпов для мобильных устройств
    let touchStartY = 0;
    let touchEndY = 0;
    
    featuresSection.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    featuresSection.addEventListener('touchend', function(e) {
        const rect = featuresSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (!isVisible) return;
        
        touchEndY = e.changedTouches[0].screenY;
        const deltaY = touchStartY - touchEndY;
        
        // Если свайп достаточной длины
        if (Math.abs(deltaY) > 70) {
            if (deltaY > 0 && activeTabIndex < tabHeaders.length - 1) {
                // Свайп вверх - следующая вкладка
                activateTab(activeTabIndex + 1);
            } else if (deltaY < 0 && activeTabIndex > 0) {
                // Свайп вниз - предыдущая вкладка
                activateTab(activeTabIndex - 1);
            }
        }
    }, { passive: true });
}); 