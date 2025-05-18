/**
 * Функционал сканирования PDF-документов счетов
 */

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация сканера после загрузки DOM
    initScanner();
});

/**
 * Инициализирует функционал сканера
 */
function initScanner() {
    const scanButton = document.getElementById('scan-invoice-btn');
    if (!scanButton) return;
    
    const scanModalOverlay = document.getElementById('scan-modal-overlay');
    const scanModal = document.getElementById('scan-modal');
    const closeButton = document.getElementById('scan-modal-close');
    const scanForm = document.getElementById('scan-form');
    const scanDropzone = document.getElementById('scan-dropzone');
    const fileInput = document.getElementById('scan-file-input');
    const browseButton = document.getElementById('scan-browse-btn');
    const scanButton2 = document.getElementById('scan-button');
    const cancelButton = document.getElementById('scan-cancel-button');
    const applyButton = document.getElementById('scan-apply-button');
    
    // Обработчик открытия модального окна
    scanButton.addEventListener('click', function(e) {
        e.preventDefault();
        openScanModal();
    });
    
    // Обработчик закрытия модального окна
    if (closeButton) {
        closeButton.addEventListener('click', closeScanModal);
    }
    
    // Закрытие модального окна при клике вне его области
    if (scanModalOverlay) {
        scanModalOverlay.addEventListener('click', function(e) {
            if (e.target === scanModalOverlay) {
                closeScanModal();
            }
        });
    }
    
    // Обработчик нажатия клавиши Escape для закрытия модального окна
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && scanModalOverlay && scanModalOverlay.classList.contains('active')) {
            closeScanModal();
        }
    });
    
    // Обработчик кнопки "Отмена"
    if (cancelButton) {
        cancelButton.addEventListener('click', closeScanModal);
    }
    
    // Инициализация дропзоны
    if (scanDropzone && fileInput) {
        // Клик по дропзоне открывает диалог выбора файла
        scanDropzone.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Обработка выбора файла
        fileInput.addEventListener('change', function() {
            handleFileSelect(this.files);
        });
        
        // Обработка перетаскивания файла
        scanDropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('active');
        });
        
        scanDropzone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
        });
        
        scanDropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('active');
            
            const files = e.dataTransfer.files;
            handleFileSelect(files);
        });
    }
    
    // Обработчик клика по кнопке "Выбрать файл"
    if (browseButton) {
        browseButton.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });
    }
    
    // Обработчик кнопки "Сканировать"
    if (scanButton2 && scanForm) {
        scanButton2.addEventListener('click', function(e) {
            e.preventDefault();
            scanPDF();
        });
    }
    
    // Обработчик кнопки "Применить"
    if (applyButton) {
        applyButton.addEventListener('click', function(e) {
            e.preventDefault();
            applyScannedItems();
        });
    }
}

/**
 * Открывает модальное окно сканера
 */
function openScanModal() {
    const scanModalOverlay = document.getElementById('scan-modal-overlay');
    const scanModal = document.getElementById('scan-modal');
    
    if (scanModalOverlay && scanModal) {
        // Показываем оверлей
        scanModalOverlay.classList.add('active');
        
        // Анимируем появление модального окна
        setTimeout(() => {
            scanModal.classList.add('active');
        }, 10);
        
        // Блокируем прокрутку страницы
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Закрывает модальное окно сканера
 */
function closeScanModal() {
    const scanModalOverlay = document.getElementById('scan-modal-overlay');
    const scanModal = document.getElementById('scan-modal');
    const scanError = document.getElementById('scan-error');
    const scanResults = document.getElementById('scan-results');
    const scanLoading = document.getElementById('scan-loading');
    const filePreview = document.getElementById('scan-file-preview');
    const fileInput = document.getElementById('scan-file-input');
    
    if (scanModal) {
        // Анимируем скрытие модального окна
        scanModal.classList.remove('active');
        
        // Задержка перед скрытием оверлея
        setTimeout(() => {
            if (scanModalOverlay) {
                scanModalOverlay.classList.remove('active');
            }
            
            // Разблокируем прокрутку страницы
            document.body.style.overflow = '';
            
            // Сбрасываем состояние модального окна
            if (scanError) scanError.classList.remove('active');
            if (scanResults) scanResults.classList.remove('active');
            if (scanLoading) scanLoading.classList.remove('active');
            if (filePreview) filePreview.style.display = 'none';
            if (fileInput) fileInput.value = '';
        }, 300);
    }
}

/**
 * Обрабатывает выбор файла (из input или Drag and Drop)
 */
function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const filePreviewContainer = document.getElementById('scan-file-preview');
    const fileNameElement = document.getElementById('scan-file-name');
    const fileSizeElement = document.getElementById('scan-file-size');
    const removeFileButton = document.getElementById('scan-file-remove');
    const scanButton = document.getElementById('scan-button');
    
    // Проверяем тип файла
    if (file.type !== 'application/pdf') {
        showScanError('Неверный формат файла', 'Пожалуйста, выберите PDF-документ');
        return;
    }
    
    // Отображаем информацию о файле
    if (filePreviewContainer && fileNameElement && fileSizeElement) {
        fileNameElement.textContent = file.name;
        fileSizeElement.textContent = formatFileSize(file.size);
        filePreviewContainer.style.display = 'flex';
        
        // Активируем кнопку сканирования
        if (scanButton) {
            scanButton.disabled = false;
        }
    }
    
    // Обработчик удаления файла
    if (removeFileButton) {
        removeFileButton.addEventListener('click', function() {
            const fileInput = document.getElementById('scan-file-input');
            if (fileInput) fileInput.value = '';
            filePreviewContainer.style.display = 'none';
            
            // Деактивируем кнопку сканирования
            if (scanButton) {
                scanButton.disabled = true;
            }
        });
    }
}

/**
 * Форматирует размер файла в человекочитаемый формат
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 байт';
    
    const sizes = ['байт', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Отображает ошибку в модальном окне
 */
function showScanError(title, message) {
    const errorContainer = document.getElementById('scan-error');
    const errorTitle = document.getElementById('scan-error-title');
    const errorMessage = document.getElementById('scan-error-message');
    const loadingContainer = document.getElementById('scan-loading');
    
    if (errorContainer && errorTitle && errorMessage) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorContainer.classList.add('active');
        
        // Скрываем индикатор загрузки, если он активен
        if (loadingContainer && loadingContainer.classList.contains('active')) {
            loadingContainer.classList.remove('active');
        }
    }
}

