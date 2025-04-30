document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы формы
    const invoiceForm = document.querySelector('.invoice-form');
    const invoiceItems = document.getElementById('invoice-items');
    const addItemButton = document.getElementById('add-item');
    
    // Инициализация расчета итогов
    updateTotals();
    
    // Вызываем функцию предзаполнения формы
    prepopulateFormForEditing();
});

// Функция для обновления сумм по строкам и общих итогов - сделана глобальной
function updateTotals() {
    window.updateTotalsLoaded = true; // Отмечаем, что глобальная функция загружена
    
    let subtotal = 0;
    
    // Перебираем все строки товаров
    document.querySelectorAll('.invoice-item').forEach(item => {
        const quantityInput = item.querySelector('input[name="item_quantity[]"]');
        const priceInput = item.querySelector('input[name="item_price[]"]');
        
        // Заменяем запятую на точку для корректного преобразования
        const quantity = parseFloat((quantityInput.value || '0').replace(',', '.')) || 0;
        const price = parseFloat((priceInput.value || '0').replace(',', '.')) || 0;
        const itemTotal = quantity * price;
        
        // Обновляем сумму по строке (используем запятую для отображения)
        item.querySelector('.item-total').textContent = itemTotal.toFixed(2).replace('.', ',');
        
        // Добавляем к подытогу
        subtotal += itemTotal;
        
        // Форматируем отображаемое значение с запятой для UI
        quantityInput.value = quantity.toString().replace('.', ',');
        priceInput.value = price.toString().replace('.', ',');
    });
    
    // Получаем скидку, если она есть
    let discount = 0;
    const discountInput = document.getElementById('discount');
    if (discountInput) {
        discount = parseFloat((discountInput.value || '0').replace(',', '.')) || 0;
        // Форматируем отображаемое значение с запятой для UI
        discountInput.value = discount.toString().replace('.', ',');
    }
    
    // Расчет НДС (20%)
    const tax = subtotal * 0.2;
    
    // Обновляем итоговые значения
    const subtotalElem = document.getElementById('subtotal');
    const taxElem = document.getElementById('tax');
    const totalElem = document.getElementById('total');
    
    if (subtotalElem) subtotalElem.textContent = subtotal.toFixed(2).replace('.', ',') + ' ₽';
    if (taxElem) taxElem.textContent = tax.toFixed(2).replace('.', ',') + ' ₽';
    if (totalElem) totalElem.textContent = (subtotal + tax - discount).toFixed(2).replace('.', ',') + ' ₽';
}

