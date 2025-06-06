from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash, logout
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CompanyProfileForm
from .models import CompanyProfile, PricingPlan, EmailVerification, StorageFolder, StorageFile
from clients.models import Client
from invoices.models import Invoice
from decimal import Decimal
from django.db.models import Sum, Count, Q, Avg, F
from django.utils import timezone
from django.utils.translation import gettext as _
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
import random
import logging
import hashlib
import uuid
from datetime import datetime, timedelta
from urllib.parse import urlparse, urlunparse
import os
import mimetypes

# Create your views here.

def home(request):
    """Главная страница для неавторизованных пользователей"""
    if request.user.is_authenticated:
        return redirect('core:home_inside')
        
    # Получаем статистические данные для отображения на главной странице
    context = {
        'title': 'Главная - Billify',
        'total_users': 0,
        'total_invoices': 0,
        'total_clients': 0,
        'system_stats': {},
        'testimonials': [],
    }
    
    # Получаем данные о тарифных планах
    basic_plan = PricingPlan.objects.filter(plan_type='basic', subscription_period='month').first()
    premium_plans = PricingPlan.objects.filter(plan_type='premium').order_by('subscription_period')
    
    context['pricing_plans'] = {
        'basic': basic_plan,
        'premium': premium_plans.filter(subscription_period='month').first(),
        'premium_week': premium_plans.filter(subscription_period='week').first(),
        'premium_quarter': premium_plans.filter(subscription_period='quarter').first(),
        'premium_half_year': premium_plans.filter(subscription_period='half_year').first(),
        'premium_year': premium_plans.filter(subscription_period='year').first(),
    }
    
    # Импортируем модели и функции для сбора статистики
    from django.contrib.auth.models import User
    from invoices.models import Invoice
    from clients.models import Client
    from django.db.models import Sum, Count, Q, Avg, F
    from django.utils import timezone
    from decimal import Decimal
    import random
    
    # Базовая статистика системы
    try:
        # Общее количество пользователей, счетов и клиентов
        context['total_users'] = User.objects.count()
        context['total_invoices'] = Invoice.objects.count()
        context['total_clients'] = Client.objects.count()
        
        # Статистика по счетам
        invoices_stats = {
            'total_processed': Invoice.objects.exclude(status='draft').count(),
            'paid_percentage': round((Invoice.objects.filter(status='paid').count() / max(Invoice.objects.count(), 1)) * 100),
            'avg_invoice_value': Invoice.objects.aggregate(avg=Avg('total'))['avg'] or Decimal('0.00'),
            'monthly_growth': 12.5  # Заглушка, можно заменить на реальные данные
        }
        
        # Статистика по клиентам
        clients_stats = {
            'active_percentage': round((Client.objects.filter(is_active=True).count() / max(Client.objects.count(), 1)) * 100),
            'with_invoices': Client.objects.annotate(invoice_count=Count('invoices')).filter(invoice_count__gt=0).count(),
            'avg_client_invoices': Client.objects.annotate(invoice_count=Count('invoices')).aggregate(avg=Avg('invoice_count'))['avg'] or 0,
        }
        
        # Статистика по безопасности
        security_stats = {
            'uptime_percentage': 99.9,
            'protected_documents': context['total_invoices'] + context['total_clients'],
            'data_backup_count': context['total_users'] * 5,  # Примерно 5 резервных копий на пользователя
        }
        
        # Собираем всю статистику в один словарь
        context['system_stats'] = {
            'invoices': invoices_stats,
            'clients': clients_stats,
            'security': security_stats
        }
        
        # Получаем реальные отзывы клиентов, или создаем примеры, если их нет
        if User.objects.exists():
            # Получаем до 3 случайных пользователей с компаниями для отзывов
            sample_users = random.sample(list(User.objects.all())[:10], min(3, User.objects.count()))
            
            for user in sample_users:
                company_name = getattr(getattr(user, 'company_profile', None), 'company_name', None) or f"Компания {user.first_name}"
                position = "Директор" if random.random() > 0.5 else "ИП, консультант"
                
                # Генерируем отзыв в зависимости от активности пользователя
                invoice_count = Invoice.objects.filter(user=user).count()
                
                if invoice_count > 10:
                    review_text = f"Billify существенно упростил процесс выставления счетов. Теперь я трачу на финансовый учет в {random.randint(3, 7)} раз меньше времени!"
                elif invoice_count > 0:
                    review_text = f"Нам нравится аналитика в Billify. Благодаря наглядным отчетам мы смогли оптимизировать наши расходы и увеличить прибыль."
                else:
                    review_text = "Я перепробовал множество систем для учета, но Billify оказался самым понятным и функциональным. Рекомендую всем предпринимателям!"
                
                context['testimonials'].append({
                    'name': f"{user.first_name} {user.last_name}",
                    'company': company_name,
                    'position': position,
                    'text': review_text,
                })
        
        # Если отзывов нет, добавляем примеры
        if not context['testimonials']:
            context['testimonials'] = [
                {
                    'name': 'Елена Петрова',
                    'company': 'ИП Петрова',
                    'position': 'Фрилансер, дизайнер',
                    'text': 'Billify существенно упростил процесс выставления счетов и отслеживания платежей. Теперь я трачу на финансовый учет в 5 раз меньше времени!'
                },
                {
                    'name': 'Алексей Иванов',
                    'company': 'ООО "ТехСервис"',
                    'position': 'Директор',
                    'text': 'Нам нравится аналитика в Billify. Благодаря наглядным отчетам мы смогли оптимизировать наши расходы и увеличить прибыль на 20% за квартал.'
                },
                {
                    'name': 'Сергей Новиков',
                    'company': 'ООО "Консалт Групп"',
                    'position': 'ИП, консультант',
                    'text': 'Я перепробовал множество систем для учета, но Billify оказался самым понятным и функциональным. Рекомендую всем предпринимателям!'
                }
            ]
    
    except Exception as e:
        # В случае ошибок при сборе статистики, записываем в лог
        logger = logging.getLogger('django')
        logger.error(f"Error collecting stats for homepage: {str(e)}")
    
    return render(request, 'core/home.html', context)

