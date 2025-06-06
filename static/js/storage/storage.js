/**
 * Скрипт для работы с хранилищем файлов
 */
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация обработчиков событий
    initCreateFolder();
    initUploadFile();
    initFolderClick();
    initRenameItem();
    initDeleteItem();
    initToggleFavorite();
    initDragAndDrop();
    initModals();
    
    // Обработчик для кнопок из пустого состояния
    const emptyUploadBtn = document.getElementById('emptyUploadFileBtn');
    if (emptyUploadBtn) {
        emptyUploadBtn.addEventListener('click', function() {
            document.getElementById('uploadFileBtn').click();
        });
    }
    
    const emptyCreateFolderBtn = document.getElementById('emptyCreateFolderBtn');
    if (emptyCreateFolderBtn) {
        emptyCreateFolderBtn.addEventListener('click', function() {
            document.getElementById('createFolderBtn').click();
        });
    }
});

/**
 * Получает корректный URL для API с учетом языкового префикса
 * @param {string} path Путь API без языкового префикса (должен начинаться с '/')
 * @returns {string} Полный URL с учетом языкового префикса
 */
function getApiUrl(path) {
    // Проверяем, что путь начинается с '/'
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    
    // Определяем текущий URL и язык
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(part => part);
    
    // Проверяем наличие языкового префикса (обычно двухсимвольный код)
    if (pathParts.length > 0 && /^[a-z]{2}$/.test(pathParts[0])) {
        // Добавляем языковой префикс к пути
        return '/' + pathParts[0] + path;
    }
    
    // Если языковой префикс не найден, возвращаем исходный путь
    return path;
}

/**
 * Инициализация модальных окон без jQuery
 */
function initModals() {
    // Получаем все модальные окна
    const modals = document.querySelectorAll('.modal');
    
    // Для каждого модального окна добавляем обработчики
    modals.forEach(modal => {
        // Получаем все кнопки закрытия внутри модального окна
        const closeButtons = modal.querySelectorAll('.close, .btn-secondary');
        
        // Добавляем обработчики для закрытия окна
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                closeModal(modal);
            });
        });
        
        // Закрытие при клике вне контента модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
}

/**
 * Открывает модальное окно
 * @param {HTMLElement} modal Элемент модального окна
 */
function openModal(modal) {
    if (!modal) return;
    
    // Показываем модальное окно
    modal.style.display = 'block';
    modal.classList.add('show');
    
    // Добавляем класс к body для предотвращения прокрутки
    document.body.classList.add('modal-open');
    
    // Создаем и добавляем бэкдроп, если его нет
    if (!document.querySelector('.modal-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
    
    // Запоминаем фокус, чтобы вернуться к нему после закрытия
    modal.setAttribute('data-prev-focus', document.activeElement?.id || '');
    
    // Перемещаем фокус в модальное окно
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
        setTimeout(() => {
            firstFocusable.focus();
        }, 100);
    }
}

/**
 * Закрывает модальное окно
 * @param {HTMLElement} modal Элемент модального окна
 */
function closeModal(modal) {
    if (!modal) return;
    
    // Скрываем модальное окно
    modal.style.display = 'none';
    modal.classList.remove('show');
    
    // Удаляем класс у body
    document.body.classList.remove('modal-open');
    
    // Удаляем бэкдроп
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.parentNode.removeChild(backdrop);
    }
    
    // Возвращаем фокус
    const prevFocusId = modal.getAttribute('data-prev-focus');
    if (prevFocusId) {
        const prevFocus = document.getElementById(prevFocusId);
        if (prevFocus) prevFocus.focus();
    }
}

/**
 * Инициализация функции создания папки
 */
