#!/opt/python/python-3.8.8/bin/python

import os
import sys
import site
import traceback

# Подробное логирование ошибок в файл для отладки
log_file = '/var/www/u3121058/data/www/flowfy.ru/passenger_error.log'

# Записываем время старта в лог
with open(log_file, 'a') as f:
    f.write(f"\n\nStarting passenger_wsgi.py at {__import__('datetime').datetime.now()}\n")

try:
    # Пути к виртуальному окружению и проекту
    VENV_PATH = '/var/www/u3121058/data/www/flowfy.ru/venv'
    PYTHON_VERSION = 'python3.8' # Python 3.8.8
    PROJECT_PATH = '/var/www/u3121058/data/www/flowfy.ru'
    
    # Добавляем библиотеки из виртуального окружения
    site_packages_path = f'{VENV_PATH}/lib/{PYTHON_VERSION}/site-packages'
    if os.path.exists(site_packages_path):
        site.addsitedir(site_packages_path)
    else:
        # Пробуем найти правильный путь к site-packages
        for root, dirs, files in os.walk(f'{VENV_PATH}/lib'):
            if 'site-packages' in dirs:
                full_path = os.path.join(root, 'site-packages')
                site.addsitedir(full_path)
    
    # Активируем виртуальное окружение
    activate_this = f"{VENV_PATH}/bin/activate_this.py"
    if os.path.exists(activate_this):
        with open(activate_this) as file_:
            exec(file_.read(), dict(__file__=activate_this))
    
    # Добавляем путь к проекту
    if PROJECT_PATH not in sys.path:
        sys.path.insert(0, PROJECT_PATH)
    
    # Настраиваем Django без использования .env файла
    os.environ['DJANGO_SETTINGS_MODULE'] = 'billify.settings'
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['LANG'] = 'ru_RU.UTF-8'
    
    # Настройки для отладки Django
    os.environ['DEBUG'] = 'True'
    
    # Функция для тестирования - доступна по /test-passenger
    def simple_app(environ, start_response):
        status = '200 OK'
        output = b'Passenger is working!'
        response_headers = [('Content-type', 'text/plain'),
                            ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output]
    
    # Загружаем Django WSGI приложение
    try:
        from django.core.wsgi import get_wsgi_application
        django_app = get_wsgi_application()
    except Exception as wsgi_error:
        with open(log_file, 'a') as f:
            f.write(f"Error loading Django WSGI application: {str(wsgi_error)}\n")
            f.write(traceback.format_exc())
        raise
    
    # Объединяем тестовое приложение и Django
    def application(environ, start_response):
        path = environ.get('PATH_INFO', '')
        
        try:
            if path == '/test-passenger':
                return simple_app(environ, start_response)
            
            # Обрабатываем запрос через Django
            return django_app(environ, start_response)
            
        except Exception as app_exception:
            # Логируем ошибки приложения
            with open(log_file, 'a') as f:
                f.write(f"Application error: {str(app_exception)}\n")
                f.write(traceback.format_exc())
            
            # Передаем ошибку дальше для стандартной обработки Django
            raise

except Exception as e:
    # При возникновении ошибки записываем её в лог-файл
    with open(log_file, 'a') as f:
        f.write(f"Error in passenger_wsgi.py initialization: {str(e)}\n")
        f.write(traceback.format_exc())
        f.write("Python path: " + str(sys.path) + "\n")
        f.write("Environment: " + str(os.environ) + "\n")
    
    # И возвращаем функцию для вывода подробной информации об ошибке
    def application(environ, start_response):
        status = '500 Internal Server Error'
        error_message = f"An error occurred while loading the application.\nPlease check the log file: {log_file}\nError: {str(e)}"
        output = error_message.encode('utf-8')
        response_headers = [('Content-type', 'text/plain; charset=utf-8'),
                            ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output]