/**
 * Сканирует PDF-файл и получает данные
 */
function scanPDF() {
    const fileInput = document.getElementById('scan-file-input');
    const loadingContainer = document.getElementById('scan-loading');
    const errorContainer = document.getElementById('scan-error');
    const resultsContainer = document.getElementById('scan-results');
    const applyButton = document.getElementById('scan-apply-button');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showScanError('Файл не выбран', 'Пожалуйста, выберите PDF-документ для сканирования');
        return;
    }
    
    // Скрываем ошибку, если она была показана
    if (errorContainer) {
        errorContainer.classList.remove('active');
    }
    
    // Показываем индикатор загрузки
    if (loadingContainer) {
        loadingContainer.classList.add('active');
    }
    
    // Скрываем результаты, если они были показаны
    if (resultsContainer) {
        resultsContainer.classList.remove('active');
    }
    
    // Деактивируем кнопку "Применить"
    if (applyButton) {
        applyButton.disabled = true;
    }
    
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    formData.append('invoice_file', fileInput.files[0]);
    formData.append('scan_type', 'items');
    
    // Получаем CSRF-токен
    const csrfToken = getCsrfToken();
    
    // Отправляем запрос на сервер
    fetch('/invoices/scan/items/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        // Скрываем индикатор загрузки
        if (loadingContainer) {
            loadingContainer.classList.remove('active');
        }
        
        if (data.success) {
            // Показываем результаты сканирования
            showScanResults(data.items);
            
            // Активируем кнопку "Применить"
            if (applyButton) {
                applyButton.disabled = false;
            }
        } else {
            // Показываем ошибку
            showScanError('Ошибка сканирования', data.error || 'Не удалось извлечь данные из PDF-документа');
        }
    })
    .catch(error => {
        // Скрываем индикатор загрузки
        if (loadingContainer) {
            loadingContainer.classList.remove('active');
        }
        
        // Показываем ошибку
        showScanError('Ошибка запроса', 'Произошла ошибка при отправке запроса на сервер: ' + error.message);
    });
}

/**
 * Отображает результаты сканирования
 */
function showScanResults(items) {
    const resultsContainer = document.getElementById('scan-results');
    const itemsContainer = document.getElementById('scan-results-items');
    
    if (!resultsContainer || !itemsContainer) return;
    
    // Очищаем контейнер результатов
    itemsContainer.innerHTML = '';
    
    if (items && items.length > 0) {
        // Создаем элементы для каждой позиции
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'scan-item';
            itemElement.innerHTML = `
                <input type="checkbox" class="scan-item-checkbox" id="scan-item-${index}" checked>
                <div class="scan-item-details">
                    <div class="scan-item-name">${item.name}</div>
                    <div class="scan-item-quantity">Количество: ${item.quantity}</div>
                    <div class="scan-item-price">Цена: ${item.price.toFixed(2)} ₽</div>
                </div>
            `;
            
            // Добавляем позицию в контейнер
            itemsContainer.appendChild(itemElement);
        });
        
        // Показываем контейнер результатов
        resultsContainer.classList.add('active');
    } else {
        // Если позиций нет, показываем сообщение
        itemsContainer.innerHTML = '<div class="scan-item"><div class="scan-item-details">Не найдено позиций в документе</div></div>';
        resultsContainer.classList.add('active');
    }
}

