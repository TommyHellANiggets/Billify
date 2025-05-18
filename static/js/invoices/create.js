document.addEventListener('DOMContentLoaded', function() {
    // Добавляем фавикон, если он не существует
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>';
        document.head.appendChild(favicon);
    }

    // Получаем элементы формы
    const invoiceForm = document.querySelector('.invoice-form');
    const invoiceItems = document.getElementById('invoice-items');
    const addItemButton = document.getElementById('add-item');
    
    // Инициализация расчета итогов
    updateTotals();
    
    // Вызываем функцию предзаполнения формы
    prepopulateFormForEditing();

    // Установка текущей даты для полей с датой, если они пустые
    setDefaultDates();
    
    // Инициализация кастомных селекторов
    initializeEntitySelectors();
    
    // Инициализация таблицы товаров/услуг
    initializeInvoiceItems();
    
    // Обновление денежных форматов при загрузке страницы
    formatCurrencyInputs();

    // Обработчик кнопки предпросмотра
    const previewButton = document.getElementById('preview-invoice');
    if (previewButton) {
        previewButton.addEventListener('click', function() {
            alert('Функция предпросмотра будет доступна в ближайшем обновлении');
        });
    }
});

// Функция для обновления сумм по строкам и общих итогов - сделана глобальной
function updateTotals() {
    window.updateTotalsLoaded = true; // Отмечаем, что глобальная функция загружена
    
    let subtotal = 0;
    let totalDiscount = 0;
    
    // Перебираем все строки товаров
    document.querySelectorAll('.invoice-item').forEach(item => {
        const quantityInput = item.querySelector('input[name="item_quantity[]"]');
        const priceInput = item.querySelector('input[name="item_price[]"]');
        const discountPercentInput = item.querySelector('input[name="item_discount_percent[]"]');
        const discountInput = item.querySelector('input[name="item_discount[]"]');
        
        // Заменяем запятую на точку для корректного преобразования
        const quantity = parseFloat((quantityInput.value || '0').replace(',', '.')) || 0;
        const price = parseFloat((priceInput.value || '0').replace(',', '.')) || 0;
        const discountPercent = parseFloat((discountPercentInput?.value || '0').replace(',', '.')) || 0;
        
        // Вычисляем сумму по строке с учетом скидки
        const rowTotal = quantity * price;
        const rowDiscount = rowTotal * (discountPercent / 100);
        const itemTotal = rowTotal - rowDiscount;
        
        // Обновляем скрытое поле со скидкой
        if (discountInput) {
            discountInput.value = rowDiscount.toFixed(2).replace('.', ',');
        }
        
        // Обновляем сумму по строке (используем запятую для отображения)
        item.querySelector('.item-total').textContent = itemTotal.toFixed(2).replace('.', ',');
        
        // Добавляем к подытогу и общей скидке
        subtotal += rowTotal;
        totalDiscount += rowDiscount;
        
        // Форматируем отображаемое значение с запятой для UI только если в поле есть значение
        if (quantityInput.value) {
            quantityInput.value = quantity.toString().replace('.', ',');
        }
        if (priceInput.value) {
            priceInput.value = price.toString().replace('.', ',');
        }
        if (discountPercentInput && discountPercentInput.value) {
            discountPercentInput.value = discountPercent.toString().replace('.', ',');
        }
    });
    
    // Обновляем итоговые значения
    const subtotalElem = document.getElementById('subtotal');
    const taxElem = document.getElementById('tax');
    const totalElem = document.getElementById('total');
    const discountDisplay = document.getElementById('discount-display');
    const discountInput = document.getElementById('discount');
    
    if (subtotalElem) subtotalElem.textContent = subtotal.toFixed(2).replace('.', ',') + ' ₽';
    
    // Обновляем отображение и скрытое поле общей скидки
    if (discountDisplay) {
        discountDisplay.textContent = totalDiscount.toFixed(2).replace('.', ',') + ' ₽';
    }
    if (discountInput) {
        discountInput.value = totalDiscount.toFixed(2);
    }
    
    // Применяем скидку к подытогу
    const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    
    // Расчет НДС (20%) от суммы после скидки
    const tax = subtotalAfterDiscount * 0.2;
    if (taxElem) taxElem.textContent = tax.toFixed(2).replace('.', ',') + ' ₽';
    
    // Обновляем общий итог
    if (totalElem) totalElem.textContent = (subtotalAfterDiscount + tax).toFixed(2).replace('.', ',') + ' ₽';
}

