from django.core.management.base import BaseCommand
from core.models import PricingPlan

class Command(BaseCommand):
    help = 'Инициализация тарифных планов'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Начало инициализации тарифных планов...'))
        
        # Удаляем существующие планы
        PricingPlan.objects.all().delete()
        
        # Создаем базовый план (бесплатный)
        basic_plan = PricingPlan.objects.create(
            name='Базовый',
            plan_type='basic',
            price=0,
            subscription_period='month',
            is_popular=False,
            is_active=True,
            order=1,
            max_clients=5,
            max_disk_space=50,
            feature_unlimited_documents=True,
            feature_watermark_pdf=True,  # С водяным знаком
            feature_notifications=False,
            feature_ocr=False,
            feature_advanced_analytics=False,
            feature_support=False
        )
        
        # Создаем продвинутый план
        premium_plan = PricingPlan.objects.create(
            name='Продвинутый',
            plan_type='premium',
            price=990,
            subscription_period='month',
            is_popular=True,
            is_active=True,
            order=2,
            max_clients=0,  # Без ограничений
            max_disk_space=1000,  # 1 ГБ
            feature_unlimited_documents=True,
            feature_watermark_pdf=False,  # Без водяного знака
            feature_notifications=True,
            feature_ocr=True,
            feature_advanced_analytics=True,
            feature_support=True
        )
        
        # Создаем варианты продвинутого плана с другими периодами
        premium_week = PricingPlan.objects.create(
            name='Продвинутый (неделя)',
            plan_type='premium',
            price=290,
            subscription_period='week',
            is_popular=False,
            is_active=True,
            order=3,
            max_clients=0,
            max_disk_space=1000,
            feature_unlimited_documents=True,
            feature_watermark_pdf=False,
            feature_notifications=True,
            feature_ocr=True,
            feature_advanced_analytics=True,
            feature_support=True
        )
        
        premium_quarter = PricingPlan.objects.create(
            name='Продвинутый (3 месяца)',
            plan_type='premium',
            price=2690,
            subscription_period='quarter',
            is_popular=False,
            is_active=True,
            order=4,
            max_clients=0,
            max_disk_space=1000,
            feature_unlimited_documents=True,
            feature_watermark_pdf=False,
            feature_notifications=True,
            feature_ocr=True,
            feature_advanced_analytics=True,
            feature_support=True
        )
        
        premium_half_year = PricingPlan.objects.create(
            name='Продвинутый (6 месяцев)',
            plan_type='premium',
            price=4990,
            subscription_period='half_year',
            is_popular=False,
            is_active=True,
            order=5,
            max_clients=0,
            max_disk_space=1000,
            feature_unlimited_documents=True,
            feature_watermark_pdf=False,
            feature_notifications=True,
            feature_ocr=True,
            feature_advanced_analytics=True,
            feature_support=True
        )
        
        premium_year = PricingPlan.objects.create(
            name='Продвинутый (год)',
            plan_type='premium',
            price=9490,
            subscription_period='year',
            is_popular=False,
            is_active=True,
            order=6,
            max_clients=0,
            max_disk_space=1000,
            feature_unlimited_documents=True,
            feature_watermark_pdf=False,
            feature_notifications=True,
            feature_ocr=True,
            feature_advanced_analytics=True,
            feature_support=True
        )
        
        self.stdout.write(self.style.SUCCESS('Тарифные планы успешно созданы:'))
        self.stdout.write(f'- {basic_plan.name}: {basic_plan.price} руб.')
        self.stdout.write(f'- {premium_plan.name}: {premium_plan.price} руб. за месяц')
        self.stdout.write(f'- {premium_week.name}: {premium_week.price} руб.')
        self.stdout.write(f'- {premium_quarter.name}: {premium_quarter.price} руб.')
        self.stdout.write(f'- {premium_half_year.name}: {premium_half_year.price} руб.')
        self.stdout.write(f'- {premium_year.name}: {premium_year.price} руб.') 