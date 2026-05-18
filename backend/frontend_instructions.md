# Frontend Integration Guide - Elo Tournament API

This document provides instructions and endpoints for the frontend engineering team on how to interact with the Elo Tournament & Admin backend API.

## Base Configuration

- **Base URL**: `http://127.0.0.1:8000` (Update this based on the deployment environment)
- **Content-Type**: Except for the login and upload endpoints, all requests that send data should use `application/json`.
- **Authorization**: The API uses JWT Bearer tokens. Include the token in the headers for protected routes:
  `Authorization: Bearer <your_access_token>`

## Image Assets

Images are served directly from the backend via the `/static/` mount. 
When the API returns an `image_url` (e.g., `/static/image1.jpg`), you should prepend the Base URL to render it on the frontend:
`<img src="http://127.0.0.1:8000/static/image1.jpg" />`

---

## 1. Authentication & Users

### Register a New User
Create a new user account.
- **Endpoint**: `POST /api/auth/register`
- **Protected**: No
- **Request Body (JSON)**: `{"username": "newuser", "email": "newuser@example.com", "password": "securepassword123"}`

### Login (Get Access Token)
Authenticate and receive a JWT token.
- **Endpoint**: `POST /api/auth/login`
- **Protected**: No
- **Request Body (Form Data)**: `username` and `password`
> **Important:** Do NOT send JSON to this endpoint. It must be `application/x-www-form-urlencoded`.

### Verify Email
Verify a user account using a token.
- **Endpoint**: `GET /api/auth/verify?token=<token>`

---

## 2. Tournament Logic

### Get Tournament Bracket
Fetches the entire 31-match tournament tree (Rounds 1 through 5).
- **Endpoint**: `GET /api/tournament/bracket`
- **Protected**: Yes (Requires Bearer Token)
- **Response**: Array of match objects including `photo_a`, `photo_b`, `votes_a`, `votes_b`, `is_active`, and `has_voted`.

### Submit a Tournament Vote
Cast a vote for a specific photo in an active tournament match.
- **Endpoint**: `POST /api/tournament/vote`
- **Protected**: Yes
- **Request Body (JSON)**:
```json
{
  "tournament_match_id": 15,
  "selected_photo_id": 4
}
```

---

## 3. Admin & System Management

All endpoints below require the authenticated user to have `"role": "admin"`.

### Dashboard Stats
- **Endpoint**: `GET /api/admin/stats`
- **Response**: Summary counts for users, photos, matches, and votes.

### User Management
- **Get Users**: `GET /api/admin/users`
- **Update Role**: `PATCH /api/admin/users/{id}` (Body: `{"role": "admin"}`)
- **Update Approval**: `PATCH /api/admin/users/{id}/approval` (Body: `{"can_vote": true}`)
- **Delete User**: `DELETE /api/admin/users/{id}`
- **Bulk Delete**: `POST /api/admin/users/bulk-delete` (Body: `{"user_ids": [1, 2]}`)

### Photo Management
- **Get Photos**: `GET /api/admin/photos`
- **Upload Photo**: `POST /api/admin/upload-image` (Uses `multipart/form-data` with `file`)
- **Update Photo**: `PATCH /api/admin/photos/{id}` (Body: fields to update)
- **Delete Photo**: `DELETE /api/admin/photos/{id}`

### System Settings
- **Get Settings**: `GET /api/admin/settings`
- **Update Setting**: `POST /api/admin/settings/{key}` (Body: `{"value": "new_value"}`)

### Tournament Management
- **Advance Round**: `POST /api/tournament/advance`
  - *Freezes current round voting and advances winners to the next bracket tier.*
- **Reset Bracket**: `POST /api/tournament/reset`
  - *Clears tournament votes and restarts the bracket from Round of 32 using system photos.*
- **Factory Reset System**: `POST /api/tournament/hard-reset`
  - *DANGER: Resets ALL photos back to 1200 Elo, clears all standard and tournament matches.*

---

## Quick Setup for Frontend Devs

1. Register via `/api/auth/register` or login as `sensei` (admin).
2. Obtain a token via `POST /api/auth/login`.
3. Save the token to `localStorage` and attach it to the `Authorization` header for all requests using the `getAuthHeaders()` utility in `src/lib/api.js`.
4. Use the predefined functions in `src/lib/api.js` to interface with these endpoints seamlessly in React components.
