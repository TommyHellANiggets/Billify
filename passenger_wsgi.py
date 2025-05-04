#!/var/www/u3121058/data/www/flowfy.ru/venv/bin/python3

import os
import sys
import site

# Пути к виртуальному окружению и проекту
VENV_PATH = '/var/www/u3121058/data/www/flowfy.ru/venv'
PYTHON_VERSION = 'python3.8' # Версия Python на хостинге
PROJECT_PATH = '/var/www/u3121058/data/www/flowfy.ru'

# Добавляем библиотеки из виртуального окружения
site.addsitedir(f'{VENV_PATH}/lib/{PYTHON_VERSION}/site-packages')

# Добавляем путь к проекту
sys.path.insert(0, PROJECT_PATH)

# Настраиваем Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'billify.settings'

# Загружаем Django WSGI приложение
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application() 