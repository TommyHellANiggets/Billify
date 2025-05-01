/**
 * Pricing Carousel - управление каруселью тарифных планов
 */
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация карусели тарифных планов
    const initPricingCarousel = () => {
        const carousel = document.querySelector('.pricing-carousel');
        if (!carousel) return;
        
        const grid = document.querySelector('.pricing-grid');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const indicators = document.querySelectorAll('.page-indicator');
        const groups = document.querySelectorAll('.pricing-group');
        
        if (!grid || !prevBtn || !nextBtn || groups.length === 0) return;
        
        let currentPage = 0;
        const totalPages = groups.length;
        
        // Настройка стилей для правильного отображения
        grid.style.width = `${totalPages * 100}%`;
        groups.forEach(group => {
            group.style.flex = `0 0 ${100 / totalPages}%`;
        });
        
        // Функция для обновления отображения карусели
        function updateCarousel() {
            grid.style.transform = `translateX(-${currentPage * (100 / totalPages)}%)`;
            
            // Обновление состояния индикаторов
            indicators.forEach((indicator, index) => {
                if (index === currentPage) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
            
            // Обновление состояния кнопок
            prevBtn.disabled = currentPage === 0;
            prevBtn.classList.toggle('disabled', currentPage === 0);
            nextBtn.disabled = currentPage === totalPages - 1;
            nextBtn.classList.toggle('disabled', currentPage === totalPages - 1);
        }
        
        // Обработчики событий для кнопок навигации
        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updateCarousel();
            }
        });
        
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                updateCarousel();
            }
        });
        
        // Обработчики событий для индикаторов
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentPage = index;
                updateCarousel();
            });
        });
        
        // Добавим свайп на мобильных устройствах
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, false);
        
        function handleSwipe() {
            const minSwipeDistance = 50;
            const distance = touchEndX - touchStartX;
            
            if (distance > minSwipeDistance && currentPage > 0) {
                // Свайп вправо - предыдущий слайд
                currentPage--;
                updateCarousel();
            } else if (distance < -minSwipeDistance && currentPage < totalPages - 1) {
                // Свайп влево - следующий слайд
                currentPage++;
                updateCarousel();
            }
        }
        
        // Инициализация карусели
        updateCarousel();
        
        // Обновление при изменении размера окна
        window.addEventListener('resize', () => {
            updateCarousel();
        });
    };
    
    // Запуск инициализации
    initPricingCarousel();
}); 