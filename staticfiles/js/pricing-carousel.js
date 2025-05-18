/**
 * Pricing Cards Animation - анимации для статичных карточек тарифов
 */
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация анимаций для карточек тарифов
    const initPricingCards = () => {
        const cards = document.querySelectorAll('.pricing-card');
        if (!cards.length) return;
        
        // Анимация появления карточек
        cards.forEach((card, index) => {
            // Анимация появления с задержкой
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
        
        // Обработка кнопок "Показать больше/меньше"
        const toggleButtons = document.querySelectorAll('.pricing-toggle-btn');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.pricing-card');
                card.classList.toggle('expanded');
                
                // Изменение текста кнопки
                if (card.classList.contains('expanded')) {
                    this.innerHTML = `Показать меньше <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                } else {
                    this.innerHTML = `Показать больше <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                }
            });
        });
        
        // Добавление эффекта при клике на кнопки
        const buttons = document.querySelectorAll('.pricing-footer .btn');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.classList.add('ripple-effect');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
        
        // Анимация при скролле до блока тарифов
        const pricingSection = document.querySelector('.pricing-section');
        if (pricingSection) {
            const animateOnScroll = () => {
                const scrollPosition = window.scrollY + window.innerHeight;
                const sectionPosition = pricingSection.offsetTop + 100;
                
                if (scrollPosition > sectionPosition) {
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('animate');
                        }, 150 * index);
                    });
                    
                    // Отключаем обработчик после срабатывания
                    window.removeEventListener('scroll', animateOnScroll);
                }
            };
            
            // Проверяем положение при загрузке
            animateOnScroll();
            
            // Добавляем обработчик скролла
            window.addEventListener('scroll', animateOnScroll);
        }
    };
    
    // Запуск инициализации
    initPricingCards();
    
    // Автоматическое обновление при изменении размера окна
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // Обновление состояния карточек при изменении размера окна
            const cards = document.querySelectorAll('.pricing-card');
            const isMobile = window.innerWidth <= 576;
            
            cards.forEach(card => {
                if (!isMobile && card.classList.contains('expanded')) {
                    card.classList.remove('expanded');
                    const toggleBtn = card.querySelector('.pricing-toggle-btn');
                    if (toggleBtn) {
                        toggleBtn.innerHTML = `Показать больше <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
                    }
                }
            });
        }, 250);
    });
}); 