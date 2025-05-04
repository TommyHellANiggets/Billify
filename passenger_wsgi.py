#!/var/www/u1505555/data/www/flowfy.ru/venv/bin/python3

import os
import sys
import site

# Подробное логирование ошибок в файл для отладки
log_file = '/var/www/u1505555/data/www/flowfy.ru/passenger_error.log'

try:
    # Пути к виртуальному окружению и проекту
    VENV_PATH = '/var/www/u1505555/data/www/flowfy.ru/venv'
    PYTHON_VERSION = 'python3.8' # Возможно нужно изменить на актуальную версию
    PROJECT_PATH = '/var/www/u1505555/data/www/flowfy.ru'
    
    # Добавляем библиотеки из виртуального окружения
    site.addsitedir(f'{VENV_PATH}/lib/{PYTHON_VERSION}/site-packages')
    
    # Добавляем путь к проекту
    sys.path.insert(0, PROJECT_PATH)
    
    # Настраиваем Django
    os.environ['DJANGO_SETTINGS_MODULE'] = 'billify.settings'
    
    # Функция для тестирования - доступна по /test-passenger
    def simple_app(environ, start_response):
        status = '200 OK'
        output = b'Passenger is working!'
        response_headers = [('Content-type', 'text/plain'),
                            ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output]
    
    # Загружаем Django WSGI приложение
    from django.core.wsgi import get_wsgi_application
    django_app = get_wsgi_application()
    
    # Объединяем тестовое приложение и Django
    def application(environ, start_response):
        path = environ.get('PATH_INFO', '')
        if path == '/test-passenger':
            return simple_app(environ, start_response)
        return django_app(environ, start_response)

except Exception as e:
    # При возникновении ошибки записываем её в лог-файл
    with open(log_file, 'a') as f:
        import traceback
        f.write(f"Error in passenger_wsgi.py: {str(e)}\n")
        f.write(traceback.format_exc())
        f.write("Python path: " + str(sys.path) + "\n")
        f.write("Environment: " + str(os.environ) + "\n")
    
    # И возвращаем функцию для вывода подробной информации об ошибке
    def application(environ, start_response):
        status = '500 Internal Server Error'
        error_message = f"An error occurred while loading the application.\nPlease check the log file: {log_file}"
        output = error_message.encode('utf-8')
        response_headers = [('Content-type', 'text/plain; charset=utf-8'),
                            ('Content-Length', str(len(output)))]
        start_response(status, response_headers)
        return [output] 