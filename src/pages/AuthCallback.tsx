import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type { User } from '../types';

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

        localStorage.setItem('access_token', token);
        const { data: me } = await apiClient.get<User>('/api/users/me');
        login(token, refresh, {
          id: me.id,
          username: me.username,
          firstName: me.firstName,
          lastName: me.lastName,
          isAdmin: me.isAdmin,
          isVerified: me.isVerified,
          photo: me.photo,
        });
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
