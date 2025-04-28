document.addEventListener('DOMContentLoaded', function() {
    // Анимация для элементов при прокрутке
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.about-section, .feature-item, .pricing-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenHeight = window.innerHeight;
            
            if (elementPosition < screenHeight * 0.85) {
                element.classList.add('fade-in');
            }
        });
    };
    
    // Добавляем класс для анимации элементов
    const addAnimationClass = function() {
        const elements = document.querySelectorAll('.about-section, .feature-item, .pricing-card');
        
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        });
        
        setTimeout(function() {
            // Запускаем анимацию при загрузке для видимых элементов
            animateOnScroll();
        }, 100);
    };
    
    // Запускаем добавление классов для анимации
    addAnimationClass();
    
    // Анимация при прокрутке
    window.addEventListener('scroll', animateOnScroll);
    
    // Добавление класса "fade-in" для видимых элементов
    document.addEventListener('scroll', function() {
        const elements = document.querySelectorAll('.about-section, .feature-item, .pricing-card');
        
        elements.forEach(element => {
            if (element.classList.contains('fade-in')) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    });
}); 