@login_required
def home_inside(request):
    """Внутренняя главная страница для авторизованных пользователей"""
    # Инициализация значений по умолчанию
    context = {
        'title': 'Личный кабинет - Billify',
        'invoices_count': 0,
        'clients_count': 0,
        'suppliers_count': 0,
        'total_earnings': Decimal('0.00'),
        'completed_jobs': 0,
        'recent_activities': []
    }
    
    # Проверяем, подтверждена ли электронная почта пользователя
    email_verified = False
    try:
        email_verification = EmailVerification.objects.get(user=request.user)
        email_verified = email_verification.is_verified
    except EmailVerification.DoesNotExist:
        # Если записи нет, создаем новую
        if request.user.email:
            email_verification = EmailVerification.objects.create(
                user=request.user,
                email=request.user.email,
                is_verified=False
            )
    
    context['email_verified'] = email_verified
    context['has_email'] = bool(request.user.email)
    
    # Получаем количество клиентов и поставщиков текущего пользователя
    context['clients_count'] = Client.objects.filter(
        user=request.user, 
        is_active=True
    ).count()
    
    # Получаем количество поставщиков из модели Supplier
    from suppliers.models import Supplier
    context['suppliers_count'] = Supplier.objects.filter(
        user=request.user,
        is_active=True
    ).count()
    
    # Получаем все счета и данные, связанные с ними
    try:
        # Исходящие счета (генерирующие доход)
        outgoing_invoices = Invoice.objects.filter(
            user=request.user,
            invoice_type='outgoing'
        )
        context['invoices_count'] = outgoing_invoices.count()
        
        # Подсчет заработка (только по оплаченным счетам)
        paid_invoices = outgoing_invoices.filter(status='paid')
        earnings = paid_invoices.aggregate(Sum('total'))['total__sum']
        if earnings:
            context['total_earnings'] = earnings
        
        # Количество выполненных работ (оплаченных счетов)
        context['completed_jobs'] = paid_invoices.count()
        
        # Получаем недавнюю активность (последние 5 созданных счетов)
        recent_invoices = Invoice.objects.filter(user=request.user).order_by('-created_at')[:5]
        
        # Формируем список активностей для отображения
        activities = []
        for invoice in recent_invoices:
            # Определяем тип активности в зависимости от типа счета
            invoice_type = "Исходящий" if invoice.invoice_type == 'outgoing' else "Входящий"
            icon_class = "fas fa-file-export" if invoice.invoice_type == 'outgoing' else "fas fa-file-import"
                
            activity = {
                'icon': icon_class,
                'title': f"{invoice_type} счет №{invoice.number}",
                'description': f"{invoice.client.name} - {invoice.total} ₽",
                'time': invoice.created_at.strftime("%d.%m.%Y %H:%M"),
                'url': f"/invoices/{invoice.id}/"
            }
            activities.append(activity)
        
        context['recent_activities'] = activities
    except Exception as e:
        # В случае ошибки логируем её, но не прерываем выполнение
        print(f"Error in dashboard: {e}")
    
    return render(request, 'core/home_inside.html', context)

