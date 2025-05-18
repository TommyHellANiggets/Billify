/**
 * Функции для работы с SVG-иконками на странице создания счетов
 */
 
document.addEventListener('DOMContentLoaded', function() {
    // Загрузка SVG-спрайта
    loadSvgSprite('/static/images/icons/invoice-icons.svg');
    
    // Заменяем Font Awesome иконки на SVG
    replaceFontAwesomeIcons();
});

/**
 * Функция для загрузки SVG-спрайта
 */
function loadSvgSprite(url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            // Добавляем спрайт в начало body
            const div = document.createElement('div');
            div.style.display = 'none';
            div.innerHTML = data;
            document.body.insertBefore(div, document.body.firstChild);
        })
        .catch(error => {
            console.error('Ошибка загрузки SVG-спрайта:', error);
        });
}

/**
 * Функция для замены Font Awesome иконок на SVG
 */
function replaceFontAwesomeIcons() {
    // Соответствие классов Font Awesome к SVG иконкам
    const iconMap = {
        'fa-arrow-left': 'icon-arrow-left',
        'fa-trash': 'icon-trash',
        'fa-plus': 'icon-plus',
        'fa-info-circle': 'icon-info-circle',
        'fa-search': 'icon-search',
        'fa-check': 'icon-check',
        'fa-file': 'icon-file'
    };
    
    // Заменяем иконки в кнопках
    document.querySelectorAll('.btn i[class*="fa-"], .btn-icon i[class*="fa-"], .remove-item i[class*="fa-"]').forEach(icon => {
        const iconClasses = Array.from(icon.classList);
        let svgIconId = null;
        
        // Определяем какой SVG нужно использовать
        for (const faClass of iconClasses) {
            if (iconMap[faClass]) {
                svgIconId = iconMap[faClass];
                break;
            }
        }
        
        if (svgIconId) {
            const svgIcon = createSvgIcon(svgIconId);
            
            // Копируем дополнительные классы (кроме fa*)
            iconClasses.forEach(cls => {
                if (!cls.startsWith('fa')) {
                    svgIcon.classList.add(cls);
                }
            });
            
            // Замена иконки на SVG
            icon.parentNode.replaceChild(svgIcon, icon);
        }
    });
}

/**
 * Функция создания SVG-иконки
 */
function createSvgIcon(iconId) {
    const span = document.createElement('span');
    span.className = 'svg-icon';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${iconId}`);
    
    svg.appendChild(use);
    span.appendChild(svg);
    
    return span;
}

/**
 * Функция для создания SVG-иконки в динамически добавляемых элементах
 */
function getSvgIconHtml(iconId) {
    return `<span class="svg-icon"><svg><use xlink:href="#${iconId}"></use></svg></span>`;
}

// Экспортируем функции для использования в других скриптах
window.svgIcons = {
    create: createSvgIcon,
    getHtml: getSvgIconHtml,
    replace: replaceFontAwesomeIcons
}; 