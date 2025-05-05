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
    
    // Секция Возможностей системы с sticky-скроллом
    const featuresSection = document.querySelector('.features-section');
    const featureStickyCards = document.querySelectorAll('.feature-card');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    if (featuresSection && featureStickyCards.length > 0) {
        console.log('Инициализация секции features с sticky-скроллом');
        
        // Получаем высоту видимой области
        const viewportHeight = window.innerHeight;
        const stickyContainers = document.querySelectorAll('.feature-card-container');
        const featuresStickyWrapper = document.querySelector('.features-sticky-wrapper');
        
        // Рассчитываем более точную высоту для sticky-wrapper
        const headerContainer = document.querySelector('.features-section .section-header-container');
        const headerHeight = headerContainer ? headerContainer.offsetHeight : 0;
        const navbarOffset = 80; // отступ от навбара
        
        // Устанавливаем высоту wrapper учитывая количество карточек
        const cardSpacing = 100; // Расстояние между карточками
        // Снижаем общую высоту для более быстрой прокрутки к последней карточке
        // Добавляем дополнительное пространство внизу, чтобы последняя карточка оставалась в контейнере
        const totalStickyHeight = (stickyContainers.length) * (viewportHeight - (headerHeight + navbarOffset)) * 0.85 + 
                                  cardSpacing * (stickyContainers.length - 1) + 250; // Добавляем отступ внизу
        featuresStickyWrapper.style.height = `${totalStickyHeight}px`;
        
        // Устанавливаем активную карточку при загрузке
        featureStickyCards[0].classList.add('active');
        progressSteps[0].classList.add('active');
        
        // Функция для определения, какая карточка должна быть активной
        function updateActiveFeature() {
            const scrollPosition = window.scrollY;
            const sectionTop = featuresSection.getBoundingClientRect().top + window.scrollY;
            const sectionHeight = featuresSection.offsetHeight;
            const sectionBottom = sectionTop + sectionHeight;
            
            // Если мы находимся в пределах секции или уже прошли её
            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                // Определяем индекс активной карточки на основе текущей позиции прокрутки
                const relativeScroll = scrollPosition - sectionTop;
                const stickyWrapperHeight = featuresStickyWrapper.offsetHeight;
                
                // Обеспечиваем более ранний переход к следующей карточке
                // Уменьшаем знаменатель для более быстрого перехода между карточками
                const scrollableHeight = Math.max(1, stickyWrapperHeight - viewportHeight / 2);
                const scrollProgress = Math.min(relativeScroll / scrollableHeight, 1);
                
                // Проверяем, не приближаемся ли мы к концу секции
                const isNearBottom = scrollPosition + viewportHeight >= sectionBottom - 100;
                
                // Рассчитываем активный индекс с более ранним переходом
                let activeIndex;
                if (isNearBottom) {
                    // Если мы близко к концу секции, активируем последнюю карточку
                    activeIndex = stickyContainers.length - 1;
                } else {
                    activeIndex = Math.min(
                        Math.floor(scrollProgress * stickyContainers.length),
                        stickyContainers.length - 1
                    );
                }
                
                // Управление позицией header-container когда мы подходим к последней карточке
                const headerContainer = document.querySelector('.features-section .section-header-container');
                // Проверяем, приближаемся ли мы к последней карточке
                const lastCardThreshold = scrollableHeight * 0.7; // Начинаем двигать плашку раньше
                
                if (relativeScroll > lastCardThreshold && activeIndex >= stickyContainers.length - 2) {
                    // Вычисляем, насколько нужно сместить плашку вверх
                    const maxShift = 180; // Увеличиваем максимальное смещение вверх в пикселях
                    const shiftProgress = (relativeScroll - lastCardThreshold) / (scrollableHeight - lastCardThreshold);
                    const currentShift = Math.min(maxShift, shiftProgress * maxShift);
                    
                    // Применяем смещение с плавной трансформацией
                    headerContainer.style.transform = `translateY(-${currentShift}px)`;
                    headerContainer.style.transition = 'transform 0.1s ease-out';
                } else {
                    // Возвращаем на место, если не в зоне последних карточек
                    headerContainer.style.transform = 'translateY(0)';
                }
                
                // Деактивируем все карточки
                featureStickyCards.forEach((card, index) => {
                    if (index !== activeIndex) {
                        card.classList.remove('active');
                        card.style.transform = 'scale(0.9) translateY(20px)';
                        card.style.opacity = '0.4';
                        card.style.zIndex = '8'; // Меньший z-index для неактивных карточек
                    }
                });
                
                // Активируем текущую карточку
                featureStickyCards[activeIndex].classList.add('active');
                featureStickyCards[activeIndex].style.transform = 'scale(1) translateY(0)';
                featureStickyCards[activeIndex].style.opacity = '1';
                featureStickyCards[activeIndex].style.zIndex = '10'; // Больший z-index для активной карточки
                
                // Обновляем индикаторы прогресса
                progressSteps.forEach((step, index) => {
                    if (index <= activeIndex) {
                        step.classList.add('active');
                    } else {
                        step.classList.remove('active');
                    }
                });
                
                // Анимация заполнения линии прогресса с градиентом
                const progressLine = document.querySelector('.progress-line');
                if (progressLine) {
                    // Вычисляем ширину линии прогресса в зависимости от прогресса прокрутки
                    const lineWidth = Math.min(100, (activeIndex + 1) / progressSteps.length * 100);
                    progressLine.style.background = `linear-gradient(90deg, 
                        var(--color-primary) 0%, 
                        var(--color-primary) ${lineWidth}%, 
                        rgba(var(--color-primary-rgb), 0.1) ${lineWidth}%, 
                        rgba(var(--color-primary-rgb), 0.1) 100%)`;
                    
                    // Добавляем анимацию свечения для активной линии
                    progressLine.style.boxShadow = `0 0 5px rgba(var(--color-primary-rgb), ${0.2 + (lineWidth / 100) * 0.3})`;
                }
                
                // Добавим небольшой эффект параллакса для невидимых карточек
                stickyContainers.forEach((container, index) => {
                    if (index > activeIndex) {
                        // Карточки ниже активной смещаем немного вниз
                        container.style.transform = `translateY(${10 * (index - activeIndex)}px)`;
                    } else if (index < activeIndex) {
                        // Карточки выше активной делаем прозрачнее
                        container.style.opacity = Math.max(0.1, 1 - (activeIndex - index) * 0.3);
                    } else {
                        // Активную карточку возвращаем в нормальное состояние
                        container.style.transform = 'translateY(0)';
                        container.style.opacity = '1';
                    }
                });
            }
        }
        
        // Вызываем функцию при прокрутке страницы
        window.addEventListener('scroll', updateActiveFeature);
        
        // Вызываем функцию сразу после загрузки
        updateActiveFeature();
        
        // Обработчик клика на индикаторы прогресса с улучшенной анимацией
        progressSteps.forEach((step, index) => {
            step.addEventListener('click', function(e) {
                const targetFeature = this.getAttribute('data-target');
                const targetCard = document.getElementById(targetFeature);
                
                if (targetCard) {
                    // Очищаем все существующие эффекты пульсации
                    document.querySelectorAll('.progress-ripple').forEach(el => el.remove());
                    
                    // Создаем эффект пульсации при клике
                    const ripple = document.createElement('span');
                    ripple.classList.add('progress-ripple');
                    
                    // Вычисляем позицию клика относительно кнопки
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Устанавливаем позицию и размер эффекта
                    const size = Math.max(rect.width, rect.height) * 2;
                    ripple.style.width = `${size}px`;
                    ripple.style.height = `${size}px`;
                    ripple.style.left = `${x - size/2}px`;
                    ripple.style.top = `${y - size/2}px`;
                    
                    this.appendChild(ripple);
                    
                    // Удаляем эффект через некоторое время
                    setTimeout(() => {
                        ripple.remove();
                    }, 800);
                    
                    // Обновляем активное состояние индикаторов
                    progressSteps.forEach(s => s.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Рассчитываем позицию для прокрутки
                    const sectionTop = featuresSection.getBoundingClientRect().top + window.scrollY;
                    const headerContainer = document.querySelector('.features-section .section-header-container');
                    const headerHeight = headerContainer ? headerContainer.offsetHeight : 0;
                    const navbarOffset = 80;
                    
                    // Рассчитываем точную позицию прокрутки для каждой карточки
                    const cardHeight = (viewportHeight - (headerHeight + navbarOffset + 40)) * 0.8;
                    const scrollTarget = sectionTop + index * cardHeight;
                    
                    // Эффект входа для выбранной карточки
                    featureStickyCards.forEach(card => {
                        card.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                        card.classList.remove('active');
                        card.style.opacity = '0.2';
                        card.style.transform = 'scale(0.8) translateY(30px)';
                        card.style.zIndex = '8';
                    });
                    
                    // Активируем целевую карточку с эффектом пружины
                    targetCard.style.transform = 'scale(1.05) translateY(-5px)';
                    targetCard.style.opacity = '1';
                    targetCard.style.zIndex = '10';
                    
                    // Плавная прокрутка к целевой позиции
                    setTimeout(() => {
                        window.scrollTo({
                            top: scrollTarget,
                            behavior: 'smooth'
                        });
                        
                        // Нормализуем масштаб целевой карточки после анимации
                        setTimeout(() => {
                            targetCard.style.transform = 'scale(1) translateY(0)';
                            targetCard.classList.add('active');
                        }, 350);
                    }, 50);
                    
                    // Анимация заполнения линии прогресса
                    const progressLine = document.querySelector('.progress-line');
                    if (progressLine) {
                        const lineWidth = Math.min(100, (index + 1) / progressSteps.length * 100);
                        progressLine.style.background = `linear-gradient(90deg, 
                            var(--color-primary) 0%, 
                            var(--color-primary) ${lineWidth}%, 
                            rgba(var(--color-primary-rgb), 0.1) ${lineWidth}%, 
                            rgba(var(--color-primary-rgb), 0.1) 100%)`;
                        progressLine.style.boxShadow = `0 0 5px rgba(var(--color-primary-rgb), ${0.2 + (lineWidth / 100) * 0.3})`;
                    }
                }
            });
        });
        
        // Эффект 3D-наклона при движении мыши (оптимизированный)
        featureStickyCards.forEach(card => {
            card.addEventListener('mousemove', function(e) {
                if (!this.classList.contains('active')) return;
                
                const cardRect = this.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                // Ограничиваем поворот для более естественного эффекта
                const rotateY = Math.max(-10, Math.min(10, (mouseX - cardCenterX) / 20));
                const rotateX = Math.max(-10, Math.min(10, (cardCenterY - mouseY) / 20));
                
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = this.classList.contains('active') ? 
                    'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)';
            });
        });
        
        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', function() {
            // Пересчитываем высоту viewport
            const newViewportHeight = window.innerHeight;
            const headerHeight = document.querySelector('.features-section .section-header').offsetHeight;
            const progressHeight = document.querySelector('.features-progress').offsetHeight;
            const topOffset = headerHeight + progressHeight;
            
            // Обновляем высоту wrapper с меньшим значением для более быстрой прокрутки
            const cardSpacing = 100;
            const totalStickyHeight = (stickyContainers.length) * (newViewportHeight - topOffset) * 0.9 + 
                                     cardSpacing * (stickyContainers.length - 1) + topOffset;
            featuresStickyWrapper.style.height = `${totalStickyHeight}px`;
            
            setTimeout(updateActiveFeature, 200);
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
                step.setAttribute('title', step.querySelector('span').textContent);
            } else {
                step.removeAttribute('title');
            }
        });
        
        // Обновляем активные элементы
        updateActiveFeature();
    }

    // Вызываем функцию при загрузке и при изменении размера окна
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100); // Вызываем после загрузки страницы
}); 