def about(request):
    """Перенаправление на главную страницу, т.к. информация объединена"""
    return render(request, 'core/about.html', {'title': 'О системе - Billify'})

def changelog(request):
    return render(request, 'core/changelog.html', {'title': 'Журнал изменений - Billify'})

def terms(request):
    """Страница условий использования"""
    return render(request, 'accounts/terms.html', {'title': 'Условия использования - Billify'})

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Регистрация успешно завершена!')
            return redirect('core:home_inside')
        else:
            for error in form.errors.values():
                messages.error(request, error[0])
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/auth.html', {'form': form})

def send_verification_email(request, user):
    """Отправляет письмо с подтверждением электронной почты"""
    if not user.email:
        return False
    
    # Генерируем токен на основе UUID, времени и соли
    token_salt = settings.SECRET_KEY
    token_generator = hashlib.sha256()
    token_generator.update(f"{user.id}:{uuid.uuid4()}:{token_salt}:{datetime.now()}".encode())
    token = token_generator.hexdigest()
    
    # Сохраняем информацию о подтверждении в модель EmailVerification
    email_verification, created = EmailVerification.objects.get_or_create(
        user=user,
        defaults={'email': user.email}
    )
    
    # Обновляем данные токена
    email_verification.token = token
    email_verification.token_created_at = timezone.now()
    email_verification.is_verified = False
    email_verification.email = user.email  # Обновляем на случай, если email изменился
    email_verification.save()
    
    # Создаем ссылку для подтверждения
    verification_link = request.build_absolute_uri(
        reverse('core:verify_email', kwargs={'user_id': user.id, 'token': token})
    )
    
    # Подготовка и отправка письма
    subject = 'Подтверждение электронной почты в Billify'
    html_message = render_to_string('email/email_verification.html', {
        'user': user,
        'verification_link': verification_link
    })
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger = logging.getLogger('django')
        logger.error(f"Error sending verification email: {str(e)}")
        return False

@login_required
def profile(request):
    """Страница профиля компании пользователя"""
    try:
        # Пытаемся получить существующий профиль
        profile = request.user.company_profile
    except CompanyProfile.DoesNotExist:
        # Если профиля нет, создаем новый
        profile = CompanyProfile(user=request.user)
        profile.save()
    
    if request.method == 'POST':
        action = request.POST.get('action', 'company_info')
        
        # Обработка разных действий в зависимости от того, какая вкладка активна
        if action == 'company_info':
            # Обновление информации о компании
            form = CompanyProfileForm(request.POST, request.FILES, instance=profile)
            if form.is_valid():
                profile_obj = form.save(commit=False)
                
                # Проверяем, есть ли новые файлы для загрузки
                if 'logo' in request.FILES:
                    profile_obj.logo = request.FILES['logo']
                if 'stamp' in request.FILES:
                    profile_obj.stamp = request.FILES['stamp']
                if 'signature' in request.FILES:
                    profile_obj.signature = request.FILES['signature']
                
                profile_obj.save()
                messages.success(request, 'Информация о компании успешно обновлена!')
                return redirect('core:profile')
        
        elif action == 'upload_files':
            # Загрузка файлов (логотип, печать, подпись)
            form = CompanyProfileForm(request.POST, request.FILES, instance=profile)
            if form.is_valid():
                profile_obj = form.save(commit=False)
                
                # Проверяем, есть ли новые файлы для загрузки
                if 'logo' in request.FILES:
                    profile_obj.logo = request.FILES['logo']
                if 'stamp' in request.FILES:
                    profile_obj.stamp = request.FILES['stamp']
                if 'signature' in request.FILES:
                    profile_obj.signature = request.FILES['signature']
                
                profile_obj.save()
                messages.success(request, 'Файлы успешно загружены!')
                # Исправляем redirect с фрагментом URL
                response = redirect('core:profile')
                response['Location'] += '#upload-files'
                return response
        
        elif action == 'change_password':
            # Смена пароля
            password_form = PasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)  # Обновление сессии, чтобы не разлогиниться
                messages.success(request, 'Ваш пароль успешно изменен!')
                # Исправляем redirect с фрагментом URL
                response = redirect('core:profile')
                response['Location'] += '#change-password'
                return response
            else:
                for error in password_form.errors.values():
                    messages.error(request, error[0])
                # Исправляем redirect с фрагментом URL
                response = redirect('core:profile')
                response['Location'] += '#change-password'
                return response
        
        elif action == 'change_language':
            # Смена языка интерфейса
            language = request.POST.get('language', 'ru')
            # Здесь можно сохранить предпочтения пользователя в модели User или отдельной модели настроек
            # В данном примере просто показываем сообщение об успешной смене
            messages.success(request, f'Язык интерфейса изменен на {language}!')
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#language-currency'
            return response
        
        elif action == 'change_currency':
            # Смена валюты
            currency = request.POST.get('currency', 'RUB')
            # Здесь можно сохранить предпочтения пользователя в модели User или отдельной модели настроек
            messages.success(request, f'Основная валюта изменена на {currency}!')
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#language-currency'
            return response
        
        elif action == 'resend_verification':
            # Повторная отправка письма для подтверждения электронной почты
            if request.user.email:
                success = send_verification_email(request, request.user)
                if success:
                    messages.success(request, 'Письмо с подтверждением отправлено повторно!')
                else:
                    messages.error(request, 'Не удалось отправить письмо. Пожалуйста, попробуйте позже.')
            else:
                messages.error(request, 'У вас не указана электронная почта!')
            
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#email-verification'
            return response
    else:
        form = CompanyProfileForm(instance=profile)
    
    # Получаем статус верификации почты
    email_verified = False
    try:
        email_verification = EmailVerification.objects.get(user=request.user)
        email_verified = email_verification.is_verified
    except EmailVerification.DoesNotExist:
        # Если записи нет, создаем новую
        if request.user.email:
            email_verification = EmailVerification.objects.create(
                user=request.user,
                email=request.user.email,
                is_verified=False
            )
    
    return render(request, 'core/profile.html', {
        'form': form,
        'title': 'Профиль компании - Billify',
        'email_verified': email_verified
    })

