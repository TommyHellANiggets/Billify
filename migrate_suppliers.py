import os
import sys
import django

# Настраиваем Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'billify.settings')
django.setup()

from suppliers.models import Supplier
from clients.models import Client
from django.contrib.auth import get_user_model

User = get_user_model()

def migrate_suppliers():
    """Мигрирует поставщиков из модели Supplier в модель Client"""
    print("Начинаем миграцию поставщиков...")
    
    # Получаем всех поставщиков
    suppliers = Supplier.objects.all()
    print(f"Найдено {suppliers.count()} поставщиков в модели Supplier")
    
    # Счетчики для статистики
    migrated_count = 0
    already_exists_count = 0
    error_count = 0
    
    for supplier in suppliers:
        # Проверяем, существует ли уже запись с таким именем и ИНН
        existing_client = Client.objects.filter(
            name=supplier.name, 
            tax_id=supplier.inn,
            entity_type='supplier'
        ).first()
        
        if existing_client:
            print(f"Пропускаем поставщика {supplier.name} - уже существует в модели Client")
            already_exists_count += 1
            continue
        
        # Определяем пользователя для поставщика
        user = None
        if hasattr(supplier, 'user') and supplier.user:
            user = supplier.user
        else:
            # Если пользователь не указан, берем первого суперпользователя
            user = User.objects.filter(is_superuser=True).first()
        
        if not user:
            print(f"Пропускаем поставщика {supplier.name} - не найден пользователь")
            error_count += 1
            continue
        
        # Создаем запись в модели Client
        client = Client(
            user=user,
            entity_type='supplier',  # Это поставщик
            type='business',  # По умолчанию юридическое лицо
            name=supplier.name,
            email=supplier.email or '',
            phone=supplier.phone or '',
            address=supplier.address or '',
            tax_id=supplier.inn or '',  # ИНН в модели Supplier соответствует tax_id в модели Client
            kpp=supplier.kpp or '',
            ogrn=supplier.ogrn or '',
            bank_name=supplier.bank_name or '',
            bank_account=supplier.bank_account or '',
            bank_bik=supplier.bank_bik or '',
            bank_corr_account=supplier.bank_corr_account or '',
            contact_person=supplier.contact_person or '',
            contact_email=supplier.contact_email or '',
            is_active=True
        )
        
        try:
            client.save()
            print(f"Перенесен поставщик: {supplier.name}")
            migrated_count += 1
        except Exception as e:
            print(f"Ошибка при переносе поставщика {supplier.name}: {str(e)}")
            error_count += 1
    
    print("\nМиграция завершена:")
    print(f"Перенесено: {migrated_count}")
    print(f"Уже существует: {already_exists_count}")
    print(f"Ошибки: {error_count}")
    print(f"Всего в модели Client с типом 'supplier': {Client.objects.filter(entity_type='supplier').count()}")

if __name__ == "__main__":
    migrate_suppliers() 