from django.shortcuts import redirect
from django.urls import resolve, Resolver404
from django.conf import settings
from django.urls import reverse
from django.utils import translation
from django.http import HttpResponseRedirect
import logging

logger = logging.getLogger(__name__)

class Custom404Middleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Если это 404 ошибка и пользователь не аутентифицирован
        if response.status_code == 404 and not request.user.is_authenticated:
            # Если URL содержит accounts/login (ошибка Django)
            if 'accounts/login' in request.path:
                # Извлекаем next параметр, если он есть
                next_url = request.GET.get('next', '/')
                # Перенаправляем на правильный URL авторизации
                return redirect(f"{settings.LOGIN_URL}?next={next_url}")
                
        return response

class AuthRequiredMiddleware:
    """Middleware для перенаправления на страницу авторизации при доступе к защищенным ресурсам"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Пути, доступные без авторизации
        self.public_paths = [
            '/',                      # Главная страница
            '/about/',               # О нас
            '/changelog/',           # Журнал изменений
            '/terms/',               # Условия использования
            '/register/',            # Регистрация
            '/login/',               # Вход
            '/admin/',               # Админка
            '/password-reset/',      # Сброс пароля и связанные URL
            '/yandex_turbo_rss.xml', # Сервисные URL
            '/yandex_verification.html', # Сервисные URL
            '/i18n/setlang/',        # Переключение языка
        ]
        
        # Языковые префиксы
        self.lang_prefixes = [f'/{code}/' for code, name in settings.LANGUAGES]
        
        # Пути, которые начинаются с указанных префиксов, также публичные
        self.public_path_prefixes = [
            '/static/',
            '/media/',
            '/password-reset',
            '/admin/',
            '/i18n/',
            '/api/change-language/',
        ]
    
    def __call__(self, request):
        # Если пользователь уже аутентифицирован, пропускаем проверку
        if request.user.is_authenticated:
            return self.get_response(request)
        
        # Проверяем, является ли текущий путь публичным
        path = request.path
        
        # Проверка на точные совпадения
        if path in self.public_paths:
            return self.get_response(request)
        
        # Проверка на языковые префиксы + публичные пути
        for lang_prefix in self.lang_prefixes:
            for public_path in self.public_paths:
                if path.startswith(lang_prefix) and path.replace(lang_prefix, '/').startswith(public_path):
                    return self.get_response(request)
                    
        # Проверка на префиксы
        for prefix in self.public_path_prefixes:
            if path.startswith(prefix):
                return self.get_response(request)
        
        # Если путь не публичный и пользователь не аутентифицирован
        # перенаправляем на страницу входа с параметром next
        return redirect(f"{settings.LOGIN_URL}?next={path}")


class UserLanguageMiddleware:
    """Middleware для установки языка на основе профиля пользователя"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            # Получаем список поддерживаемых языков
            supported_languages = [code for code, name in settings.LANGUAGES]
            default_language = settings.LANGUAGE_CODE.split('-')[0]  # Используем значение из настроек
            
            # Получаем текущий язык из URL (если он присутствует)
            language_from_url = self._get_language_from_url(request)
            
            # Получаем язык из куки
            language_from_cookie = request.COOKIES.get(settings.LANGUAGE_COOKIE_NAME)
            
            # Определяем язык пользователя из профиля (для аутентифицированных пользователей)
            user_language = None
            if request.user.is_authenticated and hasattr(request.user, 'company_profile'):
                user_language = request.user.company_profile.preferred_language
            
            # Приоритет: URL > cookie > профиль пользователя > настройки по умолчанию
            current_language = language_from_url or language_from_cookie or user_language or default_language
            
            # Проверка, что язык входит в список поддерживаемых
            if current_language not in supported_languages:
                current_language = default_language
                
            # Активируем язык для текущего запроса
            translation.activate(current_language)
            request.LANGUAGE_CODE = current_language
            
            # Устанавливаем язык в сессии
            if hasattr(request, 'session'):
                request.session['_language'] = current_language
            
            # Если запрос к API, то не перенаправляем, так как нужен просто JSON ответ
            if request.path.startswith('/api/'):
                response = self.get_response(request)
                return response
            
            # Поскольку prefix_default_language=True, проверим наличие языкового префикса для всех языков
            if not language_from_url:
                logger.debug(f"URL без языкового префикса: {request.path}, перенаправляем на URL с префиксом: {current_language}")
                redirect_response = self._redirect_with_language_prefix(request, current_language)
                if redirect_response:
                    return redirect_response
            
            # Получаем ответ от следующего middleware в цепочке
            response = self.get_response(request)
            
            # Устанавливаем cookie с языком в ответе
            if not language_from_cookie or language_from_cookie != current_language:
                response.set_cookie(
                    settings.LANGUAGE_COOKIE_NAME,
                    current_language,
                    max_age=settings.LANGUAGE_COOKIE_AGE,
                    path=settings.LANGUAGE_COOKIE_PATH,
                    domain=settings.LANGUAGE_COOKIE_DOMAIN,
                    secure=settings.LANGUAGE_COOKIE_SECURE,
                    httponly=settings.LANGUAGE_COOKIE_HTTPONLY,
                    samesite=settings.LANGUAGE_COOKIE_SAMESITE,
                )
                
            return response
        except Exception as e:
            # В случае ошибки логируем и пропускаем обработку языка
            logger.error(f"Ошибка в UserLanguageMiddleware: {str(e)}")
            return self.get_response(request)
    
    def _get_language_from_url(self, request):
        """Извлекает языковой код из URL, если он присутствует"""
        path_parts = request.path.strip('/').split('/')
        supported_languages = [code for code, name in settings.LANGUAGES]
        if path_parts and path_parts[0] in supported_languages:
            return path_parts[0]
        return None
    
    def _redirect_with_language_prefix(self, request, language):
        """Перенаправляет на URL с префиксом языка"""
        try:
            # Пропускаем определенные URL, для которых не нужен редирект
            skip_paths = ['/static/', '/media/', '/admin/jsi18n/']
            for path in skip_paths:
                if request.path.startswith(path):
                    return None
            
            # Пропускаем явные разрешенные URL без префикса
            direct_allowed_paths = ['/dashboard/']
            if request.path in direct_allowed_paths:
                return None
            
            # Проверяем, если текущий URL уже содержит какой-либо языковой префикс, не перенаправляем снова
            current_path_parts = request.path.strip('/').split('/')
            supported_languages = [code for code, name in settings.LANGUAGES]
            if current_path_parts and current_path_parts[0] in supported_languages:
                return None
            
            path = request.get_full_path()
            new_url = f"/{language}{path}"
            return HttpResponseRedirect(new_url)
        except Exception as e:
            logger.error(f"Ошибка при перенаправлении на URL с префиксом языка: {str(e)}")
            return None
    
    def _redirect_without_language_prefix(self, request):
        """Перенаправляет на URL без префикса языка (Не используется, так как prefix_default_language=True)"""
        try:
            # Пропускаем определенные URL, для которых не нужен редирект
            skip_paths = ['/static/', '/media/', '/admin/jsi18n/']
            for path in skip_paths:
                if request.path.startswith(path):
                    return None
                    
            path_parts = request.path.strip('/').split('/')
            if len(path_parts) > 1:
                new_url = '/' + '/'.join(path_parts[1:])
            else:
                new_url = '/'
                
            if request.GET:
                new_url += '?' + request.GET.urlencode()
                
            return HttpResponseRedirect(new_url)
        except Exception as e:
            logger.error(f"Ошибка при перенаправлении на URL без префикса языка: {str(e)}")
            return None 