function initCreateFolder() {
    const createFolderBtn = document.getElementById('createFolderBtn');
    const createFolderSubmit = document.getElementById('createFolderSubmit');
    const createFolderModal = document.getElementById('createFolderModal');
    const folderNameInput = document.getElementById('folderName');
    
    // Открытие модального окна
    if (createFolderBtn) {
        createFolderBtn.addEventListener('click', function() {
            // Сбрасываем значение поля
            if (folderNameInput) folderNameInput.value = '';
            
            // Открываем модальное окно
            openModal(createFolderModal);
            
            // Устанавливаем фокус на поле ввода
            setTimeout(function() {
                folderNameInput.focus();
            }, 500);
        });
    }
    
    // Обработка отправки формы
    if (createFolderSubmit) {
        createFolderSubmit.addEventListener('click', function() {
            const folderName = folderNameInput.value.trim();
            const parentId = document.getElementById('parentFolderId')?.value || '';
            
            if (!folderName) {
                showNotification('Ошибка', 'Необходимо указать название папки', 'error');
                return;
            }
            
            // Отправка запроса на создание папки
            fetch(getApiUrl('/storage/api/create-folder/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCSRFToken()
                },
                body: `folder_name=${encodeURIComponent(folderName)}&parent_id=${encodeURIComponent(parentId)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Успех', 'Папка успешно создана', 'success');
                    
                    // Перезагрузка страницы для отображения новой папки
                    location.reload();
                } else {
                    showNotification('Ошибка', data.message || 'Не удалось создать папку', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Ошибка', 'Произошла ошибка при создании папки', 'error');
            })
            .finally(() => {
                // Закрываем модальное окно
                closeModal(createFolderModal);
            });
        });
    }
}

/**
 * Инициализация функции загрузки файла
 */
function initUploadFile() {
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const uploadFileSubmit = document.getElementById('uploadFileSubmit');
    const uploadFileModal = document.getElementById('uploadFileModal');
    const fileInput = document.getElementById('fileInput');
    
    // Открытие модального окна
    if (uploadFileBtn) {
        uploadFileBtn.addEventListener('click', function() {
            // Сбрасываем значение поля
            if (fileInput) fileInput.value = '';
            
            // Скрываем прогресс
            const progressContainer = document.querySelector('.upload-progress-container');
            if (progressContainer) progressContainer.style.display = 'none';
            
            // Открываем модальное окно
            openModal(uploadFileModal);
        });
    }
    
    // Обработка отправки формы
    if (uploadFileSubmit) {
        uploadFileSubmit.addEventListener('click', function() {
            const file = fileInput.files[0];
            const folderId = document.getElementById('uploadFolderId')?.value || '';
            
            if (!file) {
                showNotification('Ошибка', 'Необходимо выбрать файл', 'error');
                return;
            }
            
            // Формируем данные для отправки
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder_id', folderId);
            
            // Показываем прогресс загрузки
            const progressContainer = document.querySelector('.upload-progress-container');
            const progressBar = progressContainer.querySelector('.upload-progress-bar');
            const progressText = progressContainer.querySelector('.upload-progress-text');
            
            if (progressContainer) progressContainer.style.display = 'flex';
            
            // Создаем запрос для загрузки файла с отслеживанием прогресса
            const xhr = new XMLHttpRequest();
            xhr.open('POST', getApiUrl('/storage/api/upload-file/'));
            xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
            
            // Обработка прогресса загрузки
            xhr.upload.addEventListener('progress', function(event) {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    progressBar.style.setProperty('--progress', percentComplete + '%');
                    progressText.textContent = Math.round(percentComplete) + '%';
                    
                    // Анимация прогресс-бара
                    progressBar.style.width = percentComplete + '%';
                }
            });
            
            // Обработка завершения загрузки
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.status === 'success') {
                            showNotification('Успех', 'Файл успешно загружен', 'success');
                            // Перезагрузка страницы для отображения нового файла
                            location.reload();
                        } else {
                            showNotification('Ошибка', response.message || 'Не удалось загрузить файл', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка при разборе ответа:', error);
                        showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
                    }
                } else {
                    showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
                }
                
                // Закрываем модальное окно
                closeModal(uploadFileModal);
            };
            
            // Обработка ошибок
            xhr.onerror = function() {
                showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
                closeModal(uploadFileModal);
            };
            
            // Отправляем запрос
            xhr.send(formData);
        });
    }
}

/**
 * Инициализация клика по папке
 */
function initFolderClick() {
    const folderItems = document.querySelectorAll('.folder-item');
    
    folderItems.forEach(folder => {
        folder.addEventListener('click', function(event) {
            // Игнорируем клик на кнопках действий
            if (event.target.closest('.btn-action') || 
                event.target.closest('.folder-actions')) {
                return;
            }
            
            const folderId = this.getAttribute('data-folder-id');
            if (folderId) {
                window.location.href = `/storage/folder/${folderId}/`;
            }
        });
    });
}

/**
 * Инициализация функции переименования
 */
function initRenameItem() {
    const renameItemModal = document.getElementById('renameItemModal');
    const newItemNameInput = document.getElementById('newItemName');
    const renameItemIdInput = document.getElementById('renameItemId');
    const renameItemTypeInput = document.getElementById('renameItemType');
    const renameItemSubmit = document.getElementById('renameItemSubmit');
    
    // Обработчики для кнопок переименования папок
    const renameFolderButtons = document.querySelectorAll('.rename-folder');
    renameFolderButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const folderId = this.getAttribute('data-folder-id');
            const folderName = this.closest('.folder-item').querySelector('.folder-name').textContent;
            
            // Заполняем модальное окно
            newItemNameInput.value = folderName;
            renameItemIdInput.value = folderId;
            renameItemTypeInput.value = 'folder';
            
            // Открываем модальное окно
            openModal(renameItemModal);
            
            // Устанавливаем фокус на поле ввода
            setTimeout(() => {
                newItemNameInput.focus();
                newItemNameInput.select();
            }, 500);
        });
    });
    
    // Обработчики для кнопок переименования файлов
    const renameFileButtons = document.querySelectorAll('.rename-file');
    renameFileButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const fileId = this.getAttribute('data-file-id');
            const fileName = this.closest('tr').querySelector('.file-name').textContent;
            
            // Заполняем модальное окно
            newItemNameInput.value = fileName;
            renameItemIdInput.value = fileId;
            renameItemTypeInput.value = 'file';
            
            // Открываем модальное окно
            openModal(renameItemModal);
            
            // Устанавливаем фокус на поле ввода
            setTimeout(() => {
                newItemNameInput.focus();
                newItemNameInput.select();
            }, 500);
        });
    });
    
    // Обработка отправки формы переименования
    if (renameItemSubmit) {
        renameItemSubmit.addEventListener('click', function() {
            const newName = newItemNameInput.value.trim();
            const itemId = renameItemIdInput.value;
            const itemType = renameItemTypeInput.value;
            
            if (!newName) {
                showNotification('Ошибка', 'Необходимо указать новое название', 'error');
                return;
            }
            
            // Определяем URL в зависимости от типа элемента
            const url = itemType === 'folder'
                ? getApiUrl(`/storage/api/rename-folder/${itemId}/`)
                : getApiUrl(`/storage/api/rename-file/${itemId}/`);
            
            // Отправка запроса на переименование
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': getCSRFToken()
                },
                body: `name=${encodeURIComponent(newName)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Успех', 'Успешно переименовано', 'success');
                    
                    // Обновляем имя элемента на странице
                    if (itemType === 'folder') {
                        const folderItem = document.querySelector(`.folder-item[data-folder-id="${itemId}"]`);
                        if (folderItem) {
                            folderItem.querySelector('.folder-name').textContent = newName;
                        }
                    } else {
                        const fileRow = document.querySelector(`tr[data-file-id="${itemId}"]`);
                        if (fileRow) {
                            fileRow.querySelector('.file-name').textContent = newName;
                        }
                    }
                } else {
                    showNotification('Ошибка', data.message || 'Не удалось переименовать', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Ошибка', 'Произошла ошибка при переименовании', 'error');
            })
            .finally(() => {
                // Закрываем модальное окно
                closeModal(renameItemModal);
            });
        });
    }
}

/**
 * Инициализация функции удаления
 */
function initDeleteItem() {
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmText = document.getElementById('deleteConfirmText');
    const deleteItemIdInput = document.getElementById('deleteItemId');
    const deleteItemTypeInput = document.getElementById('deleteItemType');
    const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    
    // Обработчики для кнопок удаления папок
    const deleteFolderButtons = document.querySelectorAll('.delete-folder');
    deleteFolderButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const folderId = this.getAttribute('data-folder-id');
            const folderName = this.closest('.folder-item').querySelector('.folder-name').textContent;
            
            // Заполняем модальное окно
            deleteConfirmText.textContent = `Вы действительно хотите удалить папку "${folderName}" и все её содержимое?`;
            deleteItemIdInput.value = folderId;
            deleteItemTypeInput.value = 'folder';
            
            // Открываем модальное окно
            openModal(deleteConfirmModal);
        });
    });
    
    // Обработчики для кнопок удаления файлов
    const deleteFileButtons = document.querySelectorAll('.delete-file');
    deleteFileButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const fileId = this.getAttribute('data-file-id');
            const fileName = this.closest('tr').querySelector('.file-name').textContent;
            
            // Заполняем модальное окно
            deleteConfirmText.textContent = `Вы действительно хотите удалить файл "${fileName}"?`;
            deleteItemIdInput.value = fileId;
            deleteItemTypeInput.value = 'file';
            
            // Открываем модальное окно
            openModal(deleteConfirmModal);
        });
    });
    
    // Обработка подтверждения удаления
    if (deleteConfirmBtn) {
        deleteConfirmBtn.addEventListener('click', function() {
            const itemId = deleteItemIdInput.value;
            const itemType = deleteItemTypeInput.value;
            
            // Определяем URL в зависимости от типа элемента
            const url = itemType === 'folder'
                ? getApiUrl(`/storage/api/delete-folder/${itemId}/`)
                : getApiUrl(`/storage/api/delete-file/${itemId}/`);
            
            // Отправка запроса на удаление
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showNotification('Успех', 'Успешно удалено', 'success');
                    
                    // Удаляем элемент из DOM
                    if (itemType === 'folder') {
                        const folderItem = document.querySelector(`.folder-item[data-folder-id="${itemId}"]`);
                        if (folderItem) folderItem.remove();
                    } else {
                        const fileRow = document.querySelector(`tr[data-file-id="${itemId}"]`);
                        if (fileRow) fileRow.remove();
                    }
                    
                    // Если после удаления не осталось элементов, перезагружаем страницу
                    const folders = document.querySelectorAll('.folder-item');
                    const files = document.querySelectorAll('tr[data-file-id]');
                    
                    if (folders.length === 0 && files.length === 0) {
                        location.reload();
                    }
                } else {
                    showNotification('Ошибка', data.message || 'Не удалось удалить', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Ошибка', 'Произошла ошибка при удалении', 'error');
            })
            .finally(() => {
                // Закрываем модальное окно
                closeModal(deleteConfirmModal);
            });
        });
    }
}