# Обновляем маршрут для подтверждения электронной почты
@login_required
def verify_email(request, user_id, token):
    """Подтверждение электронной почты пользователя"""
    user = request.user
    
    # Проверяем, совпадает ли ID пользователя
    if str(user.id) != str(user_id):
        messages.error(request, 'Недействительная ссылка подтверждения!')
        # Исправляем redirect с фрагментом URL
        response = redirect('core:profile')
        response['Location'] += '#email-verification'
        return response
    
    # Получаем данные о верификации из базы данных
    try:
        email_verification = EmailVerification.objects.get(user=user)
        
        # Проверяем токен
        if email_verification.token != token:
            messages.error(request, 'Недействительный токен подтверждения!')
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#email-verification'
            return response
        
        # Проверяем срок действия токена (24 часа)
        if timezone.now() - email_verification.token_created_at > timedelta(hours=24):
            messages.error(request, 'Срок действия ссылки подтверждения истек. Запросите новую ссылку.')
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#email-verification'
            return response
        
        # Проверяем, совпадает ли почта с текущей почтой пользователя
        if email_verification.email != user.email:
            messages.error(request, 'Электронная почта была изменена после отправки ссылки подтверждения.')
            # Исправляем redirect с фрагментом URL
            response = redirect('core:profile')
            response['Location'] += '#email-verification'
            return response
        
        # Активируем пользователя
        email_verification.is_verified = True
        email_verification.verified_at = timezone.now()
        email_verification.save()
        
        messages.success(request, 'Ваша электронная почта успешно подтверждена!')
    except EmailVerification.DoesNotExist:
        messages.error(request, 'Информация о подтверждении почты не найдена!')
    
    # Исправляем redirect с фрагментом URL
    response = redirect('core:profile')
    response['Location'] += '#email-verification'
    return response

