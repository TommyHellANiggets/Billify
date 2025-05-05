// Интерактивные эффекты для блока CTA
document.addEventListener('DOMContentLoaded', function() {
    const ctaSection = document.querySelector('.cta-section');
    if (!ctaSection) return;
    
    // Анимация при скролле до блока
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                ctaSection.classList.add('animate');
                observer.unobserve(ctaSection);
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(ctaSection);
    
    // Эффект параллакса при движении мыши
    ctaSection.addEventListener('mousemove', function(e) {
        const shapes = document.querySelectorAll('.cta-bg-shape');
        const buttons = document.querySelectorAll('.cta-buttons .btn');
        
        // Вычисляем позицию мыши относительно центра секции
        const rect = ctaSection.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        // Применяем эффект для фоновых форм
        shapes.forEach((shape, index) => {
            const factor = (index + 1) * 0.03;
            shape.style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
        });
        
        // Применяем тонкий эффект для кнопок
        buttons.forEach((button, index) => {
            const factor = 0.01;
            button.style.transform = `translate(${mouseX * factor}px, ${mouseY * factor}px)`;
        });
    });
    
    // Сбрасываем трансформации при уходе мыши из секции
    ctaSection.addEventListener('mouseleave', function() {
        const shapes = document.querySelectorAll('.cta-bg-shape');
        const buttons = document.querySelectorAll('.cta-buttons .btn');
        
        shapes.forEach(shape => {
            shape.style.transform = 'translate(0, 0)';
        });
        
        buttons.forEach(button => {
            button.style.transform = 'translate(0, 0)';
        });
    });
    
    // Добавляем эффект волны при нажатии на кнопки
    const buttons = document.querySelectorAll('.cta-buttons .btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}); 