/**
 * Инициализация функции добавления/удаления из избранного
 */
function initToggleFavorite() {
    const favoriteButtons = document.querySelectorAll('.toggle-favorite');
    
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            const fileId = this.getAttribute('data-file-id');
            const favoriteIcon = this.querySelector('.favorite-icon');
            const isFavorite = favoriteIcon.classList.contains('active');
            
            // Отправка запроса на изменение статуса избранного
            fetch(getApiUrl(`/storage/api/favorite/${fileId}/`), {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Обновляем внешний вид иконки
                    if (data.file.is_favorite) {
                        favoriteIcon.classList.add('active');
                        favoriteIcon.innerHTML = '<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>';
                        this.setAttribute('title', 'Удалить из избранного');
                    } else {
                        favoriteIcon.classList.remove('active');
                        favoriteIcon.innerHTML = '<path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"></path>';
                        this.setAttribute('title', 'Добавить в избранное');
                    }
                    
                    // Если мы на странице избранного и удалили из избранного, удаляем элемент из DOM
                    if (isFavorite && window.location.pathname.includes('/storage/favorites/')) {
                        const fileRow = document.querySelector(`tr[data-file-id="${fileId}"]`);
                        if (fileRow) {
                            fileRow.remove();
                            
                            // Если после удаления не осталось файлов, перезагружаем страницу
                            const files = document.querySelectorAll('tr[data-file-id]');
                            if (files.length === 0) {
                                location.reload();
                            }
                        }
                    }
                } else {
                    showNotification('Ошибка', data.message || 'Не удалось изменить статус избранного', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                showNotification('Ошибка', 'Произошла ошибка при изменении статуса избранного', 'error');
            });
        });
    });
}

