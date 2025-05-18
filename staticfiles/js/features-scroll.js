document.addEventListener('DOMContentLoaded', function() {
    console.log('features-scroll.js загружен');
    
    // Получаем секцию с карточками
    const featuresSection = document.querySelector('.features-section');
    if (!featuresSection) {
        console.log('Секция features-section не найдена');
        return;
    }
    
    console.log('Инициализация эффекта наслаивающихся карточек');
    
    // Получаем все контейнеры карточек
    const cardContainers = document.querySelectorAll('.feature-card-container');
    if (cardContainers.length === 0) {
        console.log('Карточки не найдены');
        return;
    }
    
    console.log(`Найдено ${cardContainers.length} карточек`);
    
    // Получаем контейнер для карточек
    const stickyContainer = featuresSection.querySelector('.features-sticky-container');
    if (!stickyContainer) {
        console.log('Контейнер .features-sticky-container не найден');
        return;
    }
    
    // Рассчитываем минимальную высоту контейнера на основе высот всех карточек и небольшого зазора для прокрутки
    function updateContainerHeight() {
        let totalHeight = 0;
        
        // Измеряем высоту каждой карточки
        cardContainers.forEach(container => {
            const card = container.querySelector('.feature-card');
            if (card) {
                totalHeight += card.offsetHeight + 50; // Высота карточки + отступ
            }
        });
        
        // Добавляем дополнительное пространство для прокрутки
        totalHeight += window.innerHeight * 0.5;
        
        // Устанавливаем высоту контейнера
        stickyContainer.style.minHeight = `${totalHeight}px`;
    }
    
    // Получаем высоту хедера, если он есть
    const header = document.querySelector('header') || document.querySelector('.header');
    const headerHeight = header ? header.offsetHeight : 0;
    
    // Базовый отступ для первой карточки
    const baseOffset = 5;
    
    // Функция для обновления состояния карточек при прокрутке
    function updateCardsOnScroll() {
        // Проверяем, виден ли контейнер в видимой области
        const containerRect = stickyContainer.getBoundingClientRect();
        
        // Если контейнер полностью за пределами экрана, выходим
        if (containerRect.bottom < 0 || containerRect.top > window.innerHeight) {
            // Убираем все активные классы
            cardContainers.forEach(container => {
                container.classList.remove('active', 'passed', 'upcoming');
            });
            return;
        }
        
        // Получаем позицию начала и конца секции относительно окна
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;
        
        // Вычисляем прогресс прокрутки относительно высоты секции
        const scrollProgress = Math.max(0, Math.min(1, 
            (window.innerHeight - containerTop) / (containerHeight + window.innerHeight * 0.5)
        ));
        
        if (window.debugFeaturesScroll) {
            console.log(`Прогресс прокрутки: ${Math.round(scrollProgress * 100)}%`);
        }
        
        // Определяем границы для каждой карточки на основе прогресса прокрутки
        const segmentSize = 1 / cardContainers.length;
        
        cardContainers.forEach((container, index) => {
            // Удаляем все предыдущие классы
            container.classList.remove('active', 'passed', 'upcoming');
            
            // Вычисляем границы прогресса для этой карточки
            const cardStartProgress = index * segmentSize;
            const cardEndProgress = (index + 1) * segmentSize;
            
            // Определяем статус карточки
            if (scrollProgress < cardStartProgress) {
                container.classList.add('upcoming');
            } else if (scrollProgress >= cardEndProgress) {
                container.classList.add('passed');
            } else {
                container.classList.add('active');
                
                if (window.debugFeaturesScroll) {
                    console.log(`Активная карточка: ${index + 1} из ${cardContainers.length}`);
                }
            }
        });
    }
    
    // Обновляем высоту контейнера после полной загрузки страницы
    window.addEventListener('load', updateContainerHeight);
    
    // Оптимизированный обработчик прокрутки
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateCardsOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Обработка изменения размера окна
    window.addEventListener('resize', function() {
        updateContainerHeight();
        updateCardsOnScroll();
    });
    
    // Инициализация при загрузке
    updateCardsOnScroll();
    
    // Функция для переключения отладки
    window.toggleFeaturesDebug = function() {
        window.debugFeaturesScroll = !window.debugFeaturesScroll;
        console.log(`Отладка стакинга карточек ${window.debugFeaturesScroll ? 'включена' : 'выключена'}`);
        updateCardsOnScroll();
    };
}); 