document.addEventListener('DOMContentLoaded', function() {
    // Анимация при прокрутке страницы
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Мобильное меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navList.classList.toggle('open');
            document.body.classList.toggle('menu-open');
        });
    }
    
    // Глобальная функция для отображения уведомлений
    window.showNotification = function(message, type = 'info') {
        const notificationsContainer = document.getElementById('notifications-container');
        if (!notificationsContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        
        let iconHtml = '<i class="fas fa-info-circle"></i>';
        if (type === 'success') {
            iconHtml = '<i class="fas fa-check-circle"></i>';
        } else if (type === 'error') {
            iconHtml = '<i class="fas fa-exclamation-circle"></i>';
        } else if (type === 'warning') {
            iconHtml = '<i class="fas fa-exclamation-triangle"></i>';
        }
        
        icon.innerHTML = iconHtml;
        
        const content = document.createElement('div');
        content.className = 'notification-content';
        content.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function() {
            notification.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        notification.appendChild(icon);
        notification.appendChild(content);
        notification.appendChild(closeBtn);
        
        notificationsContainer.appendChild(notification);
        
        // Автоматическое закрытие через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        return notification;
    };
    
    // Обработка закрытия уведомлений
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
        notificationsContainer.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('notification-close')) {
                const notification = e.target.closest('.notification');
                notification.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        });
    }
    
    // Закрытие алертов
    const alertCloseButtons = document.querySelectorAll('.alert-close');
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.parentElement;
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 300);
        });
    });
    
    // Автоматическое скрытие сообщений через 5 секунд
    const messages = document.querySelectorAll('.alert');
    if (messages.length > 0) {
        setTimeout(() => {
            messages.forEach(message => {
                message.style.opacity = '0';
                message.style.transform = 'translateY(-10px)';
                message.style.transition = 'opacity 0.5s, transform 0.5s';
                setTimeout(() => {
                    message.style.display = 'none';
                }, 500);
            });
        }, 5000);
    }
    
    // Анимация для карточек при прокрутке
    const animateElements = document.querySelectorAll('.feature-card, .card');
    
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        animateElements.forEach(element => {
            element.classList.add('animate-on-scroll');
            observer.observe(element);
        });
    }
    
    // Обработка формы с подтверждением
    const confirmForms = document.querySelectorAll('form[data-confirm]');
    confirmForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const confirmMessage = this.getAttribute('data-confirm');
            if (!confirm(confirmMessage)) {
                e.preventDefault();
            }
        });
    });

    // Плавная прокрутка к якорям
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            // Проверяем, что ссылка ведет на эту же страницу и имеет якорь
            const href = this.getAttribute('href');
            if (href.includes('#') && (href.startsWith('#') || href.split('#')[0] === window.location.pathname)) {
                e.preventDefault();
                
                // Получаем ID элемента к которому нужно прокрутить
                const targetId = href.split('#')[1];
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    // Прокручиваем к элементу с учетом фиксированного хедера
                    const headerOffset = 100; // Высота хедера + отступ
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// Обработка мобильного меню
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navList = document.querySelector('.nav-list');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        navList.classList.toggle('open');
    });
}

// Обработчик для закрытия алертов
document.querySelectorAll('.alert-close').forEach(button => {
    button.addEventListener('click', function() {
        this.parentElement.remove();
    });
});

// Анимация при скролле
function checkVisibility() {
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementHeight = element.clientHeight;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - elementHeight / 2) {
            element.classList.add('animate');
        }
    });
}

window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);
window.addEventListener('load', checkVisibility);

// Обработка хедера при скролле
const header = document.querySelector('.header');
let lastScrollPosition = 0;

window.addEventListener('scroll', function() {
    const currentScrollPosition = window.pageYOffset;
    
    if (currentScrollPosition > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    lastScrollPosition = currentScrollPosition;
});

// Управление модальным окном подтверждения выхода
const logoutBtn = document.getElementById('logout-btn');
const logoutModal = document.getElementById('logout-modal');
const modalClose = document.querySelector('.modal-close');
const modalCancel = document.querySelector('.modal-cancel');

if (logoutBtn && logoutModal) {
    // Открытие модального окна
    logoutBtn.addEventListener('click', function() {
        logoutModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    });

    // Закрытие модального окна по клику на крестик
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            logoutModal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    // Закрытие модального окна по клику на кнопку "Отмена"
    if (modalCancel) {
        modalCancel.addEventListener('click', function() {
            logoutModal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    // Закрытие модального окна по клику вне его области
    logoutModal.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            logoutModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Закрытие модального окна по нажатию Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && logoutModal.classList.contains('show')) {
            logoutModal.classList.remove('show');
            document.body.style.overflow = '';
        }
    });
} 