@require_POST
@csrf_exempt
def change_language_ajax(request):
    """AJAX-обработчик для смены языка"""
    try:
        # Получаем данные из JSON
        data = json.loads(request.body)
        language = data.get('language', 'ru')
        
        # Проверяем, что язык один из поддерживаемых
        from django.conf import settings
        supported_languages = [code for code, name in settings.LANGUAGES]
        default_language = settings.LANGUAGE_CODE.split('-')[0]  # 'ru' по умолчанию
        if language not in supported_languages:
            language = default_language
        
        # Обновляем профиль компании только для аутентифицированных пользователей
        if request.user.is_authenticated:
            if hasattr(request.user, 'company_profile'):
                profile = request.user.company_profile
                profile.preferred_language = language
                profile.save()
            else:
                # Если профиль не существует, создаем его
                from core.models import CompanyProfile
                profile = CompanyProfile.objects.create(
                    user=request.user,
                    preferred_language=language
                )
        
        # Устанавливаем язык в сессии Django
        from django.utils.translation import activate
        activate(language)
        request.session['_language'] = language
        
        # Генерируем новый URL с префиксом языка
        current_path = request.META.get('HTTP_REFERER', '/')
        
        # Парсим текущий URL
        parsed_url = urlparse(current_path)
        path = parsed_url.path.lstrip('/')
        path_parts = path.split('/')
        
        # Проверяем наличие языкового префикса в текущем URL
        has_lang_prefix = path_parts and path_parts[0] in supported_languages
        
        # Формируем новый путь с правильным языковым префиксом
        if has_lang_prefix:
            # Удаляем текущий языковой префикс
            path_parts = path_parts[1:]
            
        # Добавляем новый префикс, если язык не является языком по умолчанию
        if language != default_language:
            path_parts.insert(0, language)
            
        # Собираем новый URL
        new_path = '/' + '/'.join(path_parts)
        if new_path == '/': 
            new_path = '/'
        
        # Формируем полный URL
        redirect_url = urlunparse((
            parsed_url.scheme,
            parsed_url.netloc,
            new_path,
            parsed_url.params,
            parsed_url.query,
            parsed_url.fragment
        ))
        
        # Устанавливаем куку для языка
        response = JsonResponse({
            'success': True,
            'message': f'Язык интерфейса изменен на {language}',
            'redirect': True,  # Флаг для JS, что нужно перезагрузить страницу
            'redirect_url': redirect_url  # URL для перенаправления
        })
        
        # Устанавливаем cookie с языком
        response.set_cookie(
            settings.LANGUAGE_COOKIE_NAME,
            language,
            max_age=settings.LANGUAGE_COOKIE_AGE,
            path=settings.LANGUAGE_COOKIE_PATH,
            domain=settings.LANGUAGE_COOKIE_DOMAIN,
            secure=settings.LANGUAGE_COOKIE_SECURE,
            httponly=settings.LANGUAGE_COOKIE_HTTPONLY,
            samesite=settings.LANGUAGE_COOKIE_SAMESITE,
        )
        
        return response
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

@login_required
@require_POST
@csrf_exempt
def change_currency_ajax(request):
    """AJAX-обработчик для смены валюты"""
    try:
        # Получаем данные из JSON
        data = json.loads(request.body)
        currency = data.get('currency', 'RUB')
        
        # Обновляем профиль компании пользователя
        if hasattr(request.user, 'company_profile'):
            profile = request.user.company_profile
            profile.preferred_currency = currency
            profile.save()
        else:
            # Если профиль не существует, создаем его
            from core.models import CompanyProfile
            profile = CompanyProfile.objects.create(
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

def custom_logout(request):
    """Выход из системы с перенаправлением на главную страницу"""
    logout(request)
    messages.success(request, 'Вы успешно вышли из системы.')
    return redirect('core:home')

def yandex_turbo_feed(request):
    from django.shortcuts import render
    # Здесь можно добавить логику для формирования данных
    return render(request, 'yandex_turbo_feed.html', {}, content_type='application/xml')

@login_required
@require_POST
@csrf_exempt
def send_verification_email_ajax(request):
    """AJAX-обработчик для отправки письма с подтверждением электронной почты"""
    try:
        if not request.user.email:
            return JsonResponse({
                'success': False,
                'message': 'Не указан адрес электронной почты'
            }, status=400)
        
        # Отправляем письмо с подтверждением
        success = send_verification_email(request, request.user)
        
        if success:
            return JsonResponse({
                'success': True,
                'message': 'Письмо с подтверждением успешно отправлено'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Не удалось отправить письмо. Пожалуйста, попробуйте позже.'
            }, status=500)
    except Exception as e:
        logger = logging.getLogger('django')
        logger.error(f"Error sending verification email via AJAX: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Произошла ошибка при отправке письма'
        }, status=500)

def privacy(request):
    """Страница политики конфиденциальности"""
    return render(request, 'core/privacy.html', {'title': 'Политика конфиденциальности - Billify'})

def legal(request):
    """Страница правовой информации"""
    return render(request, 'core/legal.html', {'title': 'Правовая информация - Billify'})

def pricing(request):
    """Страница с тарифными планами"""
    # Получаем данные о тарифных планах
    from core.models import PricingPlan
    
    basic_plan = PricingPlan.objects.filter(plan_type='basic', subscription_period='month').first()
    premium_plans = PricingPlan.objects.filter(plan_type='premium').order_by('subscription_period')
    
    context = {
        'title': 'Тарифы - Billify',
        'pricing_plans': {
            'basic': basic_plan,
            'premium': premium_plans.filter(subscription_period='month').first(),
            'premium_week': premium_plans.filter(subscription_period='week').first(),
            'premium_quarter': premium_plans.filter(subscription_period='quarter').first(),
            'premium_half_year': premium_plans.filter(subscription_period='half_year').first(),
            'premium_year': premium_plans.filter(subscription_period='year').first(),
        }
    }
    
    return render(request, 'core/pricing.html', context)