/**
 * Получение CSRF токена из cookies
 * @returns {string} CSRF токен
 */
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

/**
 * Отображение уведомления
 * @param {string} title Заголовок уведомления
 * @param {string} message Текст уведомления
 * @param {string} type Тип уведомления (success, error, warning, info)
 */
function showNotification(title, message, type = 'info') {
    // Проверяем, существует ли функция для отображения уведомлений в глобальном скрипте
    if (typeof window.showToast === 'function') {
        window.showToast({
            title: title,
            message: message,
            type: type
        });
    } else {
        // Если функции нет, используем стандартное уведомление браузера
        alert(`${title}: ${message}`);
    }
}

/**
 * Инициализация функции перетаскивания файлов
 */
function initDragAndDrop() {
    const storageContent = document.querySelector('.storage-content');
    const emptyState = document.querySelector('.empty-state');
    const dropTarget = storageContent || emptyState || document.body;
    const folderId = document.getElementById('uploadFolderId')?.value || '';
    
    if (!dropTarget) return;
    
    // Предотвращаем стандартное поведение для drag&drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropTarget.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Подсветка при перетаскивании
    ['dragenter', 'dragover'].forEach(eventName => {
        dropTarget.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropTarget.addEventListener(eventName, unhighlight, false);
    });
    
    // Обработка сброшенных файлов
    dropTarget.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropTarget.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropTarget.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        // Проверяем, есть ли файлы
        if (files.length === 0) return;
        
        // Если файлов больше одного - показываем уведомление
        if (files.length > 1) {
            showNotification('Внимание', 'Загружается только первый файл. Остальные можно загрузить отдельно.', 'warning');
        }
        
        // Берем только первый файл для загрузки
        const file = files[0];
        
        // Проверяем размер файла
        const maxSize = 50 * 1024 * 1024; // 50 MB
        if (file.size > maxSize) {
            showNotification('Ошибка', 'Размер файла превышает максимально допустимый (50 МБ)', 'error');
            return;
        }
        
        // Формируем данные для отправки
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder_id', folderId);
        
        // Создаем и показываем уведомление с прогрессом
        const toastId = 'upload-toast-' + Date.now();
        showProgressToast(toastId, file.name);
        
        // Отправляем файл на сервер
        const xhr = new XMLHttpRequest();
        xhr.open('POST', getApiUrl('/storage/api/upload-file/'));
        xhr.setRequestHeader('X-CSRFToken', getCSRFToken());
        
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                updateProgressToast(toastId, percentComplete);
            }
        });
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.status === 'success') {
                        closeProgressToast(toastId);
                        showNotification('Успех', 'Файл успешно загружен', 'success');
                        // Перезагрузка страницы для отображения нового файла
                        location.reload();
                    } else {
                        closeProgressToast(toastId);
                        showNotification('Ошибка', response.message || 'Не удалось загрузить файл', 'error');
                    }
                } catch (error) {
                    console.error('Ошибка при разборе ответа:', error);
                    closeProgressToast(toastId);
                    showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
                }
            } else {
                closeProgressToast(toastId);
                showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
            }
        };
        
        xhr.onerror = function() {
            closeProgressToast(toastId);
            showNotification('Ошибка', 'Произошла ошибка при загрузке файла', 'error');
        };
        
        xhr.send(formData);
    }
}

