document.addEventListener('DOMContentLoaded', function() {
    // Получение элементов интерфейса
    const printButton = document.getElementById('print-invoice');
    const pdfButton = document.getElementById('pdf-invoice');
    const sendEmailButton = document.getElementById('send-email');
    const duplicateButton = document.getElementById('duplicate-invoice');
    const markPaidButton = document.getElementById('mark-paid');
    const editButton = document.getElementById('edit-invoice');
    const deleteButton = document.getElementById('delete-invoice');
    
    // Получаем ID счета из URL
    const invoiceId = window.location.pathname.split('/').filter(Boolean).pop();
    
    // Обработчик для печати счета
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Обработчик для создания PDF
    if (pdfButton) {
        pdfButton.addEventListener('click', function() {
            // Для генерации PDF нужен серверный endpoint
            // Перенаправляем на URL для генерации PDF
            window.location.href = `/invoices/${invoiceId}/pdf/`;
        });
    }
    
    // Обработчик для отправки по email
    if (sendEmailButton) {
        sendEmailButton.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Функционал отправки по email будет реализован позже.', 'info');
        });
    }
    
    // Обработчик для дублирования счета
    if (duplicateButton) {
        duplicateButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите создать копию этого счета?')) {
                window.location.href = `/invoices/${invoiceId}/duplicate/`;
            }
        });
    }
    
    // Обработчик для установки статуса "Оплачен"
    if (markPaidButton) {
        markPaidButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Отметить счет как оплаченный?')) {
                // В реальном приложении здесь должен быть AJAX-запрос
                fetch(`/invoices/${invoiceId}/mark-paid/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        showNotification(data.error || 'Произошла ошибка при обновлении статуса.', 'error');
                    }
                })
                .catch(error => {
                    showNotification('Произошла ошибка при выполнении операции.', 'error');
                });
            }
        });
    }
    
    // Обработчик для редактирования счета
    if (editButton) {
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `/invoices/${invoiceId}/edit/`;
        });
    }
    
    // Обработчик для удаления счета
    if (deleteButton) {
        deleteButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Вы уверены, что хотите удалить этот счет? Это действие нельзя отменить.')) {
                // В реальном приложении здесь должен быть AJAX-запрос
                fetch(`/invoices/${invoiceId}/delete/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/invoices/';
                    } else {
                        showNotification(data.error || 'Произошла ошибка при удалении счета.', 'error');
                    }
                })
                .catch(error => {
                    showNotification('Произошла ошибка при выполнении операции.', 'error');
                });
            }
        });
    }
    
    // Функция для получения значения cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Ищем cookie с указанным именем
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Функция для повторного добавления обработчиков событий
    function attachEventListeners() {
        const printBtn = document.getElementById('print-invoice');
        if (printBtn) {
            printBtn.addEventListener('click', function() {
                window.print();
            });
        }
    }
    
    // Инициализация выпадающего меню действий
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function() {
            dropdownMenu.classList.toggle('show');
        });
        
        // Закрыть меню при клике вне его области
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}); 