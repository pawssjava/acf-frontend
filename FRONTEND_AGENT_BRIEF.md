# ACF Frontend — Agent Brief

Build a **React + TypeScript** frontend for the **Academy of Cyber Football** platform.

---

## Base URL

```
http://localhost:9002
```

Swagger UI (for reference): `http://localhost:9002/swagger-ui/index.html`

---

## Data Models (TypeScript)

```ts
interface User {
  id: number;
  username: string;
  phoneNumber: number;
  firstName: string;
  lastName: string;
  birthDate: string;        // ISO date "YYYY-MM-DD"
  isAdmin: boolean;
  photo: string | null;
  createdDate: string;      // ISO timestamp
  updatedDate: string;
}

interface News {
  id: number;
  title: string;
  description: string;
  image: string | null;
  createdDate: string;
  updatedDate: string;
}

interface Tournament {
  id: number;
  name: string;
  logo: string | null;
  startDate: string;        // ISO date "YYYY-MM-DD"
  capacity: number;
  prizeMoney: number;
  tournamentStatusId: number;
  tournamentStatusName: string;
  tournamentTypeId: number;
  tournamentTypeName: string;
  createdDate: string;
  updatedDate: string;
}

interface Participant {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  registeredDate: string;
}

interface TournamentResult {
  id: number;
  tournamentId: number;
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  place: number;
  score: number;
  createdDate: string;
}

interface DictionaryItem {
  id: number;
  name: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}
```

---

## Endpoints

### Authentication

#### Send SMS code
```
POST /api/auth/send-sms
```
Request:
```json
{ "phone": "77001234567" }
```
Response: `200 OK` (no body)

> For testing, the code is always `1111`.

---

#### Register new user
```
POST /api/auth/register
```
Request:
```json
{
  "phone": "77001234567",
  "code": "1111",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "2000-05-15"
}
```
Response: `201 Created` → `User`

Errors:
- `400` — wrong SMS code

---

### Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List all users → `User[]` |
| `GET` | `/api/users/{id}` | Get user by ID → `User` |
| `PUT` | `/api/users/{id}` | Update profile → `User` |
| `DELETE` | `/api/users/{id}` | Delete user → `204` |

#### PUT /api/users/{id} request body
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "birthDate": "2000-05-15",
  "photo": "https://..."
}
```

---

### News

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/news` | List all articles (newest first) → `News[]` |
| `GET` | `/api/news/{id}` | Get article by ID → `News` |
| `POST` | `/api/news` | Create article → `201 News` |
| `PUT` | `/api/news/{id}` | Update article → `News` |
| `DELETE` | `/api/news/{id}` | Delete article → `204` |

#### POST / PUT request body
```json
{
  "title": "Article title",
  "description": "Full article text"
}
```

---

### Tournaments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tournaments` | List all (newest first, status+type names included) → `Tournament[]` |
| `GET` | `/api/tournaments/{id}` | Get by ID → `Tournament` |
| `POST` | `/api/tournaments` | Create → `201 Tournament` |
| `PUT` | `/api/tournaments/{id}` | Update → `Tournament` |
| `DELETE` | `/api/tournaments/{id}` | Delete → `204` |

#### POST / PUT request body
```json
{
  "name": "Spring Cup 2025",
  "logo": "https://...",
  "startDate": "2025-06-01",
  "capacity": 32,
  "prizeMoney": 500000,
  "tournamentStatusId": 1,
  "tournamentTypeId": 2
}
```

> `tournamentStatusId` and `tournamentTypeId` come from the dictionary endpoints below.

---

### Tournament Participants

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tournaments/{tournamentId}/participants` | List participants → `Participant[]` |
| `POST` | `/api/tournaments/{tournamentId}/participants` | Register user → `201 Participant` |
| `DELETE` | `/api/tournaments/{tournamentId}/participants/{userId}` | Unregister user → `204` |

#### POST request body
```json
{ "userId": 5 }
```

Errors:
- `400` — tournament is full (capacity reached)
- `404` — tournament or user not found

---

### Tournament Results

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tournaments/{tournamentId}/results` | Get results (ordered by place) → `TournamentResult[]` |
| `POST` | `/api/tournaments/{tournamentId}/results` | Add result → `201 TournamentResult` |
| `PUT` | `/api/tournaments/{tournamentId}/results/{userId}` | Update result → `TournamentResult` |
| `DELETE` | `/api/tournaments/{tournamentId}/results/{userId}` | Delete result → `204` |

