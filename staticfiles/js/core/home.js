document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Проверяем, находимся ли мы на главной странице или странице ченджлога
    const isHomePage = document.querySelector('.hero') !== null;
    const isChangelogPage = document.querySelector('.changelog-header') !== null;
    
    // Добавляем кнопку прокрутки вверх только на нужных страницах
    if (isHomePage || isChangelogPage) {
        // Добавление кнопки прокрутки вверх
        const scrollTopBtn = document.createElement('button');
        scrollTopBtn.className = 'scroll-to-top';
        scrollTopBtn.setAttribute('aria-label', 'Прокрутить вверх');
        scrollTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
        document.body.appendChild(scrollTopBtn);
        
        // Функция для отображения/скрытия кнопки прокрутки
        function toggleScrollTopButton() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }
        
        // Прокрутка вверх при клике на кнопку
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Проверка положения скролла при прокрутке и загрузке страницы
        window.addEventListener('scroll', toggleScrollTopButton);
        toggleScrollTopButton(); // Вызов при загрузке страницы
    }
    
    // Проверка на наличие features-scroll.js
    const newFeaturesSystem = document.querySelector('script[src*="features-scroll.js"]');
    
    // Если новой системы нет, используем старую анимацию карточек
    if (!newFeaturesSystem) {
        console.log('Используется устаревшая система анимации карточек');
        
        // Добавление эффекта появления для карточек функций (старая версия)
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 150);
        });
    } else {
        console.log('Обнаружена новая система анимации карточек (features-scroll.js)');
    }

    // Анимация для героя
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(-20px)';
        heroContent.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 200);
    }

    // Плавная прокрутка при клике на индикатор
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Табы в разделе возможностей (старая версия)
    const tabHeaders = document.querySelectorAll('.tab-header');
    if (tabHeaders.length > 0) {
        tabHeaders.forEach(header => {
            header.addEventListener('click', function() {
                // Убираем активный класс у всех заголовков и контентов
                document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Добавляем активный класс к выбранному заголовку
                this.classList.add('active');
                
                // Показываем соответствующий контент
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId + '-tab').classList.add('active');
            });
        });
    }
    
    // Переключатель цен ежемесячно/ежегодно
    const pricingToggle = document.getElementById('pricing-toggle');
    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            const priceElements = document.querySelectorAll('.price');
            
            priceElements.forEach(element => {
                const monthly = element.getAttribute('data-monthly');
                const yearly = element.getAttribute('data-yearly');
                
                if (this.checked) {
                    // Ежегодно
                    element.innerHTML = yearly + ' ₽<span>/месяц</span>';
                    element.closest('.pricing-card').querySelector('.pricing-footer a').innerHTML = 'Оплатить за год';
                } else {
                    // Ежемесячно
                    element.innerHTML = monthly + ' ₽<span>/месяц</span>';
                    element.closest('.pricing-card').querySelector('.pricing-footer a').innerHTML = element.closest('.pricing-card').classList.contains('featured') ? 'Выбрать тариф' : 'Начать бесплатно';
                }
            });
        });
    }
    
    // FAQ аккордеон
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            question.addEventListener('click', function() {
                // Закрываем другие FAQ, если нужно
                document.querySelectorAll('.faq-item.active').forEach(activeItem => {
                    if (activeItem !== item) {
                        activeItem.classList.remove('active');
                        activeItem.querySelector('.faq-answer').style.height = '0';
                    }
                });
                
                // Переключаем текущий элемент
                if (item.classList.contains('active')) {
                    item.classList.remove('active');
                    answer.style.height = '0';
                } else {
                    item.classList.add('active');
                    answer.style.height = answer.scrollHeight + 'px';
                }
            });
        });
    }
    
    // Анимация видимости элементов при прокрутке
    const animateElements = document.querySelectorAll('.about-grid, .tab-content, .testimonial-card, .pricing-card, .faq-item');
    
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        animateElements.forEach(element => {
            element.classList.add('animate-on-scroll');
            observer.observe(element);
        });
    }
    
    // Анимация цифр в блоке статистики
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const value = target.innerText;
                    let startValue = 0;
                    
                    // Проверяем, является ли значение числом или содержит плюс/другие символы
                    let isNumeric = false;
                    let numericValue = 0;
                    let suffix = '';
                    
                    if (value.includes('+')) {
                        isNumeric = true;
                        numericValue = parseFloat(value.replace('+', '').replace(/,/g, ''));
                        suffix = '+';
                    } else if (value.includes('M')) {
                        isNumeric = true;
                        numericValue = parseFloat(value.replace('M', '').replace(/,/g, ''));
                        suffix = 'M+';
                    } else if (!isNaN(parseFloat(value))) {
                        isNumeric = true;
                        numericValue = parseFloat(value);
                    }
                    
                    if (isNumeric) {
                        const duration = 2000;
                        const increment = numericValue / (duration / 20);
                        
                        const timer = setInterval(() => {
                            startValue += increment;
                            if (startValue >= numericValue) {
                                target.innerText = value;
                                clearInterval(timer);
                            } else {
                                let displayValue = Math.floor(startValue);
                                if (value.includes('.')) {
                                    displayValue = startValue.toFixed(1);
                                }
                                target.innerText = displayValue + suffix;
                            }
                        }, 20);
                    }
                    
                    observer.unobserve(target);
                }
            });
        }, {
            threshold: 0.5
        });
        
        statNumbers.forEach(number => {
            observer.observe(number);
        });
    }

    // Переключение тарифов (ежемесячно/ежегодно)
    const billingToggle = document.getElementById('billing-toggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');

    if (billingToggle) {
        billingToggle.addEventListener('change', function() {
            if (this.checked) {
                // Ежегодные тарифы
                monthlyPrices.forEach(el => el.style.display = 'none');
                yearlyPrices.forEach(el => el.style.display = 'block');
            } else {
                // Ежемесячные тарифы
                monthlyPrices.forEach(el => el.style.display = 'block');
                yearlyPrices.forEach(el => el.style.display = 'none');
            }
        });

        // Инициализация при загрузке страницы (показать ежемесячные тарифы)
        monthlyPrices.forEach(el => el.style.display = 'block');
        yearlyPrices.forEach(el => el.style.display = 'none');
    }
    
    // Добавление эффектов при наведении на изображения в секции возможностей
    const featureImages = document.querySelectorAll('.feature-img');
    featureImages.forEach(image => {
        image.addEventListener('mousemove', function(e) {
            const boundingRect = this.getBoundingClientRect();
            const x = e.clientX - boundingRect.left;
            const y = e.clientY - boundingRect.top;
            
            const xPercent = (x / boundingRect.width - 0.5) * 10;
            const yPercent = (y / boundingRect.height - 0.5) * 10;
            
            this.style.transform = `perspective(1000px) rotateY(${xPercent}deg) rotateX(${-yPercent}deg) scale3d(1.05, 1.05, 1.05)`;
        });
        
        image.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale3d(1, 1, 1)';
        });
    });

    // Добавим обработку изменения размеров экрана
    function handleResize() {
        const isMobile = window.innerWidth <= 576;
        const progressSteps = document.querySelectorAll('.progress-step');
        
        progressSteps.forEach(step => {
            // Обновляем отображение в зависимости от размера экрана
            if (isMobile) {
                step.setAttribute('title', step.querySelector('span') ? step.querySelector('span').textContent : '');
            } else {
                step.removeAttribute('title');
            }
        });
    }

    // Вызываем функцию при загрузке и при изменении размера окна
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100); // Вызываем после загрузки страницы
}); 