/**
 * Показывает уведомление с прогрессом загрузки
 */
function showProgressToast(id, fileName) {
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast toast-info';
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">Загрузка файла</div>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">
            <div style="margin-bottom: 8px;">${fileName}</div>
            <div class="upload-progress-container">
                <div class="upload-progress-bar"></div>
                <div class="upload-progress-text">0%</div>
            </div>
        </div>
    `;
    
    document.querySelector('.toast-container').appendChild(toast);
    
    // Обработчик закрытия
    toast.querySelector('.toast-close').addEventListener('click', function() {
        closeProgressToast(id);
    });
}

/**
 * Обновляет прогресс загрузки в уведомлении
 */
function updateProgressToast(id, percent) {
    const toast = document.getElementById(id);
    if (!toast) return;
    
    const progressBar = toast.querySelector('.upload-progress-bar');
    const progressText = toast.querySelector('.upload-progress-text');
    
    if (progressBar) progressBar.style.setProperty('--progress', percent + '%');
    if (progressText) progressText.textContent = Math.round(percent) + '%';
}

/**
 * Закрывает уведомление с прогрессом
 */
function closeProgressToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    
    toast.classList.add('hiding');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        
        // Если больше нет уведомлений, удаляем контейнер
        const toastContainer = document.querySelector('.toast-container');
        if (toastContainer && toastContainer.children.length === 0) {
            toastContainer.parentNode.removeChild(toastContainer);
        }
    }, 300);
} 