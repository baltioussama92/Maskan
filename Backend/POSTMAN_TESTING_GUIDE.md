# Postman Testing Guide - House Rental Backend

## 1) Environment Setup
Create a Postman environment with:
- `baseUrl` = `https://maskan-xzpw.onrender.com`
- `token` = empty (will be set after login)
- `listingId` = empty (set after create listing)

## 2) Register Request
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/register`

Body (raw JSON):
```json
{
  "fullName": "Host User",
  "email": "host@test.com",
  "password": "password123",
  "role": "HOST"
}
```

Expected:
- Status: `201`
- Response contains `token`

## 3) Login Request
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/login`

Body:
```json
{
  "email": "host@test.com",
  "password": "password123"
}
```

Expected:
- Status: `200`
- Copy `token` from response into environment variable `token`

## 4) Create Listing (HOST)
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/listings`

Headers:
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

Body:
```json
{
  "title": "Ocean View Apartment",
  "description": "Beautiful apartment with sea view",
  "pricePerNight": 120,
  "location": "Rabat",
  "images": [
    "https://img.example.com/ocean-1.jpg"
  ]
}
```

Expected:
- Status: `201`
- Save returned `id` as `listingId`

## 5) Book Property (GUEST)
Create/login a `GUEST` account first and store guest token in `token`.

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/bookings`

Headers:
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

Body:
```json
{
  "listingId": "{{listingId}}",
  "checkInDate": "2026-04-10",
  "checkOutDate": "2026-04-15"
}
```

Expected:
- Status: `200`
- `status` in response = `PENDING`

## 6) Leave Review
**Method:** `POST`  
**URL:** `{{baseUrl}}/api/reviews`

Headers:
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

Body:
```json
{
  "listingId": "{{listingId}}",
  "rating": 5,
  "comment": "Excellent place and host"
}
```

Expected:
- Status: `200`
- Review object returned with `listingId`

## 7) Useful Additional Checks
- `GET {{baseUrl}}/api/messages/inbox`
- `GET {{baseUrl}}/api/messages/sent`
- `GET {{baseUrl}}/api/bookings/me`
- `GET {{baseUrl}}/api/reviews/listing/{{listingId}}`

## 8) Auth Header Reminder
For protected routes, always include:

```http
Authorization: Bearer {{token}}
```
