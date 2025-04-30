from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CompanyProfileForm
from .models import CompanyProfile
from clients.models import Client
from invoices.models import Invoice
from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext as _
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.template.loader import render_to_string
from django.utils.html import strip_tags

# Create your views here.

def home(request):
    """Главная страница для неавторизованных пользователей"""
    if request.user.is_authenticated:
        return redirect('core:home_inside')
    return render(request, 'core/home.html', {'title': 'Главная - Billify'})

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
    
    # Получаем количество клиентов и поставщиков текущего пользователя
    context['clients_count'] = Client.objects.filter(
        user=request.user, 
        is_active=True,
        entity_type='client'
    ).count()
    
    context['suppliers_count'] = Client.objects.filter(
        user=request.user, 
        is_active=True,
        entity_type='supplier'
    ).count()
    
    # Получаем все счета и данные, связанные с ними
    try:
        company_profile = getattr(request.user, 'company_profile', None)
        if company_profile:
            company_name = company_profile.company_name
            
            # Исходящие счета (генерирующие доход)
            outgoing_invoices = Invoice.objects.filter(supplier_name=company_name)
            context['invoices_count'] = outgoing_invoices.count()
            
            # Подсчет заработка (только по оплаченным счетам)
            paid_invoices = outgoing_invoices.filter(status='paid')
            earnings = paid_invoices.aggregate(Sum('total'))['total__sum']
            if earnings:
                context['total_earnings'] = earnings
            
            # Количество выполненных работ (оплаченных счетов)
            context['completed_jobs'] = paid_invoices.count()
            
            # Получаем недавнюю активность (последние 5 созданных счетов)
            recent_invoices = Invoice.objects.order_by('-created_at')[:5]
            
            # Формируем список активностей для отображения
            activities = []
            for invoice in recent_invoices:
                # Определяем тип активности в зависимости от статуса счета
                invoice_type = "Исходящий" if invoice.supplier_name == company_name else "Входящий"
                icon_class = "fas fa-file-export" if invoice.supplier_name == company_name else "fas fa-file-import"
                    
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
                return redirect('core:profile#upload-files')
        
        elif action == 'change_password':
            # Смена пароля
            password_form = PasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)  # Обновление сессии, чтобы не разлогиниться
                messages.success(request, 'Ваш пароль успешно изменен!')
                return redirect('core:profile#change-password')
            else:
                for error in password_form.errors.values():
                    messages.error(request, error[0])
                return redirect('core:profile#change-password')
        
        elif action == 'change_language':
            # Смена языка интерфейса
            language = request.POST.get('language', 'ru')
            # Здесь можно сохранить предпочтения пользователя в модели User или отдельной модели настроек
            # В данном примере просто показываем сообщение об успешной смене
            messages.success(request, f'Язык интерфейса изменен на {language}!')
            return redirect('core:profile#language-currency')
        
        elif action == 'change_currency':
            # Смена валюты
            currency = request.POST.get('currency', 'RUB')
            # Здесь можно сохранить предпочтения пользователя в модели User или отдельной модели настроек
            messages.success(request, f'Основная валюта изменена на {currency}!')
            return redirect('core:profile#language-currency')
        
        elif action == 'resend_verification':
            # Повторная отправка письма для подтверждения электронной почты
            if request.user.email:
                # Здесь должна быть логика для генерации токена и отправки письма
                # Пример простой отправки:
                verification_link = request.build_absolute_uri(
                    reverse('core:verify_email', kwargs={'user_id': request.user.id})
                )
                subject = 'Подтверждение электронной почты'
                html_message = render_to_string('email/email_verification.html', {
                    'user': request.user,
                    'verification_link': verification_link
                })
                plain_message = strip_tags(html_message)
                
                send_mail(
                    subject,
                    plain_message,
                    settings.DEFAULT_FROM_EMAIL,
                    [request.user.email],
                    html_message=html_message,
                    fail_silently=False,
                )
                
                messages.success(request, 'Письмо с подтверждением отправлено повторно!')
            else:
                messages.error(request, 'У вас не указана электронная почта!')
            
            return redirect('core:profile#email-verification')
    else:
        form = CompanyProfileForm(instance=profile)
    
    return render(request, 'core/profile.html', {
        'form': form,
        'title': 'Профиль компании - Billify'
    })

# Добавляем новый маршрут для подтверждения электронной почты
@login_required
def verify_email(request, user_id):
    """Подтверждение электронной почты пользователя"""
    # Здесь должна быть логика для проверки токена и активации учетной записи
    # В простом примере просто активируем пользователя
    user = request.user
    if str(user.id) == str(user_id):
        user.is_active = True
        user.save()
        messages.success(request, 'Ваша электронная почта успешно подтверждена!')
    else:
        messages.error(request, 'Недействительная ссылка подтверждения!')
    
    return redirect('core:profile#email-verification')
