document.addEventListener('DOMContentLoaded', function() {
    // Инициализация переключателя типа клиента
    initClientTypeSwitch();
    
    // Переключение шагов
    document.querySelectorAll('.next-step, .prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const goToStep = this.getAttribute('data-goto');
            
            // Валидация перед переходом вперед
            if (this.classList.contains('next-step') && !validateStep(getCurrentStep())) {
                return;
            }
            
            // Обновление активного шага
            document.querySelectorAll('.wizard-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.querySelector(`.wizard-panel[data-panel="${goToStep}"]`).classList.add('active');
            
            // Обновление индикатора шагов
            document.querySelectorAll('.step').forEach(step => {
                step.classList.remove('active');
                if (parseInt(step.getAttribute('data-step')) <= parseInt(goToStep)) {
                    step.classList.add('completed');
                } else {
                    step.classList.remove('completed');
                }
            });
            document.querySelector(`.step[data-step="${goToStep}"]`).classList.add('active');
            
            // Обновление обзора на последнем шаге
            if (goToStep === '3') {
                updateSummary();
            }
        });
    });
    
    // Валидация ИНН
    const taxIdInput = document.getElementById('tax_id');
    if (taxIdInput) {
        taxIdInput.addEventListener('input', function() {
            // Разрешаем только цифры
            this.value = this.value.replace(/[^\d]/g, '');
            
            // Ограничение длины: 10 цифр для юр. лиц, 12 цифр для физ. лиц
            const typeInput = document.getElementById('type');
            const maxLength = typeInput.value === 'business' ? 10 : 12;
            
            if (this.value.length > maxLength) {
                this.value = this.value.slice(0, maxLength);
            }
        });
    }
    
    // Валидация КПП
    const kppInput = document.getElementById('kpp');
    if (kppInput) {
        kppInput.addEventListener('input', function() {
            // Разрешаем только цифры
            this.value = this.value.replace(/[^\d]/g, '');
            
            // КПП всегда состоит из 9 цифр
            if (this.value.length > 9) {
                this.value = this.value.slice(0, 9);
            }
        });
    }
    
    // Валидация ОГРН / ОГРНИП
    const ogrnInput = document.getElementById('ogrn');
    if (ogrnInput) {
        ogrnInput.addEventListener('input', function() {
            // Разрешаем только цифры
            this.value = this.value.replace(/[^\d]/g, '');
            
            // Ограничение длины: 13 цифр для ОГРН, 15 цифр для ОГРНИП
            const typeInput = document.getElementById('type');
            const maxLength = typeInput.value === 'business' ? 13 : 15;
            
            if (this.value.length > maxLength) {
                this.value = this.value.slice(0, maxLength);
            }
        });
    }
    
    // Валидация БИК банка
    const bikInput = document.getElementById('bank_bik');
    if (bikInput) {
        bikInput.addEventListener('input', function() {
            // Разрешаем только цифры
            this.value = this.value.replace(/[^\d]/g, '');
            
            // БИК всегда состоит из 9 цифр
            if (this.value.length > 9) {
                this.value = this.value.slice(0, 9);
            }
        });
    }
    
    // Валидация банковского счета
    const accountInput = document.getElementById('bank_account');
    if (accountInput) {
        accountInput.addEventListener('input', function() {
            // Разрешаем только цифры
            this.value = this.value.replace(/[^\d]/g, '');
            
            // Банковский счет состоит из 20 цифр
            if (this.value.length > 20) {
                this.value = this.value.slice(0, 20);
            }
        });
    }
});

// Инициализация и обработка переключателя типа клиента
function initClientTypeSwitch() {
    const switchOptions = document.querySelectorAll('.switch-option');
    const typeInput = document.getElementById('type');
    const switchContainer = document.querySelector('.switch-container');
    
    if (!switchOptions.length || !typeInput || !switchContainer) return;
    
    // Обработка клика по опциям
    switchOptions.forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            
            // Установка значения в скрытое поле
            typeInput.value = value;
            
            // Обновление активного класса
            switchOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Перемещение слайдера
            switchContainer.setAttribute('data-active', value);
            
            // Показ/скрытие полей для юридических лиц
            toggleBusinessFields(value === 'business');
        });
    });
    
    // Инициализация на основе текущего значения
    const currentValue = typeInput.value;
    switchContainer.setAttribute('data-active', currentValue);
    switchOptions.forEach(opt => {
        if (opt.getAttribute('data-value') === currentValue) {
            opt.classList.add('active');
        } else {
            opt.classList.remove('active');
        }
    });
    
    // Первоначальное скрытие/отображение полей
    toggleBusinessFields(currentValue === 'business');
}

// Показ/скрытие полей для юридических лиц
function toggleBusinessFields(show) {
    const businessFields = document.querySelectorAll('.business-only');
    businessFields.forEach(field => {
        field.style.display = show ? 'block' : 'none';
    });
}

// Получение текущего шага
function getCurrentStep() {
    const activePanel = document.querySelector('.wizard-panel.active');
    return activePanel ? activePanel.getAttribute('data-panel') : '1';
}

// Валидация полей на шаге
function validateStep(step) {
    if (step === '1') {
        const nameInput = document.getElementById('name');
        if (!nameInput.value.trim()) {
            showError('Пожалуйста, укажите имя клиента');
            nameInput.focus();
            return false;
        }
        return true;
    }
    return true;
}

// Обновление сводки на последнем шаге
function updateSummary() {
    const summaryContainer = document.getElementById('summary-container');
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = '';
    
    // Добавим тип клиента в сводку
    const typeInput = document.getElementById('type');
    const clientType = typeInput.value === 'business' ? 'Юридическое лицо' : 'Физическое лицо';
    
    const typeItem = document.createElement('div');
    typeItem.className = 'summary-item';
    typeItem.innerHTML = `<div class="summary-label">Тип клиента:</div>
                         <div class="summary-value">${clientType}</div>`;
    summaryContainer.appendChild(typeItem);
    
    const fields = [
        { id: 'name', label: 'Имя / Организация' },
        { id: 'phone', label: 'Телефон' },
        { id: 'email', label: 'Email' },
        { id: 'tax_id', label: 'ИНН' },
        { id: 'bank_name', label: 'Банк' },
        { id: 'bank_account', label: 'Расчетный счет' },
        { id: 'address', label: 'Адрес' }
    ];
    
    fields.forEach(field => {
        const value = document.getElementById(field.id).value;
        if (value) {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `<div class="summary-label">${field.label}:</div>
                            <div class="summary-value">${value}</div>`;
            summaryContainer.appendChild(item);
        }
    });
}

// Показ сообщения об ошибке
function showError(message) {
    // Создаем элемент сообщения
    let errorDiv = document.querySelector('.error-message');
    
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.padding = '10px';
        errorDiv.style.marginBottom = '15px';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.fontSize = '14px';
        
        // Вставляем перед первой панелью
        const firstPanel = document.querySelector('.wizard-panel.active');
        firstPanel.insertBefore(errorDiv, firstPanel.firstChild);
    }
    
    errorDiv.textContent = message;
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
} 