// Функция для добавления новой строки товара - сделана глобальной
function addNewItemRow() {
    const invoiceItems = document.getElementById('invoice-items');
    if (!invoiceItems) return;
    
    const newRow = document.createElement('tr');
    newRow.className = 'invoice-item';
    
    // Используем SVG иконку мусорного бака, если доступна функция getSvgIconHtml
    const trashIcon = window.svgIcons && typeof window.svgIcons.getHtml === 'function' 
        ? window.svgIcons.getHtml('icon-trash') 
        : '<i class="fas fa-trash"></i>';
    
    newRow.innerHTML = `
        <td class="item-name-cell">
            <input type="text" name="item_name[]" title="Наименование товара/услуги" required>
        </td>
        <td class="item-quantity-cell">
            <div class="quantity-unit-wrapper">
                <input type="text" name="item_quantity[]" title="Количество" required>
                <select name="item_unit[]" title="Единица измерения" class="item-unit">
                    <option value="шт.">шт.</option>
                    <option value="час.">час.</option>
                    <option value="услуга">услуга</option>
                    <option value="м²">м²</option>
                    <option value="компл.">компл.</option>
                    <option value="мес.">мес.</option>
                </select>
            </div>
        </td>
        <td>
            <input type="text" name="item_price[]" title="Цена за единицу" required>
        </td>
        <td>
            <input type="text" name="item_discount_percent[]" title="Скидка %" class="item-discount-percent" placeholder="%">
            <input type="hidden" name="item_discount[]" class="item-discount">
        </td>
        <td class="item-total">0,00</td>
        <td>
            <button type="button" class="btn-icon remove-item" title="Удалить позицию">
                ${trashIcon}
            </button>
        </td>
    `;
    
    // Добавляем в таблицу
    invoiceItems.appendChild(newRow);
    
    // Добавляем обработчики событий
    const quantityInput = newRow.querySelector('input[name="item_quantity[]"]');
    const priceInput = newRow.querySelector('input[name="item_price[]"]');
    const discountPercentInput = newRow.querySelector('input[name="item_discount_percent[]"]');
    const discountInput = newRow.querySelector('input[name="item_discount[]"]');
    const removeButton = newRow.querySelector('.remove-item');
    
    // Обработчик для кнопки удаления
    removeButton.addEventListener('click', function() {
        newRow.remove();
        updateTotals();
    });
    
    // Обработчики для полей ввода
    [quantityInput, priceInput, discountPercentInput].forEach(input => {
        if (!input) return;
        
        input.addEventListener('focus', function() {
            if (input === discountPercentInput) {
                this.value = this.value.replace(/\s/g, '').replace(',', '.').replace('%', '');
            } else {
                this.value = this.value.replace(/\s/g, '').replace(',', '.');
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.value) {
                if (input === discountPercentInput) {
                    let percent = parseFloat(this.value.replace(',', '.')) || 0;
                    // Ограничиваем процент скидки от 0 до 100
                    if (percent < 0) percent = 0;
                    if (percent > 100) percent = 100;
                    this.value = percent.toString().replace('.', ',');
                    
                    // Рассчитываем и обновляем сумму скидки
                    const quantity = parseFloat(quantityInput.value.replace(',', '.')) || 0;
                    const price = parseFloat(priceInput.value.replace(',', '.')) || 0;
                    const itemTotal = quantity * price;
                    const discount = itemTotal * (percent / 100);
                    
                    if (discountInput) {
                        discountInput.value = discount.toFixed(2).replace('.', ',');
                    }
                } else {
                    this.value = parseFloat(this.value.replace(',', '.')).toFixed(2).replace('.', ',');
                }
                updateTotals();
            }
        });
        
        input.addEventListener('input', function() {
            updateTotals();
        });
    });
    
    // Обновляем итоги
    updateTotals();
}

