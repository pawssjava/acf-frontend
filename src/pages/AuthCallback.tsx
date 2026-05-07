import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicClient } from '../api/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) { navigate('/login'); return; }

    const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
    const realm = import.meta.env.VITE_KEYCLOAK_REALM;
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
    const redirectUri = window.location.origin + '/auth/callback';

    if (!keycloakUrl || !realm || !clientId) { navigate('/login'); return; }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
    });

    fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
      .then(r => r.json())
      .then(async (data) => {
        if (!data.access_token) throw new Error('No token');
        const token: string = data.access_token;
        const refresh: string = data.refresh_token ?? '';

        const payload = JSON.parse(atob(token.split('.')[1]));
        const username: string = payload.preferred_username ?? '';

        localStorage.setItem('access_token', token);
        const usersRes = await publicClient.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = usersRes.data as Array<{ id: number; username: string; firstName: string; lastName: string; isAdmin: boolean; photo: string | null }>;
        const match = users.find(u => u.username === username);
        if (match) {
          login(token, refresh, { id: match.id, username: match.username, firstName: match.firstName, lastName: match.lastName, isAdmin: match.isAdmin, photo: match.photo });
        }
        navigate('/');
      })
      .catch(() => navigate('/login'));
  }, [login, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)' }}>
      Выполняем вход...
    </div>
  );
}