/**
 * Применяет отсканированные позиции к форме счета
 */
function applyScannedItems() {
    const resultsContainer = document.getElementById('scan-results');
    const itemCheckboxes = document.querySelectorAll('.scan-item-checkbox:checked');
    
    if (!resultsContainer || itemCheckboxes.length === 0) {
        // Нет выбранных позиций
        closeScanModal();
        return;
    }
    
    // Получаем имена и данные выбранных позиций
    const selectedItems = [];
    itemCheckboxes.forEach(checkbox => {
        const itemElement = checkbox.closest('.scan-item');
        const nameElement = itemElement.querySelector('.scan-item-name');
        const quantityElement = itemElement.querySelector('.scan-item-quantity');
        const priceElement = itemElement.querySelector('.scan-item-price');
        
        if (nameElement && quantityElement && priceElement) {
            const name = nameElement.textContent;
            const quantityMatch = quantityElement.textContent.match(/\d+(\.\d+)?/);
            const priceMatch = priceElement.textContent.match(/\d+(\.\d+)?/);
            
            const quantity = quantityMatch ? parseFloat(quantityMatch[0]) : 1;
            const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
            
            selectedItems.push({
                name: name,
                quantity: quantity,
                price: price
            });
        }
    });
    
    // Применяем выбранные позиции к форме счета
    if (selectedItems.length > 0) {
        applyItemsToForm(selectedItems);
    }
    
    // Закрываем модальное окно
    closeScanModal();
}

/**
 * Добавляет отсканированные позиции в форму счета
 */
function applyItemsToForm(items) {
    const invoiceItemsContainer = document.getElementById('invoice-items');
    if (!invoiceItemsContainer) return;
    
    // Удаляем существующие позиции, если они есть и пустые
    const existingItems = invoiceItemsContainer.querySelectorAll('.invoice-item');
    if (existingItems.length === 1) {
        const nameInput = existingItems[0].querySelector('input[name="item_name[]"]');
        if (nameInput && !nameInput.value.trim()) {
            existingItems[0].remove();
        }
    }
    
    // Добавляем новые позиции
    items.forEach(item => {
        // Если доступна глобальная функция addNewItemRow, используем ее
        if (typeof window.addNewItemRow === 'function') {
            window.addNewItemRow();
            
            // Получаем последнюю добавленную строку
            const newRow = invoiceItemsContainer.querySelector('.invoice-item:last-child');
            
            // Заполняем данные
            const nameInput = newRow.querySelector('input[name="item_name[]"]');
            const quantityInput = newRow.querySelector('input[name="item_quantity[]"]');
            const priceInput = newRow.querySelector('input[name="item_price[]"]');
            
            if (nameInput) nameInput.value = item.name;
            if (quantityInput) quantityInput.value = item.quantity.toString().replace('.', ',');
            if (priceInput) priceInput.value = item.price.toFixed(2).replace('.', ',');
        } else {
            // Создаем новую строку вручную
            const newRow = document.createElement('tr');
            newRow.className = 'invoice-item';
            
            newRow.innerHTML = `
                <td>
                    <input type="text" name="item_name[]" title="Наименование товара/услуги" value="${item.name}" required>
                </td>
                <td>
                    <input type="text" name="item_quantity[]" title="Количество" value="${item.quantity.toString().replace('.', ',')}" required>
                </td>
                <td>
                    <input type="text" name="item_price[]" title="Цена за единицу" value="${item.price.toFixed(2).replace('.', ',')}" required>
                </td>
                <td class="item-total">${(item.quantity * item.price).toFixed(2).replace('.', ',')}</td>
                <td>
                    <button type="button" class="btn-icon remove-item" title="Удалить позицию">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            // Добавляем обработчик для кнопки удаления
            const removeButton = newRow.querySelector('.remove-item');
            if (removeButton) {
                removeButton.addEventListener('click', function() {
                    newRow.remove();
                    updateTotals();
                });
            }
            
            // Добавляем строку в таблицу
            invoiceItemsContainer.appendChild(newRow);
        }
    });
    
    // Обновляем итоги
    if (typeof window.updateTotals === 'function') {
        window.updateTotals();
    }
}

/**
 * Получает CSRF-токен из cookie
 */
function getCsrfToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    
    return cookieValue || '';
} 