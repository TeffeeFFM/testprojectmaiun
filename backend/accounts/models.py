"""
Содержит три модели данных:
- CustomUser   — расширенная модель пользователя с авторизацией по email
- Profile      — расширенная информация о пользователе (аватар, биография, статистика)
- Solution     — запись о решении задачи конкретным пользователем

Схема связей между моделями:
  CustomUser  ──1:1──  Profile  ──1:N──  Solution  ──N:1──  Problem
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver


# ============================================================
# МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ
# ============================================================

class CustomUser(AbstractUser):
    """
    Расширенная модель пользователя.

    Наследуется от AbstractUser, который содержит стандартные поля:
    username, first_name, last_name, is_active, is_staff, date_joined и др.

    Вносится два ключевых изменения:
    1. Поле email становится уникальным и обязательным.
    2. Email используется в качестве основного идентификатора для входа вместо username.
    """

    email = models.EmailField(
        unique=True,
        verbose_name='Email'
    )

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


# ============================================================
# ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
# ============================================================

class Profile(models.Model):
    """
    Профиль пользователя, содержащий дополнительную информацию.

    Связь с CustomUser организована через OneToOneField:
    каждому пользователю соответствует ровно один профиль.

    Создание профиля происходит автоматически через сигнал (описан ниже).
    """

    user = models.OneToOneField(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Пользователь'
    )

    solved_problems = models.ManyToManyField(
        'problems.Problem',
        through='accounts.Solution',
        through_fields=('profile', 'problem'),
        related_name='solved_by',
        blank=True,
        verbose_name='Решённые задачи'
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name='Аватар'
    )

    bio = models.TextField(
        max_length=500,
        blank=True,
        verbose_name='О себе'
    )

    def __str__(self):
        return f"Профиль: {self.user.email}"

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'


# ============================================================
# МОДЕЛЬ РЕШЕНИЯ ЗАДАЧИ
# ============================================================

class Solution(models.Model):
    """
    Фиксирует факт отправки решения задачи пользователем.

    Каждая запись соответствует одному решению: пользователь → задача.
    """

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='solutions',
        verbose_name='Профиль'
    )

    problem = models.ForeignKey(
        'problems.Problem',
        on_delete=models.CASCADE,
        related_name='solutions',
        verbose_name='Задача'
    )

    code = models.TextField(verbose_name='Код решения')

    is_correct = models.BooleanField(
        default=False,
        verbose_name='Тесты пройдены'
    )

    score = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name='Оценка AI'
    )

    feedback = models.TextField(
        blank=True,
        verbose_name='Комментарий AI'
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата отправки'
    )

    class Meta:
        verbose_name = 'Решение'
        verbose_name_plural = 'Решения'
        ordering = ['-submitted_at']
        unique_together = ['profile', 'problem']

    def __str__(self):
        status = '✅' if self.is_correct else '❌'
        return f"{status} {self.profile.user.email} — {self.problem.title}"

    @property
    def user(self):
        """Возвращает пользователя, связанного с решением, через профиль."""
        return self.profile.user


# ============================================================
# СИГНАЛЫ
#
# Сигналы позволяют автоматически выполнять код при определённых событиях.
# post_save срабатывает после сохранения объекта в базу данных.
#
# В данном случае сигнал используется для автоматического создания профиля
# при регистрации нового пользователя.
# ============================================================

@receiver(post_save, sender=CustomUser)
def create_or_save_user_profile(sender, instance, created, **kwargs):
    """
    Создаёт или сохраняет профиль при сохранении пользователя.

    Параметры:
        sender   — класс модели (CustomUser)
        instance — сохранённый объект пользователя
        created  — True при первом создании объекта, False при обновлении
        **kwargs — дополнительные аргументы
    """
    if created:
        Profile.objects.create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()