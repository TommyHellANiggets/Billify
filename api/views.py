from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from django.conf import settings
from django.utils.translation import activate
from core.models import CompanyProfile
from urllib.parse import urlparse, urlunparse
from django.shortcuts import redirect
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def change_language(request, language=None):
    """API обработчик смены языка"""
    try:
        # Обрабатываем GET и POST запросы
        if language:
            # Языковой параметр передан прямо в URL (для GET-запроса по URL с паттерном change-language/<language>/)
            pass  # Используем значение из аргумента функции
        elif request.method == 'POST':
            # POST-запрос с данными
            if request.content_type and 'application/json' in request.content_type:
                # JSON в теле запроса
                try:
                    data = json.loads(request.body)
                    language = data.get('language', 'ru')
                except json.JSONDecodeError:
                    language = request.POST.get('language', 'ru')
            else:
                # Обычная форма
                language = request.POST.get('language', 'ru')
        else:
            # GET-запрос с параметром в query string
            language = request.GET.get('language', 'ru')
        
        # Проверяем, что язык один из поддерживаемых
        supported_languages = [code for code, name in settings.LANGUAGES]
        default_language = settings.LANGUAGE_CODE.split('-')[0]
        
        if language not in supported_languages:
            language = default_language
        
        # Обновляем профиль компании для аутентифицированных пользователей
        if request.user.is_authenticated:
            if hasattr(request.user, 'company_profile'):
                profile = request.user.company_profile
                profile.preferred_language = language
                profile.save()
            else:
                CompanyProfile.objects.create(
                    user=request.user,
                    preferred_language=language
                )
        
        # Устанавливаем язык в сессии Django
        activate(language)
        request.session['_language'] = language
        
        # Устанавливаем cookie
        response_kwargs = {
            'max_age': settings.LANGUAGE_COOKIE_AGE,
            'path': settings.LANGUAGE_COOKIE_PATH,
            'domain': settings.LANGUAGE_COOKIE_DOMAIN,
            'secure': settings.LANGUAGE_COOKIE_SECURE,
            'httponly': settings.LANGUAGE_COOKIE_HTTPONLY,
            'samesite': settings.LANGUAGE_COOKIE_SAMESITE,
        }
        
        # Если это GET-запрос, перенаправляем обратно
        if request.method == 'GET':
            referer = request.META.get('HTTP_REFERER')
            response = redirect(referer if referer else '/')
            response.set_cookie(settings.LANGUAGE_COOKIE_NAME, language, **response_kwargs)
            return response
        
        # Подготавливаем URL для перенаправления
        current_path = request.META.get('HTTP_REFERER', '/')
        parsed_url = urlparse(current_path)
        path = parsed_url.path.lstrip('/')
        path_parts = path.split('/')
        
        # Логируем для отладки
        logger.debug(f"Смена языка на: {language}, текущий путь: {path_parts}")
        
        # Проверяем наличие языкового префикса
        has_lang_prefix = path_parts and path_parts[0] in supported_languages
        
        # Формируем новый путь
        new_path_parts = []
        if has_lang_prefix:
            # Удаляем текущий языковой префикс
            new_path_parts = path_parts[1:]
        else:
            new_path_parts = path_parts
        
        # Всегда добавляем языковой префикс (так как теперь prefix_default_language=True)
        new_path_parts.insert(0, language)
            
        # Собираем URL
        new_path = '/' + '/'.join(filter(None, new_path_parts))
        if not new_path:
            new_path = '/'
            
        # Если новый путь был бы пустым, добавляем слэш
        if new_path == '':
            new_path = '/'
        
        # Логируем для отладки
        logger.debug(f"Новый путь после изменения: {new_path}")
        
        redirect_url = urlunparse((
            parsed_url.scheme,
            parsed_url.netloc,
            new_path,
            parsed_url.params,
            parsed_url.query,
            parsed_url.fragment
        ))
        
        # Формируем ответ
        response = JsonResponse({
            'success': True,
            'message': f'Язык интерфейса изменен на {language}',
            'redirect': True,
            'redirect_url': redirect_url
        })
        
        # Устанавливаем cookie
        response.set_cookie(settings.LANGUAGE_COOKIE_NAME, language, **response_kwargs)
        
        return response
    except Exception as e:
        # Логируем ошибку
        logger.error(f"Ошибка при смене языка: {str(e)}")
        
        # Для GET-запроса при ошибке также редиректим на главную
        if request.method == 'GET':
            response = redirect('/')
            response.set_cookie(settings.LANGUAGE_COOKIE_NAME, language or 'ru', **response_kwargs)
            return response
            
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@require_POST
@csrf_exempt
def change_currency(request):
    """API обработчик смены валюты"""
    try:
        # Получаем данные из JSON
        data = json.loads(request.body)
        currency = data.get('currency', 'RUB')
        
        # Обновляем профиль компании
        if request.user.is_authenticated:
            if hasattr(request.user, 'company_profile'):
                profile = request.user.company_profile
                profile.preferred_currency = currency
                profile.save()
            else:
                CompanyProfile.objects.create(
                    user=request.user,
                    preferred_currency=currency
                )
        
        return JsonResponse({
            'success': True,
            'message': f'Основная валюта изменена на {currency}'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400) 