/**
 * Заполнение банковских реквизитов поставщика для входящего счета
 */
function populateSupplierBankDetails(supplier) {
    if (!supplier) return;
    
    console.log('Заполняем реквизиты поставщика из API:', supplier);
    
    // Заполнение реквизитов
    const nameDisplay = document.getElementById('supplier_name_display');
    const innDisplay = document.getElementById('supplier_inn_display');
    const bankDisplay = document.getElementById('supplier_bank_display');
    const bikDisplay = document.getElementById('supplier_bik_display');
    const accountDisplay = document.getElementById('supplier_account_display');
    const corrAccountDisplay = document.getElementById('supplier_corr_account_display');
    const paymentDetails = document.getElementById('payment_details');
    
    // Находим поля для контактного лица и email
    const contactNameInput = document.getElementById('contact_name');
    const contactEmailInput = document.getElementById('contact_email');
    
    // Определяем ИНН (может быть как inn, так и tax_id в зависимости от источника данных)
    const inn = supplier.inn || supplier.tax_id || '';
    
    if (nameDisplay) nameDisplay.value = supplier.name || '';
    if (innDisplay) innDisplay.value = inn;
    if (bankDisplay) bankDisplay.value = supplier.bank_name || '';
    if (bikDisplay) bikDisplay.value = supplier.bank_bik || '';
    if (accountDisplay) accountDisplay.value = supplier.bank_account || '';
    if (corrAccountDisplay) corrAccountDisplay.value = supplier.bank_corr_account || '';
    
    // Заполняем контактную информацию исключительно из API данных
    if (contactNameInput) contactNameInput.value = supplier.contact_person || '';
    if (contactEmailInput) contactEmailInput.value = supplier.contact_email || '';
    
    // Сохранение полных реквизитов в скрытом поле
    if (paymentDetails) {
        const fullDetails = [
            `Название организации: ${supplier.name || '-'}`,
            `ИНН: ${inn || '-'}`,
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
    
    // Находим поля для контактного лица и email
    const contactNameInput = document.getElementById('contact_name');
    const contactEmailInput = document.getElementById('contact_email');
    
    // Если таких элементов нет на странице, выходим
    if (!nameDisplay || !innDisplay) return;
    
    // Заполняем поля данными клиента
    nameDisplay.value = client.name || '';
    innDisplay.value = client.inn || '';
    bankDisplay.value = client.bank_name || '';
    bikDisplay.value = client.bank_bik || '';
    accountDisplay.value = client.bank_account || '';
    
    // Заполняем контактную информацию
    if (contactNameInput) contactNameInput.value = client.contact_person || '';
    if (contactEmailInput) contactEmailInput.value = client.contact_email || '';
    
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

// Устанавливает текущую дату для полей с датой
function setDefaultDates() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Устанавливаем текущую дату для поля даты счета, если оно пустое
    const invoiceDateInput = document.getElementById('invoice_date');
    if (invoiceDateInput && !invoiceDateInput.value) {
        invoiceDateInput.value = formattedDate;
    }
    
    // Устанавливаем срок оплаты через 15 дней, если поле пустое
    const dueDateInput = document.getElementById('due_date');
    if (dueDateInput && !dueDateInput.value) {
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 15);
        dueDateInput.value = dueDate.toISOString().split('T')[0];
    }
}

// Инициализация кастомных селекторов (клиент/поставщик)
function initializeEntitySelectors() {
    // Инициализация селектора клиента (для исходящего счета)
    initializeEntitySelector('client');
    
    // Инициализация селектора поставщика (для входящего счета)
    initializeEntitySelector('supplier');
}

// Инициализация конкретного селектора (клиент или поставщик)
function initializeEntitySelector(type) {
    const entitySelect = document.getElementById(`${type}-select`);
    const entityDropdown = document.getElementById(`${type}-dropdown`);
    const entitySearch = document.getElementById(`${type}-search`);
    const idInput = document.getElementById(`${type}_id`);
    const contactNameInput = document.getElementById('contact_name');
    const contactEmailInput = document.getElementById('contact_email');
    const addButton = document.getElementById(`add-${type}`);
    const dynamicListId = `dynamic-${type}s-list`;
    const listContainer = document.getElementById(dynamicListId);
    
    if (!entitySelect || !entityDropdown || !listContainer) {
        return; // Если элементы не найдены, прерываем инициализацию
    }
    
    // Получаем данные из JSON-скрипта
    const dataScriptId = `${type}s-data`;
    const dataScript = document.getElementById(dataScriptId);
    let entities = [];
    
    if (dataScript) {
        try {
            entities = JSON.parse(dataScript.textContent);
        } catch (e) {
            console.error(`Ошибка при парсинге данных ${type}:`, e);
        }
    }
    
    // Функция для открытия/закрытия выпадающего списка
    function toggleDropdown() {
        entitySelect.classList.toggle('active');
        entityDropdown.classList.toggle('show');
        
        if (entityDropdown.classList.contains('show')) {
            entitySearch.focus();
        }
    }
    
    // Обработчик клика на селект
    entitySelect.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown();
    });
    
    // Закрытие выпадающего списка при клике вне его
    document.addEventListener('click', function(e) {
        if (!entitySelect.contains(e.target) && !entityDropdown.contains(e.target)) {
            entitySelect.classList.remove('active');
            entityDropdown.classList.remove('show');
        }
    });
    
    // Заполняем список элементами
    if (listContainer && entities.length > 0) {
        entities.forEach(entity => {
            const element = document.createElement('div');
            element.className = 'entity-item';
            element.setAttribute('data-id', entity.id);
            element.setAttribute('data-name', entity.name);
            element.setAttribute('data-contact', entity.contact_person || '');
            element.setAttribute('data-email', entity.email || '');
            element.setAttribute('data-inn', entity.tax_id || '');
            element.setAttribute('data-bank', entity.bank_name || '');
            element.setAttribute('data-bik', entity.bank_bik || '');
            element.setAttribute('data-account', entity.bank_account || '');
            element.setAttribute('data-corr-account', entity.bank_corr_account || '');
            
            element.innerHTML = `
                <div class="entity-item-name">${entity.name}</div>
                <div class="entity-item-info">
                    <span class="entity-item-inn">ИНН: ${entity.tax_id || 'Не указан'}</span>
                    ${entity.phone ? `<span class="entity-item-phone">Тел: ${entity.phone}</span>` : ''}
                </div>
            `;
            
            // Обработчик клика на элемент списка
            element.addEventListener('click', function() {
                selectEntity(this, type);
            });
            
            listContainer.appendChild(element);
        });
    } else {
        // Если список пуст
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = `Список ${type === 'client' ? 'клиентов' : 'поставщиков'} пуст`;
        listContainer.appendChild(noResults);
    }
    
    // Функция выбора элемента из списка
    function selectEntity(item, entityType) {
        const id = item.getAttribute('data-id');
        const name = item.getAttribute('data-name');
        const contact = item.getAttribute('data-contact') || '';
        const email = item.getAttribute('data-email') || '';
        const inn = item.getAttribute('data-inn') || '';
        const bank = item.getAttribute('data-bank') || '';
        const bik = item.getAttribute('data-bik') || '';
        const account = item.getAttribute('data-account') || '';
        const corrAccount = item.getAttribute('data-corr-account') || '';
        
        // Обновляем выбранное значение в селекторе
        entitySelect.querySelector('span').textContent = name;
        idInput.value = id;
        
        // Заполняем контактные данные
        contactNameInput.value = contact;
        contactEmailInput.value = email;
        
        // Заполняем банковские реквизиты, если доступны
        const bankDetailsContainer = document.getElementById(`${entityType}_bank_details`);
        if (bankDetailsContainer) {
            document.getElementById(`${entityType}_name_display`).value = name;
            document.getElementById(`${entityType}_inn_display`).value = inn;
            document.getElementById(`${entityType}_bank_display`).value = bank;
            document.getElementById(`${entityType}_bik_display`).value = bik;
            document.getElementById(`${entityType}_account_display`).value = account;
            
            const corrAccountDisplay = document.getElementById(`${entityType}_corr_account_display`);
            if (corrAccountDisplay) {
                corrAccountDisplay.value = corrAccount;
            }
            
            // Показываем блок с реквизитами
            bankDetailsContainer.style.display = 'block';
        }
        
        // Скрываем выпадающий список
        entitySelect.classList.remove('active');
        entityDropdown.classList.remove('show');
    }
    
    // Обработчик для поиска
    if (entitySearch) {
        entitySearch.addEventListener('input', function() {
            const searchValue = this.value.toLowerCase();
            const items = listContainer.querySelectorAll('.entity-item');
            let hasResults = false;
            
            items.forEach(item => {
                const name = item.querySelector('.entity-item-name').textContent.toLowerCase();
                const info = item.querySelector('.entity-item-info').textContent.toLowerCase();
                
                if (name.includes(searchValue) || info.includes(searchValue)) {
                    item.style.display = 'block';
                    hasResults = true;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Показать/скрыть сообщение об отсутствии результатов
            let noResults = listContainer.querySelector('.no-results');
            if (!hasResults) {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.textContent = `Нет результатов для "${searchValue}"`;
                    listContainer.appendChild(noResults);
                } else {
                    noResults.textContent = `Нет результатов для "${searchValue}"`;
                    noResults.style.display = 'block';
                }
            } else if (noResults) {
                noResults.style.display = 'none';
            }
        });
    }
    
    // Обработчик для добавления нового элемента
    if (addButton) {
        addButton.addEventListener('click', function() {
            window.location.href = type === 'client' 
                ? '/clients/create/' 
                : '/suppliers/create/';
        });
    }
    
    // Инициализация выбранного элемента по ID при загрузке страницы
    const isEditMode = document.querySelector('.invoice-form').getAttribute('data-is-edit') === 'true';
    if (isEditMode && idInput.value) {
        const items = listContainer.querySelectorAll('.entity-item');
        for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute('data-id') === idInput.value) {
                selectEntity(items[i], type);
                break;
            }
        }
    }
}

