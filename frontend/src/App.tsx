import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import './App.css';

const Home = lazy(() => import('./pages/Home/Home'));
const ProblemsPage = lazy(() => import('./pages/Problems/ProblemsPage'));
const ProblemDetailPage = lazy(() => import('./pages/ProblemDetail/ProblemDetail'));
const ProfilePage = lazy(() => import('./pages/Profile/Profile'));
const Login = lazy(() => import('./pages/Login/LoginPage'));
const Register = lazy(() => import('./pages/Register/RegisterPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Header />

          <main className="main-content">
            <Suspense fallback={<div className="loader">Загрузка страницы...</div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/problems" element={<ProblemsPage />} />
                <Route path="/problems/:id" element={<ProblemDetailPage />} />

                {/*
                  Профиль теперь открыт как отдельная страница:
                  - если пользователь авторизован, он увидит свой профиль;
                  - если нет, страница покажет блок с предложением войти.
                  Это делает вкладки "Профиль" и "Вход" разными по смыслу.
                */}
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <p>Извините, запрошенная страница не существует.</p>
      <a href="/" className="back-home-btn">
        Вернуться на главную
      </a>
    </div>
  );
};

export default App;