#### POST / PUT request body
```json
{
  "userId": 5,
  "place": 1,
  "score": 9.75
}
```

---

### Dictionaries

Both follow the same shape (`DictionaryItem`).

#### Tournament Types
| Method | Path |
|--------|------|
| `GET` | `/api/dictionary/tournament-types` |
| `GET` | `/api/dictionary/tournament-types/{id}` |
| `POST` | `/api/dictionary/tournament-types` |
| `PUT` | `/api/dictionary/tournament-types/{id}` |
| `DELETE` | `/api/dictionary/tournament-types/{id}` |

Pre-seeded values: `Региональные турниры`, `Социальная лига`, `Школьная лига`, `Студенческая лига`

#### Tournament Statuses
| Method | Path |
|--------|------|
| `GET` | `/api/dictionary/tournament-statuses` |
| `GET` | `/api/dictionary/tournament-statuses/{id}` |
| `POST` | `/api/dictionary/tournament-statuses` |
| `PUT` | `/api/dictionary/tournament-statuses/{id}` |
| `DELETE` | `/api/dictionary/tournament-statuses/{id}` |

Pre-seeded values: `Активные`, `Будущие`, `Завершенные`

#### POST / PUT request body (both dictionaries)
```json
{
  "name": "Новый тип",
  "isActive": true
}
```

---

## Error shape

All error responses from Spring follow:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Tournament not found",
  "path": "/api/tournaments/99"
}
```

---

## Authentication — Keycloak + Bearer JWT

The backend is an **OAuth2 Resource Server** that validates JWTs issued by Keycloak.

### Which endpoints are public (no token needed)

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/send-sms` | Registration step 1 |
| `POST /api/auth/register` | Registration step 2 |
| `GET /api/news` | News visible to all visitors |
| `GET /api/news/{id}` | News visible to all visitors |
| `GET /swagger-ui/**` | Developer tooling |

**Every other endpoint requires a valid Bearer token.**

### How to obtain a token (Keycloak)

The frontend must redirect the user to the Keycloak login page (Authorization Code flow) and exchange the code for tokens. Exact Keycloak URLs (realm, client ID) are configured server-side — ask the backend team or check `application.yaml`.

Recommended library: [`keycloak-js`](https://www.npmjs.com/package/keycloak-js) or any OIDC client such as `oidc-client-ts`.

```ts
// Minimal keycloak-js bootstrap
import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'https://<keycloak-host>',
  realm: '<realm>',
  clientId: '<client-id>',
});

await keycloak.init({ onLoad: 'login-required' });
```

### How to attach the token to API requests

Add the `Authorization` header to every authenticated request:

```ts
const apiClient = axios.create({ baseURL: 'http://localhost:9002' });

apiClient.interceptors.request.use(config => {
  const token = keycloak.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token before it expires
apiClient.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await keycloak.updateToken(30);
      err.config.headers.Authorization = `Bearer ${keycloak.token}`;
      return apiClient.request(err.config);
    }
    return Promise.reject(err);
  }
);
```

Use `apiClient` for authenticated calls. For public endpoints (`/api/news`, `/api/auth/**`) a plain `fetch` or unauthenticated axios instance works fine.

### Token expiry

Keycloak tokens expire (typically 5 minutes). Call `keycloak.updateToken(minValidity)` before sensitive actions or use the response interceptor pattern above.

---

## Notes for the frontend agent

- All timestamps are **ISO 8601** with timezone offset (`OffsetDateTime`). Use `new Date(str)` or a library like `date-fns`.
- `birthDate` and `startDate` are plain dates (`YYYY-MM-DD`), no time component.
- `prizeMoney` and `score` are decimals — format with `toLocaleString()` where displayed.
- The registration flow is two steps: **send-sms → register**. Store nothing on the backend between steps; the SMS code lives in server memory.
- Tournament list already includes `tournamentStatusName` and `tournamentTypeName` — no extra lookups needed for display.
- Dictionary endpoints are used to populate `<select>` dropdowns when creating/editing tournaments.
- News read endpoints (`GET /api/news`, `GET /api/news/{id}`) are open — render them for unauthenticated visitors. All write operations on news require a token.
- A `401 Unauthorized` from any endpoint means the token is missing or expired — redirect to Keycloak login.
