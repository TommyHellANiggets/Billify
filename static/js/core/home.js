document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Добавление эффекта появления для карточек функций
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
    
    // Табы в разделе возможностей
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
}); 