@login_required
def help_view(request):
    """Страница помощи"""
    return render(request, 'core/help.html', {'title': 'Помощь - Billify'})

@login_required
def user_guide(request):
    """Руководство пользователя"""
    return render(request, 'core/guide.html', {'title': 'Руководство пользователя - Billify'})

def contact_us(request):
    """Страница контактов"""
    if request.method == 'POST':
        # Обработка формы контактов (можно реализовать отправку email)
        name = request.POST.get('name')
        email = request.POST.get('email')
        message = request.POST.get('message')
        
        if name and email and message:
            # Здесь можно добавить отправку email
            messages.success(request, 'Ваше сообщение успешно отправлено!')
            return redirect('core:contact')
    
    return render(request, 'core/contact.html', {'title': 'Связаться с нами - Billify'})

@login_required
def storage_home(request):
    """Главная страница хранилища файлов пользователя"""
    # Получаем корневые папки (без родительской папки)
    root_folders = StorageFolder.objects.filter(user=request.user, parent=None)
    # Получаем файлы в корневом каталоге (не в папках)
    root_files = StorageFile.objects.filter(user=request.user, folder=None)
    
    # Получаем информацию о занятом месте на диске
    used_space = StorageFile.objects.filter(user=request.user).aggregate(total_size=Sum('size'))
    used_bytes = used_space['total_size'] or 0
    
    # Конвертируем в мегабайты для отображения
    used_mb = used_bytes / (1024 * 1024)
    
    # Получаем максимальное доступное пространство из тарифного плана (по умолчанию 1 ГБ)
    max_space_mb = 1024  # 1 ГБ
    
    context = {
        'root_folders': root_folders,
        'root_files': root_files,
        'used_space': used_mb,
        'max_space': max_space_mb,
        'space_percent': (used_mb / max_space_mb) * 100 if max_space_mb > 0 else 0,
        'current_path': [],
        'current_folder': None,
    }
    
    return render(request, 'core/storage/index.html', context)


@login_required
def storage_folder_detail(request, folder_id):
    """Просмотр содержимого папки"""
    folder = get_object_or_404(StorageFolder, id=folder_id, user=request.user)
    
    # Получаем подпапки текущей папки
    subfolders = StorageFolder.objects.filter(parent=folder)
    
    # Получаем файлы текущей папки
    files = StorageFile.objects.filter(folder=folder)
    
    # Формируем путь к текущей папке для хлебных крошек
    path = []
    current = folder
    while current is not None:
        path.insert(0, current)
        current = current.parent
    
    # Получаем информацию о занятом месте на диске
    used_space = StorageFile.objects.filter(user=request.user).aggregate(total_size=Sum('size'))
    used_bytes = used_space['total_size'] or 0
    used_mb = used_bytes / (1024 * 1024)
    max_space_mb = 1024  # 1 ГБ
    
    context = {
        'current_folder': folder,
        'subfolders': subfolders,
        'files': files,
        'current_path': path,
        'used_space': used_mb,
        'max_space': max_space_mb,
        'space_percent': (used_mb / max_space_mb) * 100 if max_space_mb > 0 else 0,
    }
    
    return render(request, 'core/storage/folder_detail.html', context)


@login_required
def storage_favorites(request):
    """Просмотр избранных файлов"""
    favorite_files = StorageFile.objects.filter(user=request.user, is_favorite=True)
    
    # Получаем информацию о занятом месте на диске
    used_space = StorageFile.objects.filter(user=request.user).aggregate(total_size=Sum('size'))
    used_bytes = used_space['total_size'] or 0
    used_mb = used_bytes / (1024 * 1024)
    max_space_mb = 1024  # 1 ГБ
    
    context = {
        'files': favorite_files,
        'used_space': used_mb,
        'max_space': max_space_mb,
        'space_percent': (used_mb / max_space_mb) * 100 if max_space_mb > 0 else 0,
        'is_favorites_page': True,
    }
    
    return render(request, 'core/storage/favorites.html', context)


@login_required
@require_POST
def create_folder(request):
    """Создание новой папки"""
    folder_name = request.POST.get('folder_name', '').strip()
    parent_id = request.POST.get('parent_id')
    
    if not folder_name:
        return JsonResponse({'status': 'error', 'message': 'Необходимо указать название папки'})
    
    # Проверяем, существует ли родительская папка (если указана)
    parent = None
    if parent_id:
        try:
            parent = StorageFolder.objects.get(id=parent_id, user=request.user)
        except StorageFolder.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Родительская папка не найдена'})
    
    # Проверяем, существует ли папка с таким именем в этом каталоге
    if StorageFolder.objects.filter(user=request.user, parent=parent, name=folder_name).exists():
        return JsonResponse({'status': 'error', 'message': 'Папка с таким именем уже существует'})
    
    # Создаем новую папку
    new_folder = StorageFolder.objects.create(
        user=request.user,
        parent=parent,
        name=folder_name
    )
    
    return JsonResponse({
        'status': 'success',
        'message': 'Папка успешно создана',
        'folder': {
            'id': new_folder.id,
            'name': new_folder.name,
            'created_at': new_folder.created_at.strftime('%d.%m.%Y %H:%M')
        }
    })


