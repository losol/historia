# Generated by Django 4.2.3 on 2023-07-19 00:50

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_licensesnippet'),
        ('standardpage', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='standardpage',
            name='license',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to='core.licensesnippet'),
        ),
    ]
