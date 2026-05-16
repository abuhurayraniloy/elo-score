# Frontend Integration Guide - Elo Image Ranking API

This document provides instructions and examples for the frontend engineering team on how to interact with the Elo Image Ranking backend API.

## Base Configuration

- **Base URL**: `http://127.0.0.1:8000` (Update this based on the deployment environment)
- **Content-Type**: Except for the login endpoint, all requests that send data should use `application/json`.
- **Authorization**: The API uses JWT Bearer tokens. Include the token in the headers for protected routes:
  `Authorization: Bearer <your_access_token>`

## Image Assets

Images are served directly from the backend via the `/static/` mount. 
When the API returns an `image_url` (e.g., `/static/image1.jpg`), you should prepend the Base URL to render it on the frontend:
`<img src="http://127.0.0.1:8000/static/image1.jpg" />`

---

## 1. Authentication

### Register a New User
Create a new user account.

- **Endpoint**: `POST /api/auth/register`
- **Protected**: No
- **Request Body (JSON)**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword123"
}
```
- **Response**: `200 OK` (Returns the created user object)

### Login (Get Access Token)
Authenticate and receive a JWT token. This token lasts for 30 minutes by default.

- **Endpoint**: `POST /api/auth/login`
- **Protected**: No
- **Request Body (Form Data - `application/x-www-form-urlencoded`)**:
  - `username`: "newuser" (Can be username OR email)
  - `password`: "securepassword123"
> **Important:** Do NOT send JSON to this endpoint. It must be Form Data.

- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer"
}
```

---

## 2. Core Game Logic

### Get the Next Match
Fetches two photos for the authenticated user to vote on. The matchmaking logic ensures the user hasn't seen this pair before, and tries to match photos with similar Elo ratings.

- **Endpoint**: `GET /api/next-match`
- **Protected**: Yes (Requires Bearer Token)
- **Response**: `200 OK`
```json
{
  "photo_a": {
    "id": 14,
    "image_url": "/static/sunset.jpg"
  },
  "photo_b": {
    "id": 3,
    "image_url": "/static/mountain.jpg"
  }
}
```
> **Note:** If the user has voted on all possible combinations, this returns a `404 Not Found` with the message "No more matches available to vote on".

### Submit a Vote
Cast a vote for the winning photo. This updates the Elo ratings for both photos in the database.

- **Endpoint**: `POST /api/submit-vote`
- **Protected**: Yes (Requires Bearer Token)
- **Request Body (JSON)**:
```json
{
  "photo_a_id": 14,
  "photo_b_id": 3,
  "winner_id": 14
}
```
- **Response**: `200 OK`
```json
{
  "detail": "Vote submitted successfully"
}
```

---

## 3. Leaderboard

### Get the Leaderboard
Fetches all photos in the database, ordered by their Elo rating from highest to lowest.

- **Endpoint**: `GET /api/leaderboard`
- **Protected**: No (Publicly accessible)
- **Response**: `200 OK`
```json
[
  {
    "id": 14,
    "image_url": "/static/sunset.jpg",
    "elo_rating": 1215.5,
    "matches_played": 1
  },
  {
    "id": 8,
    "image_url": "/static/city.jpg",
    "elo_rating": 1200.0,
    "matches_played": 0
  },
  {
    "id": 3,
    "image_url": "/static/mountain.jpg",
    "elo_rating": 1184.5,
    "matches_played": 1
  }
]
```

---

## Quick Setup for Frontend Devs

1. Ask the backend engineer for the test credentials, or use the `POST /api/auth/register` endpoint to create a user.
2. Obtain a token via `POST /api/auth/login`.
3. Save the token to `localStorage` or memory, and attach it to the `Authorization` header for the `/api/next-match` and `/api/submit-vote` requests.
4. Render the leaderboard publicly using `/api/leaderboard`.
