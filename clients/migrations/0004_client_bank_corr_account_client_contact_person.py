# Generated by Django 5.2 on 2025-04-30 16:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients', '0003_client_entity_type_alter_client_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='bank_corr_account',
            field=models.CharField(blank=True, max_length=20, verbose_name='Корр. счет'),
        ),
        migrations.AddField(
            model_name='client',
            name='contact_person',
            field=models.CharField(blank=True, max_length=200, verbose_name='Контактное лицо'),
        ),
    ]
