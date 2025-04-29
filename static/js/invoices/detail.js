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
            const printContent = document.getElementById('invoice-printable');
            const originalContent = document.body.innerHTML;
            
            // Создаем стили для печати
            const printStyles = `
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #000;
                        background: #fff;
                    }
                    .invoice-wrapper {
                        max-width: 100%;
                        padding: 20px;
                        margin: 0 auto;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                    }
                    .company-logo img {
                        max-height: 100px;
                    }
                    .invoice-title h2 {
                        font-size: 24px;
                        margin: 0 0 10px;
                    }
                    .invoice-dates {
                        font-size: 14px;
                    }
                    .invoice-parties {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                    }
                    .invoice-party {
                        width: 48%;
                    }
                    h3 {
                        font-size: 18px;
                        margin-top: 0;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 5px;
                    }
                    .party-name {
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .info-row {
                        margin-bottom: 5px;
                    }
                    .info-label {
                        font-weight: bold;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .items-table th,
                    .items-table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    .items-table th {
                        background-color: #f2f2f2;
                    }
                    .invoice-totals {
                        margin-bottom: 30px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .total-label {
                        font-weight: normal;
                    }
                    .grand-total {
                        font-weight: bold;
                        font-size: 18px;
                        border-top: 1px solid #ddd;
                        padding-top: 5px;
                        margin-top: 5px;
                    }
                    .invoice-notes,
                    .invoice-payment-info {
                        margin-bottom: 30px;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                    }
                    .signature-box {
                        width: 30%;
                    }
                    .signature-label {
                        font-weight: bold;
                        margin-bottom: 30px;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        margin-bottom: 5px;
                        height: 40px;
                    }
                    .signature-image,
                    .stamp-image {
                        max-height: 80px;
                        max-width: 100%;
                    }
                    .invoice-meta {
                        display: none;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            `;
            
            // Заменяем содержимое страницы на содержимое для печати
            document.body.innerHTML = printStyles + printContent.outerHTML;
            
            // Вызываем функцию печати
            window.print();
            
            // Восстанавливаем оригинальное содержимое
            document.body.innerHTML = originalContent;
            
            // Инициализируем обработчики событий заново
            attachEventListeners();
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
            // Показываем модальное окно для отправки email
            // В реальном приложении здесь должна быть реализация модального окна
            alert('Функционал отправки по email будет реализован позже.');
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
                        // Обновляем страницу, чтобы отобразить изменения
                        window.location.reload();
                    } else {
                        alert(data.error || 'Произошла ошибка при обновлении статуса.');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Произошла ошибка при выполнении операции.');
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
                        // Перенаправляем на список счетов
                        window.location.href = '/invoices/';
                    } else {
                        alert(data.error || 'Произошла ошибка при удалении счета.');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Произошла ошибка при выполнении операции.');
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