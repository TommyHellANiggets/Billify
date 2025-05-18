document.addEventListener('DOMContentLoaded', function() {
    console.log('Новый features.js загружен');
    
    // Анимация карточек при скролле
    const featureBoxes = document.querySelectorAll('.feature-box');
    
    if (featureBoxes.length === 0) {
        console.log('Карточки возможностей не найдены');
        return;
    }
    
    // Инициализация Intersection Observer для анимации появления
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    };
    
    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('feature-box-visible');
                console.log('Карточка в зоне видимости:', entry.target.classList);
                
                // Отключаем observer после анимации
                // featureObserver.unobserve(entry.target);
            } else {
                entry.target.classList.remove('feature-box-visible');
            }
        });
    }, observerOptions);
    
    // Наблюдаем за всеми карточками
    featureBoxes.forEach((box, index) => {
        // Добавляем задержку появления для каждой карточки
        box.style.transitionDelay = `${index * 0.1}s`;
        featureObserver.observe(box);
    });
    
    // Параллакс эффект для фоновых элементов
    const floatingShapes = document.querySelectorAll('.floating-shape');
    
    if (floatingShapes.length > 0) {
        window.addEventListener('mousemove', function(e) {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            floatingShapes.forEach((shape, index) => {
                const speed = (index + 1) * 2;
                const offsetX = (mouseX - 0.5) * speed;
                const offsetY = (mouseY - 0.5) * speed;
                
                shape.style.transform = `translate(${offsetX}%, ${offsetY}%) scale(${1 + (index * 0.05)})`;
            });
        });
    }
    
    // Добавляем интерактивность для карточек
    featureBoxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            // Плавно увеличиваем размер иконки при наведении
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.15)';
            }
            
            // Изменяем свечение иконки
            const glow = this.querySelector('.feature-icon-glow');
            if (glow) {
                glow.style.opacity = '0.6';
                glow.style.filter = 'blur(15px)';
            }
        });
        
        box.addEventListener('mouseleave', function() {
            // Возвращаем нормальный размер иконке
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
            
            // Возвращаем нормальное свечение
            const glow = this.querySelector('.feature-icon-glow');
            if (glow) {
                glow.style.opacity = '0.3';
                glow.style.filter = 'blur(20px)';
            }
        });
    });
    
    // Добавляем эффект для кнопок
    const featureButtons = document.querySelectorAll('.feature-btn');
    
    featureButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            const svg = this.querySelector('svg');
            if (svg) {
                svg.style.transform = 'translateX(5px)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            const svg = this.querySelector('svg');
            if (svg) {
                svg.style.transform = 'translateX(0)';
            }
        });
    });
    
    // Функция для отладки (можно вызвать в консоли)
    window.toggleFeaturesDebug = function() {
        console.log('Отладка элементов секции "Возможности системы"');
        console.log('Карточки:', featureBoxes);
        console.log('Фоновые элементы:', floatingShapes);
        console.log('Кнопки:', featureButtons);
    };
}); 