document.addEventListener('DOMContentLoaded', function() {
    // Анимация появления формы
    const loginContainer = document.querySelector('.login-form-container');
    
    if (loginContainer) {
        loginContainer.style.opacity = '0';
        loginContainer.style.transform = 'translateY(20px)';
        loginContainer.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        
        setTimeout(() => {
            loginContainer.style.opacity = '1';
            loginContainer.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // Добавление эффекта при фокусе на полях ввода
    const inputFields = document.querySelectorAll('.login-form input');
    
    inputFields.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transition = 'transform 0.2s ease';
            this.parentElement.style.transform = 'translateX(5px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateX(0)';
        });
    });
}); 