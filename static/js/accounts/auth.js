document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContainers = document.querySelectorAll('.auth-form-container');
    const tabIndicator = document.querySelector('.tab-indicator');
    const switchFormLinks = document.querySelectorAll('.switch-form');
    
    // Обработка кликов по табам
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Обработка кликов по ссылкам переключения форм
    switchFormLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const form = this.dataset.form;
            switchTab(form);
        });
    });
    
    // Функция переключения табов
    function switchTab(tab) {
        // Активация таба
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Анимация индикатора
        if (tab === 'login') {
            tabIndicator.style.transform = 'translateX(0)';
        } else {
            tabIndicator.style.transform = 'translateX(100%)';
        }
        
        // Показ/скрытие соответствующей формы с анимацией
        formContainers.forEach(container => {
            if (container.id === `${tab}-form`) {
                // Плавно скрываем все формы
                const activeContainer = document.querySelector('.auth-form-container.active');
                if (activeContainer) {
                    activeContainer.style.opacity = '0';
                    activeContainer.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        activeContainer.classList.remove('active');
                        
                        // Показываем нужную форму с анимацией
                        container.classList.add('active');
                        
                        // Небольшая задержка для анимации появления
                        setTimeout(() => {
                            container.style.opacity = '1';
                            container.style.transform = 'translateY(0)';
                        }, 50);
                    }, 300);
                } else {
                    container.classList.add('active');
                    
                    setTimeout(() => {
                        container.style.opacity = '1';
                        container.style.transform = 'translateY(0)';
                    }, 50);
                }
            }
        });
        
        // Обновление URL без перезагрузки страницы
        const url = tab === 'login' ? '/login/' : '/register/';
        window.history.pushState({}, '', url);
    }
    
    // Проверяем URL при загрузке страницы
    const path = window.location.pathname;
    if (path === '/register/') {
        switchTab('register');
    } else {
        switchTab('login');
    }
    
    // Валидация формы входа
    const loginForm = document.querySelector('#login-form form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = this.querySelector('#id_username').value.trim();
            const password = this.querySelector('#id_password').value.trim();
            
            if (!username || !password) {
                e.preventDefault();
                showError('Заполните все поля формы');
            }
        });
    }
    
    // Валидация формы регистрации
    const registerForm = document.querySelector('#register-form form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const username = this.querySelector('#id_username_reg').value.trim();
            const password1 = this.querySelector('#id_password1').value.trim();
            const password2 = this.querySelector('#id_password2').value.trim();
            const terms = this.querySelector('#terms');
            
            if (!username || !password1 || !password2) {
                e.preventDefault();
                showError('Заполните все поля формы');
                return;
            }
            
            if (password1 !== password2) {
                e.preventDefault();
                showError('Пароли не совпадают');
                return;
            }
            
            if (password1.length < 8) {
                e.preventDefault();
                showError('Пароль должен содержать не менее 8 символов');
                return;
            }
            
            if (!terms.checked) {
                e.preventDefault();
                showError('Необходимо согласиться с условиями использования');
                return;
            }
        });
    }
    
    // Функция для отображения ошибок
    function showError(message) {
        // Проверяем, есть ли уже блок с ошибками
        let errorsContainer = document.querySelector('.auth-errors');
        
        if (!errorsContainer) {
            // Создаем контейнер для ошибок
            errorsContainer = document.createElement('div');
            errorsContainer.className = 'auth-errors';
            
            // Вставляем контейнер для ошибок перед активной формой
            const activeForm = document.querySelector('.auth-form-container.active');
            activeForm.insertBefore(errorsContainer, activeForm.querySelector('h3').nextSibling);
        }
        
        // Очищаем контейнер
        errorsContainer.innerHTML = '';
        
        // Создаем и добавляем сообщение об ошибке
        const errorElement = document.createElement('div');
        errorElement.className = 'auth-error';
        errorElement.textContent = message;
        
        errorsContainer.appendChild(errorElement);
        
        // Анимация появления сообщения
        errorElement.style.opacity = '0';
        errorElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            errorElement.style.opacity = '1';
            errorElement.style.transform = 'translateY(0)';
            errorElement.style.transition = 'opacity 0.3s, transform 0.3s';
        }, 10);
    }
}); 