// Инициализация таблицы товаров/услуг
function initializeInvoiceItems() {
    const itemsContainer = document.getElementById('invoice-items');
    const addItemButton = document.getElementById('add-item');
    const discountInput = document.getElementById('discount');
    
    if (!itemsContainer || !addItemButton) {
        console.error('Не найдены необходимые элементы для инициализации товаров');
        return;
    }
    
    // Добавляем обработчики для существующих строк
    updateExistingItemsHandlers();
    
    // Добавляем обработчик для кнопки добавления новой позиции
    addItemButton.addEventListener('click', addInvoiceItem);
    
    // Добавляем обработчики для поля общей скидки
    if (discountInput) {
        discountInput.addEventListener('input', function() {
            calculateTotals();
        });
        
        discountInput.addEventListener('focus', function() {
            this.value = this.value.replace(/\s/g, '').replace(',', '.');
        });
        
        discountInput.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value.replace(',', '.')).toFixed(2).replace('.', ',');
                calculateTotals();
            }
        });
    }
    
    // Функция для добавления новой позиции
    function addInvoiceItem() {
        const newRow = document.createElement('tr');
        newRow.className = 'invoice-item';
        
        // Используем SVG иконку мусорного бака
        const trashIcon = window.svgIcons && typeof window.svgIcons.getHtml === 'function' 
            ? window.svgIcons.getHtml('icon-trash')
            : '<i class="fas fa-trash"></i>';
        
        newRow.innerHTML = `
            <td class="item-name-cell">
                <input type="text" name="item_name[]" title="Наименование товара/услуги" required>
            </td>
            <td class="item-quantity-cell">
                <div class="quantity-unit-wrapper">
                    <input type="text" name="item_quantity[]" title="Количество" required>
                    <select name="item_unit[]" title="Единица измерения" class="item-unit">
                        <option value="шт.">шт.</option>
                        <option value="час.">час.</option>
                        <option value="услуга">услуга</option>
                        <option value="м²">м²</option>
                        <option value="компл.">компл.</option>
                        <option value="мес.">мес.</option>
                    </select>
                </div>
            </td>
            <td>
                <input type="text" name="item_price[]" title="Цена за единицу" required>
            </td>
            <td>
                <input type="text" name="item_discount[]" title="Скидка" class="item-discount">
            </td>
            <td class="item-total">0,00</td>
            <td>
                <button type="button" class="btn-icon remove-item" title="Удалить позицию">
                    ${trashIcon}
                </button>
            </td>
        `;
        
        itemsContainer.appendChild(newRow);
        
        // Добавляем обработчики для новой строки
        addItemHandlers(newRow);
        
        // Фокусируемся на поле названия
        const nameInput = newRow.querySelector('input[name="item_name[]"]');
        nameInput.focus();
    }
    
    // Добавляет обработчики событий для существующих позиций
    function updateExistingItemsHandlers() {
        const rows = itemsContainer.querySelectorAll('.invoice-item');
        
        rows.forEach(row => {
            addItemHandlers(row);
        });
    }
    
    // Добавляет обработчики событий для конкретной строки
    function addItemHandlers(row) {
        // Кнопка удаления
        const removeButton = row.querySelector('.remove-item');
        removeButton.addEventListener('click', function() {
            if (itemsContainer.querySelectorAll('.invoice-item').length > 1) {
                row.remove();
                calculateTotals();
            } else {
                alert('Должна быть хотя бы одна позиция в счете');
            }
        });
        
        // Обработчики ввода для полей количества, цены и скидки
        const quantityInput = row.querySelector('input[name="item_quantity[]"]');
        const priceInput = row.querySelector('input[name="item_price[]"]');
        const discountPercentInput = row.querySelector('input[name="item_discount_percent[]"]');
        const discountInput = row.querySelector('input[name="item_discount[]"]');
        const totalCell = row.querySelector('.item-total');
        
        // Форматирование при фокусе и потере фокуса
        quantityInput.addEventListener('focus', function() {
            this.value = this.value.replace(/\s/g, '').replace(',', '.');
        });
        
        quantityInput.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value.replace(',', '.')).toFixed(2).replace('.', ',');
                calculateRowTotal(row);
            }
        });
        
        priceInput.addEventListener('focus', function() {
            this.value = this.value.replace(/\s/g, '').replace(',', '.');
        });
        
        priceInput.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseFloat(this.value.replace(',', '.')).toFixed(2).replace('.', ',');
                calculateRowTotal(row);
            }
        });
        
        if (discountPercentInput) {
            discountPercentInput.addEventListener('focus', function() {
                this.value = this.value.replace(/\s/g, '').replace(',', '.').replace('%', '');
            });
            
            discountPercentInput.addEventListener('blur', function() {
                if (this.value) {
                    let percent = parseFloat(this.value.replace(',', '.')) || 0;
                    // Ограничиваем процент скидки от 0 до 100
                    if (percent < 0) percent = 0;
                    if (percent > 100) percent = 100;
                    this.value = percent.toString().replace('.', ',');
                    calculateRowTotal(row);
                }
            });
            
            discountPercentInput.addEventListener('input', function() {
                calculateRowTotal(row);
            });
        }
        
        // Пересчет суммы при изменении количества или цены
        quantityInput.addEventListener('input', function() {
            calculateRowTotal(row);
        });
        
        priceInput.addEventListener('input', function() {
            calculateRowTotal(row);
        });
    }
    
    // Расчет суммы для конкретной строки
    function calculateRowTotal(row) {
        const quantityInput = row.querySelector('input[name="item_quantity[]"]');
        const priceInput = row.querySelector('input[name="item_price[]"]');
        const discountPercentInput = row.querySelector('input[name="item_discount_percent[]"]');
        const discountInput = row.querySelector('input[name="item_discount[]"]');
        const totalCell = row.querySelector('.item-total');
        
        // Только если поля не пустые, преобразуем значения
        const quantity = quantityInput.value ? parseFloat(quantityInput.value.replace(',', '.')) || 0 : 0;
        const price = priceInput.value ? parseFloat(priceInput.value.replace(',', '.')) || 0 : 0;
        const itemTotal = quantity * price;
        
        // Если указан процент скидки, рассчитываем сумму скидки
        let discount = 0;
        if (discountPercentInput && discountPercentInput.value) {
            const discountPercent = parseFloat(discountPercentInput.value.replace(',', '.')) || 0;
            if (discountPercent > 100) {
                discountPercent = 100;
                discountPercentInput.value = "100";
            }
            discount = itemTotal * (discountPercent / 100);
            
            // Обновляем скрытое поле с суммой скидки
            if (discountInput) {
                discountInput.value = discount.toFixed(2).replace('.', ',');
            }
        }
        
        // Вычисляем сумму с учетом скидки
        const total = itemTotal - discount;
        
        totalCell.textContent = total.toFixed(2).replace('.', ',');
        
        // Пересчитываем общие итоги
        calculateTotals();
    }
}

