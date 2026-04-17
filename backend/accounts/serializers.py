from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Profile, Solution

class CustomUserSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения данных пользователя."""
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email')

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации нового пользователя."""
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'password1', 'password2')

    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError("Пароли не совпадают!")
        
        password = attrs.get('password1', '')
        if len(password) < 8:
            raise serializers.ValidationError("Пароль должен содержать минимум 8 символов!")
        
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password1')
        validated_data.pop('password2')
        return CustomUser.objects.create_user(password=password, **validated_data)

class UserLoginSerializer(serializers.Serializer):
    """Сериализатор для входа пользователя."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Неверные учетные данные!")

class SolutionSerializer(serializers.ModelSerializer):
    """Сериализатор для отображения решения задачи."""
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    
    class Meta:
        model = Solution
        fields = ('id', 'problem', 'problem_title', 'code', 'is_correct', 'score', 'feedback', 'submitted_at')
        read_only_fields = ('submitted_at',)

class ProfileSerializer(serializers.ModelSerializer):
    """Сериализатор профиля пользователя с дополнительной статистикой."""
    user = CustomUserSerializer(read_only=True)
    solved_count = serializers.SerializerMethodField()
    recent_solutions = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ('user', 'avatar', 'bio', 'solved_count', 'recent_solutions')

    def get_solved_count(self, obj):
        return obj.solutions.filter(is_correct=True).count()

    def get_recent_solutions(self, obj):
        # последние 5 решений
        solutions = obj.solutions.order_by('-submitted_at')[:5]
        return SolutionSerializer(solutions, many=True).data