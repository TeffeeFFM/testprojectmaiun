from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Difficulty(models.IntegerChoices):
    EASY = 1, 'Легкая'
    MEDIUM = 2, 'Средняя'
    HARD = 3, 'Сложная'

class Problem(models.Model):
    title = models.CharField('Название', max_length=200)
    description = models.TextField('Условие задачи')
    input_format = models.TextField('Формат ввода', blank=True)
    output_format = models.TextField('Формат вывода', blank=True)
    examples = models.JSONField('Примеры', default=list)  # [{"input": "...", "output": "..."}]
    difficulty = models.PositiveSmallIntegerField('Сложность', choices=Difficulty.choices, default=Difficulty.MEDIUM)
    tags = models.CharField('Теги', max_length=200, blank=True)  # или ManyToMany с отдельной моделью Tag
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'

    def __str__(self):
        return self.title