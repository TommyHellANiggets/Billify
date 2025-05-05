// Функционал для слайдера отзывов
document.addEventListener('DOMContentLoaded', function() {
    // Элементы управления
    const container = document.querySelector('.testimonials-container');
    const prevBtn = document.querySelector('.testimonial-prev');
    const nextBtn = document.querySelector('.testimonial-next');
    const indicators = document.querySelectorAll('.testimonial-indicator');
    
    // Получаем все карточки
    const cards = document.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    
    // Настройки слайдера
    let currentIndex = 0;
    const totalSlides = Math.ceil(cards.length / getVisibleCount());
    let isAnimating = false;
    
    // Обновляем состояние кнопок навигации
    function updateNavState() {
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }
    
    // Получаем количество видимых карточек в зависимости от ширины экрана
    function getVisibleCount() {
        if (window.innerWidth < 768) {
            return 1;
        } else if (window.innerWidth < 1200) {
            return 2;
        } else {
            return 3;
        }
    }
    
    // Вычисляем ширину смещения для слайдера
    function getScrollAmount() {
        const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(cards[0]).marginLeft) + parseInt(getComputedStyle(cards[0]).marginRight);
        return cardWidth * getVisibleCount();
    }
    
    // Переход к слайду
    function goToSlide(index) {
        if (isAnimating) return;
        
        isAnimating = true;
        currentIndex = index;
        
        // Ограничиваем индекс
        if (currentIndex < 0) currentIndex = 0;
        if (currentIndex > totalSlides - 1) currentIndex = totalSlides - 1;
        
        // Выполняем плавную прокрутку
        const scrollAmount = getScrollAmount() * currentIndex;
        container.style.transition = 'transform 0.5s ease';
        container.style.transform = `translateX(-${scrollAmount}px)`;
        
        // Обновляем состояние
        updateNavState();
        
        // Снимаем блокировку после анимации
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    // Обработчики событий для кнопок
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentIndex - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide(currentIndex + 1);
        });
    }
    
    // Обработчики для индикаторов
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Инициализация слайдера
    function initSlider() {
        // Устанавливаем количество индикаторов в зависимости от количества слайдов
        const indicatorsContainer = document.querySelector('.testimonial-indicators');
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
            for (let i = 0; i < totalSlides; i++) {
                const indicator = document.createElement('span');
                indicator.classList.add('testimonial-indicator');
                if (i === 0) indicator.classList.add('active');
                indicator.addEventListener('click', () => goToSlide(i));
                indicatorsContainer.appendChild(indicator);
            }
        }
        
        // Настраиваем начальный стиль контейнера
        container.style.transform = 'translateX(0)';
        updateNavState();
    }
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        const newTotalSlides = Math.ceil(cards.length / getVisibleCount());
        if (newTotalSlides !== totalSlides) {
            // Если количество слайдов изменилось, переинициализируем слайдер
            initSlider();
        } else {
            // Корректируем положение слайдера при изменении размера окна
            const scrollAmount = getScrollAmount() * currentIndex;
            container.style.transition = 'none';
            container.style.transform = `translateX(-${scrollAmount}px)`;
            // Восстанавливаем переходы после перерасчета
            setTimeout(() => {
                container.style.transition = 'transform 0.5s ease';
            }, 50);
        }
    });
    
    // Анимация при загрузке страницы
    function animateOnScroll() {
        const section = document.querySelector('.testimonials-section');
        if (!section) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    cards.forEach((card, index) => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(30px)';
                        
                        setTimeout(() => {
                            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 100 * (index % getVisibleCount()));
                    });
                    
                    observer.unobserve(section);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(section);
    }
    
    // Инициализация
    initSlider();
    animateOnScroll();
    
    // Автоматическая прокрутка
    let autoplayInterval;
    
    function startAutoplay() {
        autoplayInterval = setInterval(() => {
            if (currentIndex >= totalSlides - 1) {
                goToSlide(0);
            } else {
                goToSlide(currentIndex + 1);
            }
        }, 5000);
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }
    
    // Запуск автоматической прокрутки и пауза при наведении
    startAutoplay();
    
    container.addEventListener('mouseenter', stopAutoplay);
    container.addEventListener('mouseleave', startAutoplay);
}); 