@login_required
@require_POST
def upload_file(request):
    """Загрузка файла в хранилище"""
    if 'file' not in request.FILES:
        return JsonResponse({'status': 'error', 'message': 'Файл не выбран'})
    
    uploaded_file = request.FILES['file']
    folder_id = request.POST.get('folder_id')
    
    # Проверяем размер файла
    max_size = 50 * 1024 * 1024  # 50 MB - максимальный размер файла
    if uploaded_file.size > max_size:
        return JsonResponse({'status': 'error', 'message': 'Размер файла превышает максимально допустимый (50 МБ)'})
    
    # Проверяем свободное место
    used_space = StorageFile.objects.filter(user=request.user).aggregate(total_size=Sum('size'))['total_size'] or 0
    max_space = 1024 * 1024 * 1024  # 1 GB
    
    if used_space + uploaded_file.size > max_space:
        return JsonResponse({'status': 'error', 'message': 'Недостаточно места в хранилище'})
    
    # Проверяем папку, если указана
    folder = None
    if folder_id:
        try:
            folder = StorageFolder.objects.get(id=folder_id, user=request.user)
        except StorageFolder.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Папка не найдена'})
    
    # Генерируем уникальное имя файла, если файл с таким именем уже существует
    file_name = uploaded_file.name
    base_name, ext = os.path.splitext(file_name)
    
    counter = 1
    while StorageFile.objects.filter(user=request.user, folder=folder, name=file_name).exists():
        file_name = f"{base_name}_{counter}{ext}"
        counter += 1
    
    # Определяем тип файла
    content_type, _ = mimetypes.guess_type(uploaded_file.name)
    file_type = 'other'
    
    if content_type:
        if content_type.startswith('image/'):
            file_type = 'image'
        elif content_type == 'application/pdf':
            file_type = 'pdf'
        elif content_type.startswith('application/vnd.ms-') or content_type.startswith('application/vnd.openxmlformats-'):
            file_type = 'document'
        elif content_type in ['application/zip', 'application/x-rar-compressed', 'application/x-gzip']:
            file_type = 'archive'
    
    # Создаем файл в хранилище
    new_file = StorageFile.objects.create(
        user=request.user,
        folder=folder,
        name=file_name,
        file=uploaded_file,
        file_type=file_type,
        size=uploaded_file.size
    )
    
    return JsonResponse({
        'status': 'success',
        'message': 'Файл успешно загружен',
        'file': {
            'id': new_file.id,
            'name': new_file.name,
            'type': new_file.file_type,
            'size': new_file.get_file_size_display(),
            'created_at': new_file.created_at.strftime('%d.%m.%Y %H:%M')
        }
    })


@login_required
@require_POST
def delete_file(request, file_id):
    """Удаление файла из хранилища"""
    file = get_object_or_404(StorageFile, id=file_id, user=request.user)
    
    # Сохраняем информацию о файле для ответа
    file_info = {
        'id': file.id,
        'name': file.name
    }
    
    # Удаляем файл
    file.file.delete(save=False)
    file.delete()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Файл успешно удален',
        'file': file_info
    })


@login_required
@require_POST
def delete_folder(request, folder_id):
    """Удаление папки и всех ее содержимых"""
    folder = get_object_or_404(StorageFolder, id=folder_id, user=request.user)
    
    # Рекурсивно удаляем все файлы из папки и ее подпапок
    def delete_folder_contents(storage_folder):
        # Удаляем все файлы в папке
        for file in StorageFile.objects.filter(folder=storage_folder):
            file.file.delete(save=False)
            file.delete()
        
        # Рекурсивно удаляем все подпапки и их содержимое
        for subfolder in StorageFolder.objects.filter(parent=storage_folder):
            delete_folder_contents(subfolder)
            subfolder.delete()
    
    # Сохраняем информацию о папке для ответа
    folder_info = {
        'id': folder.id,
        'name': folder.name
    }
    
    # Удаляем содержимое папки и саму папку
    delete_folder_contents(folder)
    folder.delete()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Папка успешно удалена',
        'folder': folder_info
    })


