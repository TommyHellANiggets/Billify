document.addEventListener('DOMContentLoaded', function() {
    // Обработчик клика по опции языка в десктопном виде
    document.querySelectorAll('.locale-option[data-lang]').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const lang = this.getAttribute('data-lang');
            
            // Используем AJAX для смены языка
            switchLanguageAjax(lang);
        });
    });
    
    // Функция для смены языка через AJAX
    function switchLanguageAjax(langCode) {
        console.log("Switching language to:", langCode);
        
        // Получаем CSRF токен
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                         document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '';
        
        // Вычисляем next параметр (текущая страница без языкового префикса)
        const pathParts = window.location.pathname.split('/');
        let nextPath = '';
        
        // Если путь имеет языковой префикс (первый сегмент - 'ru', 'en', 'de' и т.д.)
        if (pathParts.length > 1 && ['ru', 'en', 'de'].includes(pathParts[1])) {
            // Сохраняем путь без языкового префикса
            nextPath = '/' + pathParts.slice(2).join('/');
            if (nextPath === '/') {
                nextPath = '/';
            }
        } else {
            // Если нет языкового префикса, используем текущий путь
            nextPath = window.location.pathname;
        }
        
        console.log("Next path:", nextPath);
        
        // Создаём данные для отправки
        const formData = new FormData();
        formData.append('language', langCode);
        formData.append('next', nextPath);
        if (csrfToken) {
            formData.append('csrfmiddlewaretoken', csrfToken);
        }
        
        // Используем GET-запрос на API точку для смены языка
        // Django имеет специальную API для этого в /api/change-language/
        fetch(window.location.origin + '/api/change-language/', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            if (response.ok) {
                console.log("Language change successful, redirecting to new URL");
                // Вместо перезагрузки текущей страницы, явно перенаправляем на новый URL с языковым префиксом
                const newUrl = window.location.origin + '/' + langCode + nextPath;
                console.log("Redirecting to:", newUrl);
                window.location.href = newUrl;
            } else {
                // Если ошибка, показываем сообщение
                console.error("Language change failed:", response.status);
                
                // Пробуем альтернативный метод со стандартной формой
                console.log("Trying standard form method...");
                switchLanguageForm(langCode);
            }
        })
        .catch(error => {
            console.error("Error changing language:", error);
            // В случае ошибки, используем стандартную форму
            switchLanguageForm(langCode);
        });
    }
    
    // Резервный метод через форму (POST) для смены языка
    function switchLanguageForm(langCode) {
        // Создаем форму для отправки
        const form = document.createElement('form');
        form.method = 'POST'; 
        // Используем абсолютный URL относительно домена
        form.action = window.location.origin + '/i18n/setlang/';
        form.style.display = 'none';
        
        // Добавляем CSRF токен
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                         document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '';
        
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }
        
        // Добавляем выбранный язык
        const langInput = document.createElement('input');
        langInput.type = 'hidden';
        langInput.name = 'language';
        langInput.value = langCode;
        form.appendChild(langInput);
        
        // Добавляем next параметр (текущая страница)
        const nextInput = document.createElement('input');
        nextInput.type = 'hidden';
        nextInput.name = 'next';
        
        // Вычисляем next параметр (текущая страница без языкового префикса)
        const pathParts = window.location.pathname.split('/');
        let nextPath = '';
        
        // Если путь имеет языковой префикс (первый сегмент - 'ru', 'en', 'de' и т.д.)
        if (pathParts.length > 1 && ['ru', 'en', 'de'].includes(pathParts[1])) {
            // Сохраняем путь без языкового префикса
            nextPath = '/' + pathParts.slice(2).join('/');
            if (nextPath === '/') {
                nextPath = '/';
            }
        } else {
            // Если нет языкового префикса, используем текущий путь
            nextPath = window.location.pathname;
        }
        
        nextInput.value = nextPath;
        form.appendChild(nextInput);
        
        // Добавляем форму в DOM и отправляем
        document.body.appendChild(form);
        form.submit();
    }
}); 