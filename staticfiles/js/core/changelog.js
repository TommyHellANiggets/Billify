document.addEventListener('DOMContentLoaded', function() {
    // Анимация появления элементов при скролле
    function animateTimelineItems() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -100px 0px'
        });
        
        timelineItems.forEach(item => {
            item.classList.add('timeline-animate');
            observer.observe(item);
        });
    }
    
    // Добавляем стили анимации динамически
    const style = document.createElement('style');
    style.innerHTML = `
        .timeline-animate {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        .timeline-animate.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .timeline-item:nth-child(even) .timeline-animate {
            transform: translateX(-30px);
        }
        
        .timeline-item:nth-child(odd) .timeline-animate {
            transform: translateX(30px);
        }
        
        .timeline-item:nth-child(even) .timeline-animate.animated,
        .timeline-item:nth-child(odd) .timeline-animate.animated {
            transform: translateX(0);
        }
    `;
    document.head.appendChild(style);
    
    // Запускаем анимацию
    animateTimelineItems();
    
    // Анимация вертикальной линии таймлайна
    function animateTimelineLine() {
        const timelineLine = document.querySelector('.timeline-line');
        
        timelineLine.style.height = '0';
        timelineLine.style.transition = 'height 1.5s ease';
        
        setTimeout(() => {
            timelineLine.style.height = '100%';
        }, 300);
    }
    
    animateTimelineLine();
    
    // Добавляем анимацию при наведении на карточки
    const timelineCards = document.querySelectorAll('.timeline-card');
    timelineCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = 'var(--shadow-lg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
    
    // Обработка формы подписки
    const subscribeForm = document.querySelector('.subscribe-form');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // Здесь можно добавить AJAX запрос для отправки данных
                // Имитируем успешную подписку
                emailInput.value = '';
                
                const successMessage = document.createElement('div');
                successMessage.className = 'subscribe-success';
                successMessage.innerHTML = 'Спасибо за подписку! Вы будете получать обновления о новых версиях.';
                successMessage.style.color = 'var(--color-primary)';
                successMessage.style.fontWeight = '500';
                successMessage.style.marginTop = '1rem';
                
                const existingMessage = subscribeForm.nextElementSibling;
                if (existingMessage && existingMessage.classList.contains('subscribe-success')) {
                    existingMessage.remove();
                }
                
                subscribeForm.after(successMessage);
            }
        });
    }
}); 