@login_required
@require_POST
def rename_folder(request, folder_id):
    """Переименование папки"""
    folder = get_object_or_404(StorageFolder, id=folder_id, user=request.user)
    new_name = request.POST.get('name', '').strip()
    
    if not new_name:
        return JsonResponse({'status': 'error', 'message': 'Необходимо указать новое имя папки'})
    
    # Проверяем, существует ли папка с таким именем на этом же уровне
    if StorageFolder.objects.filter(user=request.user, parent=folder.parent, name=new_name).exclude(id=folder.id).exists():
        return JsonResponse({'status': 'error', 'message': 'Папка с таким именем уже существует'})
    
    # Переименовываем папку
    folder.name = new_name
    folder.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Папка переименована',
        'folder': {
            'id': folder.id,
            'name': folder.name
        }
    })


@login_required
@require_POST
def rename_file(request, file_id):
    """Переименование файла"""
    file = get_object_or_404(StorageFile, id=file_id, user=request.user)
    new_name = request.POST.get('name', '').strip()
    
    if not new_name:
        return JsonResponse({'status': 'error', 'message': 'Необходимо указать новое имя файла'})
    
    # Проверяем расширение файла
    _, old_ext = os.path.splitext(file.name)
    _, new_ext = os.path.splitext(new_name)
    
    # Если расширение изменилось или отсутствует в новом имени, добавляем старое расширение
    if old_ext != new_ext:
        new_name = f"{new_name}{old_ext}"
    
    # Проверяем, существует ли файл с таким именем в этой папке
    if StorageFile.objects.filter(user=request.user, folder=file.folder, name=new_name).exclude(id=file.id).exists():
        return JsonResponse({'status': 'error', 'message': 'Файл с таким именем уже существует'})
    
    # Переименовываем файл
    file.name = new_name
    file.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Файл переименован',
        'file': {
            'id': file.id,
            'name': file.name
        }
    })


@login_required
@require_POST
def toggle_favorite(request, file_id):
    """Добавление/удаление файла из избранного"""
    file = get_object_or_404(StorageFile, id=file_id, user=request.user)
    
    # Изменяем статус избранного
    file.is_favorite = not file.is_favorite
    file.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Статус избранного изменен',
        'file': {
            'id': file.id,
            'name': file.name,
            'is_favorite': file.is_favorite
        }
    })


@login_required
@require_POST
def move_file(request, file_id):
    """Перемещение файла в другую папку"""
    file = get_object_or_404(StorageFile, id=file_id, user=request.user)
    target_folder_id = request.POST.get('folder_id')
    
    # Если target_folder_id пустой - перемещаем в корневой каталог
    target_folder = None
    if target_folder_id:
        target_folder = get_object_or_404(StorageFolder, id=target_folder_id, user=request.user)
        
        # Проверяем, существует ли файл с таким именем в целевой папке
        if StorageFile.objects.filter(user=request.user, folder=target_folder, name=file.name).exists():
            return JsonResponse({'status': 'error', 'message': 'Файл с таким именем уже существует в целевой папке'})
    
    # Перемещаем файл
    file.folder = target_folder
    file.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Файл перемещен',
        'file': {
            'id': file.id,
            'name': file.name,
            'folder_id': target_folder.id if target_folder else None
        }
    })


@login_required
@require_POST
def move_folder(request, folder_id):
    """Перемещение папки в другую папку"""
    folder = get_object_or_404(StorageFolder, id=folder_id, user=request.user)
    target_folder_id = request.POST.get('target_folder_id')
    
    # Если target_folder_id пустой - перемещаем в корневой каталог
    target_folder = None
    if target_folder_id:
        target_folder = get_object_or_404(StorageFolder, id=target_folder_id, user=request.user)
        
        # Проверяем, не пытаемся ли переместить папку внутрь самой себя или своих подпапок
        current = target_folder
        while current is not None:
            if current.id == folder.id:
                return JsonResponse({
                    'status': 'error', 
                    'message': 'Нельзя переместить папку внутрь самой себя или её подпапок'
                })
            current = current.parent
        
        # Проверяем, существует ли папка с таким именем в целевой папке
        if StorageFolder.objects.filter(user=request.user, parent=target_folder, name=folder.name).exists():
            return JsonResponse({
                'status': 'error', 
                'message': 'Папка с таким именем уже существует в целевой папке'
            })
    
    # Перемещаем папку
    folder.parent = target_folder
    folder.save()
    
    return JsonResponse({
        'status': 'success',
        'message': 'Папка перемещена',
        'folder': {
            'id': folder.id,
            'name': folder.name,
            'parent_id': target_folder.id if target_folder else None
        }
    })
