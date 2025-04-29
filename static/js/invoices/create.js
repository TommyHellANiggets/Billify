document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы формы
    const invoiceForm = document.querySelector('.invoice-form');
    const invoiceItems = document.getElementById('invoice-items');
    const addItemButton = document.getElementById('add-item');
    
    // Функция для обновления сумм по строкам и общих итогов
    function updateTotals() {
        let subtotal = 0;
        
        // Перебираем все строки товаров
        document.querySelectorAll('.invoice-item').forEach(item => {
            const quantity = parseFloat(item.querySelector('input[name="item_quantity[]"]').value) || 0;
            const price = parseFloat(item.querySelector('input[name="item_price[]"]').value) || 0;
            const itemTotal = quantity * price;
            
            // Обновляем сумму по строке
            item.querySelector('.item-total').textContent = itemTotal.toFixed(2);
            
            // Добавляем к подытогу
            subtotal += itemTotal;
        });
        
        // Расчет НДС (20%)
        const tax = subtotal * 0.2;
        
        // Обновляем итоговые значения
        document.getElementById('subtotal').textContent = subtotal.toFixed(2) + ' ₽';
        document.getElementById('tax').textContent = tax.toFixed(2) + ' ₽';
        document.getElementById('total').textContent = (subtotal + tax).toFixed(2) + ' ₽';
    }
    
    // Функция для добавления новой строки товара
    function addNewItemRow() {
        const newRow = document.createElement('tr');
        newRow.className = 'invoice-item';
        
        newRow.innerHTML = `
            <td>
                <input type="text" name="item_name[]" title="Наименование товара/услуги" required>
            </td>
            <td>
                <input type="number" name="item_quantity[]" title="Количество" min="1" value="1" required>
            </td>
            <td>
                <input type="number" name="item_price[]" title="Цена за единицу" min="0" step="0.01" required>
            </td>
            <td class="item-total">0.00</td>
            <td>
                <button type="button" class="btn-icon remove-item" title="Удалить позицию">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Добавляем в таблицу
        invoiceItems.appendChild(newRow);
        
        // Добавляем обработчики событий для новых полей ввода
        const inputs = newRow.querySelectorAll('input[name="item_quantity[]"], input[name="item_price[]"]');
        inputs.forEach(input => {
            input.addEventListener('input', updateTotals);
        });
        
        // Добавляем обработчик для кнопки удаления
        const removeButton = newRow.querySelector('.remove-item');
        removeButton.addEventListener('click', function() {
            newRow.remove();
            updateTotals();
        });
        
        // Фокус на поле с названием товара
        newRow.querySelector('input[name="item_name[]"]').focus();
        
        // Обновляем итоги
        updateTotals();
    }
    
    // Обработчик для кнопки добавления позиции
    if (addItemButton) {
        addItemButton.addEventListener('click', addNewItemRow);
    }
    
    // Обработчики для существующих полей количества и цены
    document.querySelectorAll('input[name="item_quantity[]"], input[name="item_price[]"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
    
    // Обработчики для кнопок удаления
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            // Проверяем, чтобы всегда оставалась хотя бы одна строка
            if (document.querySelectorAll('.invoice-item').length > 1) {
                this.closest('.invoice-item').remove();
                updateTotals();
            } else {
                alert('Необходимо оставить как минимум одну позицию в счете.');
            }
        });
    });
    
    // Автоматическая установка текущей даты для полей даты
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }
    
    // Инициализация расчета итогов
    updateTotals();
    
    // Обработчик отправки формы
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(e) {
            // Здесь можно добавить валидацию перед отправкой
            // Например, проверить, что все поля заполнены
            
            // Для демонстрации просто покажем сообщение
            //e.preventDefault();
            //alert('Счет успешно сохранен!');
        });
    }

    /**
     * Заполнение банковских реквизитов поставщика для входящего счета
     */
    function populateSupplierBankDetails(supplier) {
        if (!supplier) return;
        
        // Заполнение реквизитов
        document.getElementById('supplier_name_display').value = supplier.name || '';
        document.getElementById('supplier_inn_display').value = supplier.inn || '';
        document.getElementById('supplier_bank_display').value = supplier.bank_name || '';
        document.getElementById('supplier_bik_display').value = supplier.bank_bik || '';
        document.getElementById('supplier_account_display').value = supplier.bank_account || '';
        document.getElementById('supplier_corr_account_display').value = supplier.bank_corr_account || '';
        
        // Сохранение полных реквизитов в скрытом поле
        const fullDetails = [
            `Название организации: ${supplier.name || '-'}`,
            `ИНН: ${supplier.inn || '-'}`,
            `Банк: ${supplier.bank_name || '-'}`,
            `БИК: ${supplier.bank_bik || '-'}`,
            `Р/с: ${supplier.bank_account || '-'}`,
            `К/с: ${supplier.bank_corr_account || '-'}`
        ].join('\n');
        
        document.getElementById('payment_details').value = fullDetails;
    }

    /**
     * Заполнение банковских реквизитов компании для исходящего счета
     */
    function populateCompanyBankDetails() {
        // Получаем данные профиля компании из скрытого элемента, созданного json_script
        const companyProfileDataElement = document.getElementById('company-profile-data');
        
        if (companyProfileDataElement) {
            try {
                const companyData = JSON.parse(companyProfileDataElement.textContent);
                
                // Заполняем поля данными из профиля компании
                document.getElementById('company_name').value = companyData.company_name || '';
                document.getElementById('company_inn').value = companyData.inn || '';
                document.getElementById('company_bank').value = companyData.bank_name || '';
                document.getElementById('company_bik').value = companyData.bank_bik || '';
                document.getElementById('company_account').value = companyData.bank_account || '';
                document.getElementById('company_corr_account').value = companyData.bank_corr_account || '';
                
                // Сохранение полных реквизитов в скрытом поле
                const fullDetails = [
                    `Название организации: ${companyData.company_name || '-'}`,
                    `ИНН: ${companyData.inn || '-'}`,
                    `Банк: ${companyData.bank_name || '-'}`,
                    `БИК: ${companyData.bank_bik || '-'}`,
                    `Р/с: ${companyData.bank_account || '-'}`,
                    `К/с: ${companyData.bank_corr_account || '-'}`
                ].join('\n');
                
                document.getElementById('payment_details').value = fullDetails;
            } catch (e) {
                console.error('Ошибка при обработке данных профиля компании:', e);
                
                // В случае ошибки используем заглушки
                document.getElementById('company_name').value = 'Заполните профиль компании';
                document.getElementById('company_inn').value = '';
                document.getElementById('company_bank').value = '';
                document.getElementById('company_bik').value = '';
                document.getElementById('company_account').value = '';
                document.getElementById('company_corr_account').value = '';
                
                document.getElementById('payment_details').value = 'Необходимо заполнить профиль компании';
            }
        } else {
            // Если элемент не найден, используем заглушки
            document.getElementById('company_name').value = 'Заполните профиль компании';
            document.getElementById('company_inn').value = '';
            document.getElementById('company_bank').value = '';
            document.getElementById('company_bik').value = '';
            document.getElementById('company_account').value = '';
            document.getElementById('company_corr_account').value = '';
            
            document.getElementById('payment_details').value = 'Необходимо заполнить профиль компании';
        }
    }

    // Вызов функций инициализации при загрузке страницы
    if (document.getElementById('company_name')) {
        populateCompanyBankDetails();
    }
    
    // Обработчик для выбора поставщика (для входящего счета)
    const supplierItems = document.querySelectorAll('#supplier-list .supplier-item');
    if (supplierItems.length > 0) {
        supplierItems.forEach(item => {
            item.addEventListener('click', function() {
                // Получаем данные из атрибутов элемента
                const supplierId = this.getAttribute('data-id');
                
                // В реальном приложении здесь должен быть AJAX-запрос к серверу
                // для получения полных данных о поставщике
                // Временно используем заглушку
                const supplierData = {
                    name: this.querySelector('.supplier-item-name').textContent,
                    inn: this.querySelector('.supplier-item-inn').textContent.replace('ИНН: ', ''),
                    bank_name: 'АО "Банк поставщика"',
                    bank_bik: '044525123',
                    bank_account: '40702810200000000456',
                    bank_corr_account: '30101810400000000123'
                };
                
                populateSupplierBankDetails(supplierData);
            });
        });
    }

    /**
     * Заполнение банковских реквизитов клиента для исходящего счета
     */
    function populateClientBankDetails(client) {
        if (!client) return;
        
        // Находим элементы для отображения реквизитов
        const nameDisplay = document.getElementById('client_name_display');
        const innDisplay = document.getElementById('client_inn_display');
        const bankDisplay = document.getElementById('client_bank_display');
        const bikDisplay = document.getElementById('client_bik_display');
        const accountDisplay = document.getElementById('client_account_display');
        
        // Если таких элементов нет на странице, выходим
        if (!nameDisplay || !innDisplay) return;
        
        // Заполняем поля данными клиента
        nameDisplay.value = client.name || '';
        innDisplay.value = client.inn || '';
        bankDisplay.value = client.bank_name || '';
        bikDisplay.value = client.bank_bik || '';
        accountDisplay.value = client.bank_account || '';
        
        // Показываем блок с реквизитами
        document.getElementById('client_bank_details').style.display = 'block';
    }

    // Обработчик для выбора клиента
    const clientItems = document.querySelectorAll('#client-list .client-item');
    if (clientItems.length > 0) {
        clientItems.forEach(item => {
            item.addEventListener('click', function() {
                // Получаем данные из атрибутов элемента
                const clientId = this.getAttribute('data-id');
                
                // В реальном приложении здесь нужен AJAX-запрос к серверу
                // для получения полных данных о клиенте
                const clientData = {
                    name: this.querySelector('.client-item-name').textContent,
                    inn: this.querySelector('.client-item-inn').textContent.replace('ИНН: ', ''),
                    bank_name: '',
                    bank_bik: '',
                    bank_account: ''
                };
                
                populateClientBankDetails(clientData);
            });
        });
    }
}); 