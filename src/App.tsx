import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import NewsPage from './pages/News';
import NewsDetail from './pages/NewsDetail';
import TournamentsPage from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import NewsForm from './pages/admin/NewsForm';
import TournamentForm from './pages/admin/TournamentForm';
import SmsLogPage from './pages/admin/SmsLogPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/news" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="tournaments/:id" element={<TournamentDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="admin/news/new" element={<NewsForm />} />
            <Route path="admin/news/:id/edit" element={<NewsForm />} />
            <Route path="admin/tournaments/new" element={<TournamentForm />} />
            <Route path="admin/tournaments/:id/edit" element={<TournamentForm />} />
            <Route path="admin/sms-log" element={<SmsLogPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