// Расчет итоговых сумм
function calculateTotals() {
    const rows = document.querySelectorAll('.invoice-item');
    let subtotal = 0;
    let totalDiscount = 0;
    
    // Суммируем все позиции
    rows.forEach(row => {
        const quantityInput = row.querySelector('input[name="item_quantity[]"]');
        const priceInput = row.querySelector('input[name="item_price[]"]');
        const discountPercentInput = row.querySelector('input[name="item_discount_percent[]"]');
        const discountInput = row.querySelector('input[name="item_discount[]"]');
        
        if (!quantityInput || !priceInput) return;
        
        const quantity = parseFloat(quantityInput.value.replace(',', '.')) || 0;
        const price = parseFloat(priceInput.value.replace(',', '.')) || 0;
        const discountPercent = parseFloat(discountPercentInput?.value.replace(',', '.')) || 0;
        
        const rowTotal = quantity * price;
        const rowDiscount = rowTotal * (discountPercent / 100);
        
        // Обновляем общие суммы
        subtotal += rowTotal;
        totalDiscount += rowDiscount;
        
        // Обновляем скрытое поле со скидкой
        if (discountInput) {
            discountInput.value = rowDiscount.toFixed(2).replace('.', ',');
        }
        
        // Обновляем отображаемую сумму по строке
        const totalCell = row.querySelector('.item-total');
        if (totalCell) {
            totalCell.textContent = (rowTotal - rowDiscount).toFixed(2).replace('.', ',');
        }
    });
    
    // Обновляем подытог
    const subtotalElement = document.getElementById('subtotal');
    subtotalElement.textContent = subtotal.toFixed(2).replace('.', ',') + ' ₽';
    
    // Обновляем отображение общей скидки
    const discountElement = document.getElementById('discount-display');
    const discountInput = document.getElementById('discount');
    
    if (discountElement) {
        discountElement.textContent = totalDiscount.toFixed(2).replace('.', ',') + ' ₽';
    }
    
    // Обновляем скрытое поле для передачи значения на сервер
    if (discountInput) {
        discountInput.value = totalDiscount.toFixed(2).replace('.', ',');
    }
    
    // Применяем скидку к подытогу
    const subtotalAfterDiscount = Math.max(0, subtotal - totalDiscount);
    
    // Вычисляем НДС (20%) от суммы после скидки
    const tax = subtotalAfterDiscount * 0.2;
    const taxElement = document.getElementById('tax');
    taxElement.textContent = tax.toFixed(2).replace('.', ',') + ' ₽';
    
    // Вычисляем итоговую сумму
    const total = subtotalAfterDiscount + tax;
    const totalElement = document.getElementById('total');
    totalElement.textContent = total.toFixed(2).replace('.', ',') + ' ₽';
}

// Форматирование полей с денежными значениями
function formatCurrencyInputs() {
    const currencyInputs = document.querySelectorAll('input[name="item_price[]"], input[name="item_quantity[]"], #discount');
    
    currencyInputs.forEach(input => {
        input.addEventListener('focus', function() {
            // При фокусе заменяем запятую на точку только если есть значение
            if (this.value) {
                this.value = this.value.replace(/\s/g, '').replace(',', '.');
            }
        });
        
        input.addEventListener('blur', function() {
            // При потере фокуса форматируем только если есть значение
            if (this.value) {
                this.value = parseFloat(this.value.replace(',', '.')).toFixed(2).replace('.', ',');
            }
        });
    });
} 