// Функция для добавления новой строки товара - сделана глобальной
function addNewItemRow() {
    const invoiceItems = document.getElementById('invoice-items');
    if (!invoiceItems) return;
    
    const newRow = document.createElement('tr');
    newRow.className = 'invoice-item';
    
    newRow.innerHTML = `
        <td>
            <input type="text" name="item_name[]" title="Наименование товара/услуги" required>
        </td>
        <td>
            <input type="text" name="item_quantity[]" title="Количество" value="1" required>
        </td>
        <td>
            <input type="text" name="item_price[]" title="Цена за единицу" value="0,00" required>
        </td>
        <td class="item-total">0,00</td>
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

/**
 * Заполнение банковских реквизитов поставщика для входящего счета
 */
function populateSupplierBankDetails(supplier) {
    if (!supplier) return;
    
    // Заполнение реквизитов
    const nameDisplay = document.getElementById('supplier_name_display');
    const innDisplay = document.getElementById('supplier_inn_display');
    const bankDisplay = document.getElementById('supplier_bank_display');
    const bikDisplay = document.getElementById('supplier_bik_display');
    const accountDisplay = document.getElementById('supplier_account_display');
    const corrAccountDisplay = document.getElementById('supplier_corr_account_display');
    const paymentDetails = document.getElementById('payment_details');
    
    if (nameDisplay) nameDisplay.value = supplier.name || '';
    if (innDisplay) innDisplay.value = supplier.inn || '';
    if (bankDisplay) bankDisplay.value = supplier.bank_name || '';
    if (bikDisplay) bikDisplay.value = supplier.bank_bik || '';
    if (accountDisplay) accountDisplay.value = supplier.bank_account || '';
    if (corrAccountDisplay) corrAccountDisplay.value = supplier.bank_corr_account || '';
    
    // Сохранение полных реквизитов в скрытом поле
    if (paymentDetails) {
        const fullDetails = [
            `Название организации: ${supplier.name || '-'}`,
            `ИНН: ${supplier.inn || '-'}`,
            `Банк: ${supplier.bank_name || '-'}`,
            `БИК: ${supplier.bank_bik || '-'}`,
            `Р/с: ${supplier.bank_account || '-'}`,
            `К/с: ${supplier.bank_corr_account || '-'}`
        ].join('\n');
        
        paymentDetails.value = fullDetails;
    }
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
            const nameInput = document.getElementById('company_name');
            const innInput = document.getElementById('company_inn');
            const bankInput = document.getElementById('company_bank');
            const bikInput = document.getElementById('company_bik');
            const accountInput = document.getElementById('company_account');
            const corrAccountInput = document.getElementById('company_corr_account');
            const paymentDetails = document.getElementById('payment_details');
            
            if (nameInput) nameInput.value = companyData.company_name || '';
            if (innInput) innInput.value = companyData.inn || '';
            if (bankInput) bankInput.value = companyData.bank_name || '';
            if (bikInput) bikInput.value = companyData.bank_bik || '';
            if (accountInput) accountInput.value = companyData.bank_account || '';
            if (corrAccountInput) corrAccountInput.value = companyData.bank_corr_account || '';
            
            // Сохранение полных реквизитов в скрытом поле
            if (paymentDetails) {
                const fullDetails = [
                    `Название организации: ${companyData.company_name || '-'}`,
                    `ИНН: ${companyData.inn || '-'}`,
                    `Банк: ${companyData.bank_name || '-'}`,
                    `БИК: ${companyData.bank_bik || '-'}`,
                    `Р/с: ${companyData.bank_account || '-'}`,
                    `К/с: ${companyData.bank_corr_account || '-'}`
                ].join('\n');
                
                paymentDetails.value = fullDetails;
            }
        } catch (e) {
            console.error('Ошибка при обработке данных профиля компании:', e);
            
            // В случае ошибки используем заглушки
            const nameInput = document.getElementById('company_name');
            const innInput = document.getElementById('company_inn');
            const bankInput = document.getElementById('company_bank');
            const bikInput = document.getElementById('company_bik');
            const accountInput = document.getElementById('company_account');
            const corrAccountInput = document.getElementById('company_corr_account');
            const paymentDetails = document.getElementById('payment_details');
            
            if (nameInput) nameInput.value = 'Заполните профиль компании';
            if (innInput) innInput.value = '';
            if (bankInput) bankInput.value = '';
            if (bikInput) bikInput.value = '';
            if (accountInput) accountInput.value = '';
            if (corrAccountInput) corrAccountInput.value = '';
            
            if (paymentDetails) paymentDetails.value = 'Необходимо заполнить профиль компании';
        }
    } else {
        // Если элемент не найден, используем заглушки
        const nameInput = document.getElementById('company_name');
        const innInput = document.getElementById('company_inn');
        const bankInput = document.getElementById('company_bank');
        const bikInput = document.getElementById('company_bik');
        const accountInput = document.getElementById('company_account');
        const corrAccountInput = document.getElementById('company_corr_account');
        const paymentDetails = document.getElementById('payment_details');
        
        if (nameInput) nameInput.value = 'Заполните профиль компании';
        if (innInput) innInput.value = '';
        if (bankInput) bankInput.value = '';
        if (bikInput) bikInput.value = '';
        if (accountInput) accountInput.value = '';
        if (corrAccountInput) corrAccountInput.value = '';
        
        if (paymentDetails) paymentDetails.value = 'Необходимо заполнить профиль компании';
    }
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
    const bankDetailsContainer = document.getElementById('client_bank_details');
    
    // Если таких элементов нет на странице, выходим
    if (!nameDisplay || !innDisplay) return;
    
    // Заполняем поля данными клиента
    nameDisplay.value = client.name || '';
    innDisplay.value = client.inn || '';
    bankDisplay.value = client.bank_name || '';
    bikDisplay.value = client.bank_bik || '';
    accountDisplay.value = client.bank_account || '';
    
    // Показываем блок с реквизитами
    if (bankDetailsContainer) bankDetailsContainer.style.display = 'block';
}

/**
 * Функция для предзаполнения полей формы при редактировании
 */
function prepopulateFormForEditing() {
    // Проверяем, находимся ли в режиме редактирования
    const invoiceForm = document.querySelector('.invoice-form');
    if (!invoiceForm || !invoiceForm.hasAttribute('data-is-edit')) {
        return;
    }
    
    console.log('Инициализация режима редактирования...');
    
    try {
        // Получаем данные счета из JSON-скрипта
        const invoiceDataElement = document.getElementById('invoice-data');
        if (!invoiceDataElement) {
            console.error('Элемент с ID "invoice-data" не найден');
            return;
        }
        
        const invoiceDataText = invoiceDataElement.textContent.trim();
        console.log('JSON данные из скрипта:', invoiceDataText);
        
        const invoiceData = JSON.parse(invoiceDataText);
        console.log('Загружены данные счета для редактирования:', invoiceData);
        
        // Заполняем основные поля формы
        const invoiceNumber = document.getElementById('invoice_number');
        const invoiceDate = document.getElementById('invoice_date');
        const dueDate = document.getElementById('due_date');
        
        if (invoiceNumber) invoiceNumber.value = invoiceData.number || '';
        if (invoiceDate) invoiceDate.value = invoiceData.issue_date || '';
        if (dueDate) dueDate.value = invoiceData.due_date || '';
        
        // Устанавливаем статус
        const statusSelect = document.getElementById('status');
        if (statusSelect && invoiceData.status) {
            const option = statusSelect.querySelector(`option[value="${invoiceData.status}"]`);
            if (option) {
                option.selected = true;
            }
        }
        
        // Заполняем контактное лицо и email
        const contactNameInput = document.getElementById('contact_name');
        if (contactNameInput) {
            if (invoiceData.client_contact_person) {
                contactNameInput.value = invoiceData.client_contact_person;
            } else if (invoiceData.contact_person) {
                contactNameInput.value = invoiceData.contact_person;
            }
        }
        
        const contactEmailInput = document.getElementById('contact_email');
        if (contactEmailInput) {
            if (invoiceData.client_email) {
                contactEmailInput.value = invoiceData.client_email;
            } else if (invoiceData.contact_email) {
                contactEmailInput.value = invoiceData.contact_email;
            }
        }
        
        // Заполняем примечания и информацию об оплате
        const notesElement = document.getElementById('notes');
        if (notesElement) {
            notesElement.value = invoiceData.notes || '';
        }
        
        const paymentDetailsElement = document.getElementById('payment_details');
        if (paymentDetailsElement) {
            paymentDetailsElement.value = invoiceData.payment_info || '';
        }
        
        // Заполняем реквизиты для оплаты (для исходящего счета)
        const companyNameInput = document.getElementById('company_name');
        if (companyNameInput) {
            companyNameInput.value = invoiceData.supplier_name || '';
        }
        
        const companyInnInput = document.getElementById('company_inn');
        if (companyInnInput) {
            companyInnInput.value = invoiceData.supplier_inn || '';
        }
        
        const companyBankInput = document.getElementById('company_bank');
        if (companyBankInput) {
            companyBankInput.value = invoiceData.supplier_bank || '';
        }
        
        const companyBikInput = document.getElementById('company_bik');
        if (companyBikInput) {
            companyBikInput.value = invoiceData.supplier_bank_bik || '';
        }
        
        const companyAccountInput = document.getElementById('company_account');
        if (companyAccountInput) {
            companyAccountInput.value = invoiceData.supplier_bank_account || '';
        }
        
        const companyCorrAccountInput = document.getElementById('company_corr_account');
        if (companyCorrAccountInput) {
            companyCorrAccountInput.value = invoiceData.supplier_bank_corr_account || '';
        }
        
        // Заполняем реквизиты для оплаты (для входящего счета)
        const supplierNameDisplay = document.getElementById('supplier_name_display');
        if (supplierNameDisplay) {
            supplierNameDisplay.value = invoiceData.supplier_name || '';
        }
        
        const supplierInnDisplay = document.getElementById('supplier_inn_display');
        if (supplierInnDisplay) {
            supplierInnDisplay.value = invoiceData.supplier_inn || '';
        }
        
        const supplierBankDisplay = document.getElementById('supplier_bank_display');
        if (supplierBankDisplay) {
            supplierBankDisplay.value = invoiceData.supplier_bank || '';
        }
        
        const supplierBikDisplay = document.getElementById('supplier_bik_display');
        if (supplierBikDisplay) {
            supplierBikDisplay.value = invoiceData.supplier_bank_bik || '';
        }
        
        const supplierAccountDisplay = document.getElementById('supplier_account_display');
        if (supplierAccountDisplay) {
            supplierAccountDisplay.value = invoiceData.supplier_bank_account || '';
        }
        
        const supplierCorrAccountDisplay = document.getElementById('supplier_corr_account_display');
        if (supplierCorrAccountDisplay) {
            supplierCorrAccountDisplay.value = invoiceData.supplier_bank_corr_account || '';
        }
        
        // Если есть скидка, заполняем поле скидки
        const discountInput = document.getElementById('discount');
        if (discountInput && typeof invoiceData.discount !== 'undefined') {
            // Форматируем скидку с использованием запятой в качестве десятичного разделителя
            discountInput.value = (parseFloat(invoiceData.discount) || 0).toString().replace('.', ',');
        }
        
        // Проверяем, есть ли позиции счета
        if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
            console.log('Найдено позиций:', invoiceData.items.length);
            console.log('Данные позиций:', invoiceData.items);
            
            // Проверяем, есть ли уже существующие строки на странице
            const existingRows = document.querySelectorAll('.invoice-item');
            console.log('Существующие строки в таблице:', existingRows.length);
            
            // Если на странице уже есть строки, мы их используем
            // Если строк недостаточно, мы добавляем новые
            
            // Заполняем существующие строки
            for (let i = 0; i < existingRows.length && i < invoiceData.items.length; i++) {
                const row = existingRows[i];
                const item = invoiceData.items[i];
                
                console.log(`Заполняем строку ${i}:`, item);
                
                const nameInput = row.querySelector('input[name="item_name[]"]');
                const quantityInput = row.querySelector('input[name="item_quantity[]"]');
                const priceInput = row.querySelector('input[name="item_price[]"]');
                const totalCell = row.querySelector('.item-total');
                
                if (nameInput) {
                    nameInput.value = item.description || '';
                    console.log(`Наименование для строки ${i}:`, nameInput.value);
                }
                
                if (quantityInput) {
                    const quantity = parseFloat(String(item.quantity).replace(',', '.')) || 1;
                    quantityInput.value = quantity.toString().replace('.', ',');
                    console.log(`Количество для строки ${i}:`, quantityInput.value);
                }
                
                if (priceInput) {
                    const price = parseFloat(String(item.price).replace(',', '.')) || 0;
                    priceInput.value = price.toString().replace('.', ',');
                    console.log(`Цена для строки ${i}:`, priceInput.value);
                }
                
                if (totalCell) {
                    const amount = parseFloat(String(item.amount).replace(',', '.')) || 0;
                    totalCell.textContent = amount.toFixed(2).replace('.', ',');
                }
            }
            
            // Если позиций больше, чем существующих строк, добавляем новые
            if (invoiceData.items.length > existingRows.length) {
                console.log(`Добавляем ${invoiceData.items.length - existingRows.length} новых строк`);
                
                for (let i = existingRows.length; i < invoiceData.items.length; i++) {
                    const item = invoiceData.items[i];
                    
                    // Добавляем новую строку
                    addNewItemRow();
                    
                    // Получаем новую строку (последнюю добавленную)
                    const newRows = document.querySelectorAll('.invoice-item');
                    const newRow = newRows[newRows.length - 1];
                    
                    // Заполняем новую строку
                    const nameInput = newRow.querySelector('input[name="item_name[]"]');
                    const quantityInput = newRow.querySelector('input[name="item_quantity[]"]');
                    const priceInput = newRow.querySelector('input[name="item_price[]"]');
                    const totalCell = newRow.querySelector('.item-total');
                    
                    if (nameInput) nameInput.value = item.description || '';
                    
                    if (quantityInput) {
                        const quantity = parseFloat(String(item.quantity).replace(',', '.')) || 1;
                        quantityInput.value = quantity.toString().replace('.', ',');
                    }
                    
                    if (priceInput) {
                        const price = parseFloat(String(item.price).replace(',', '.')) || 0;
                        priceInput.value = price.toString().replace('.', ',');
                    }
                    
                    if (totalCell) {
                        const amount = parseFloat(String(item.amount).replace(',', '.')) || 0;
                        totalCell.textContent = amount.toFixed(2).replace('.', ',');
                    }
                }
            }
        } else {
            console.log('Нет позиций для загрузки или массив позиций пуст');
        }
        
        // Обновляем итоги
        updateTotals();
        
        console.log('Форма успешно заполнена данными из существующего счета');
    } catch (error) {
        console.error('Ошибка при заполнении формы:', error);
        console.error('Стек вызовов:', error.stack);
    }
}

// Добавляем обработчики событий при загрузке документа
document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы формы
    const invoiceForm = document.querySelector('.invoice-form');
    const invoiceItems = document.getElementById('invoice-items');
    const addItemButton = document.getElementById('add-item');
    
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
                showNotification('Необходимо оставить как минимум одну позицию в счете.', 'warning');
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
    
    // Обработчик для поля скидки
    const discountInput = document.getElementById('discount');
    if (discountInput) {
        discountInput.addEventListener('input', updateTotals);
    }
    
    // Обработчик отправки формы
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(e) {
            // Здесь можно добавить валидацию перед отправкой
        });
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
    
    // Инициализация расчета итогов
    updateTotals();
    
    // Вызываем функцию предзаполнения формы
    prepopulateFormForEditing();
}); 