# Road Trip Buddy API Tests

This document contains API test examples using curl, httpie, and other tools.

## Prerequisites

1. Start the backend server:
```bash
cd road-trip-backend
cargo run
```

2. The server should be running on `http://localhost:3000`

3. Make sure you have PostgreSQL running and migrations applied

## Base URL

```
http://localhost:3000
```

## Authentication Flow

All protected endpoints require HTTP-only cookies set after login/register.

---

## 1. Health Check

### GET /api/health

**curl:**
```bash
curl -X GET http://localhost:3000/api/health
```

**httpie:**
```bash
http GET localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Road Trip Buddy API is running"
}
```

---

## 2. Authentication

### 2.1 Register User

**POST /api/auth/register**

**curl:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }' \
  -c cookies.txt \
  -v
```

**httpie:**
```bash
http POST localhost:3000/api/auth/register \
  name="John Doe" \
  email="john@example.com" \
  password="password123" \
  --session=cookies
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": null,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**Note:** Cookie is automatically set and stored in `cookies.txt`

---

### 2.2 Login

**POST /api/auth/login**

**curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' \
  -c cookies.txt \
  -v
```

**httpie:**
```bash
http POST localhost:3000/api/auth/login \
  email="john@example.com" \
  password="password123" \
  --session=cookies
```

**Expected Response:** Same as register

---

### 2.3 Get Current User

**GET /api/auth/me**

**curl:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt \
  -v
```

**httpie:**
```bash
http GET localhost:3000/api/auth/me --session=cookies
```

---

### 2.4 Logout

**POST /api/auth/logout**

**curl:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

**httpie:**
```bash
http POST localhost:3000/api/auth/logout --session=cookies
```

---

## 3. Rooms

### 3.1 Create Room

**POST /api/rooms**

**curl:**
```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Road Trip to Beach",
    "description": "Weekend trip to the beach"
  }' \
  -b cookies.txt \
  -v
```

**httpie:**
```bash
http POST localhost:3000/api/rooms \
  name="Road Trip to Beach" \
  description="Weekend trip to the beach" \
  --session=cookies
```

**Expected Response:**
```json
{
  "id": "room-uuid",
  "name": "Road Trip to Beach",
  "description": "Weekend trip to the beach",
  "created_by": "user-uuid",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "is_active": true
}
```

**Save the room_id for next requests:**
```bash
export ROOM_ID="room-uuid-here"
```

---

### 3.2 Get User Rooms

**GET /api/rooms**

**curl:**
```bash
curl -X GET http://localhost:3000/api/rooms \
  -b cookies.txt
```

**httpie:**
```bash
http GET localhost:3000/api/rooms --session=cookies
```

---

### 3.3 Join Room

**POST /api/rooms/join**

**curl:**
```bash
curl -X POST http://localhost:3000/api/rooms/join \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "room-uuid-here"
  }' \
  -b cookies.txt
```

**httpie:**
```bash
http POST localhost:3000/api/rooms/join \
  room_id="room-uuid-here" \
  --session=cookies
```

---

### 3.4 Get Room Members

**GET /api/rooms/:room_id/members**

**curl:**
```bash
curl -X GET http://localhost:3000/api/rooms/${ROOM_ID}/members \
  -b cookies.txt
```

**httpie:**
```bash
http GET localhost:3000/api/rooms/${ROOM_ID}/members --session=cookies
```

---

## 4. Messages

### 4.1 Send Text Message

**POST /api/rooms/:room_id/messages**

**curl:**
```bash
curl -X POST http://localhost:3000/api/rooms/${ROOM_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello everyone! Let'\''s meet at the parking lot.",
    "message_type": "text"
  }' \
  -b cookies.txt
```

**httpie:**
```bash
http POST localhost:3000/api/rooms/${ROOM_ID}/messages \
  text="Hello everyone!" \
  message_type="text" \
  --session=cookies
```

---

### 4.2 Send Image Message

**POST /api/rooms/:room_id/messages**

**curl:**
```bash
curl -X POST http://localhost:3000/api/rooms/${ROOM_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg",
    "message_type": "image"
  }' \
  -b cookies.txt
```

---

### 4.3 Get Messages

**GET /api/rooms/:room_id/messages**

**curl:**
```bash
curl -X GET "http://localhost:3000/api/rooms/${ROOM_ID}/messages?page=0&page_size=20" \
  -b cookies.txt
```

**httpie:**
```bash
http GET localhost:3000/api/rooms/${ROOM_ID}/messages \
  page==0 \
  page_size==20 \
  --session=cookies
```

**Query Parameters:**
- `page` (optional, default: 0) - Page number
- `page_size` (optional, default: 20) - Items per page

**Expected Response:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "room_id": "room-uuid",
      "user_id": "user-uuid",
      "text": "Hello everyone!",
      "image_url": null,
      "message_type": "text",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total_pages": 1,
  "current_page": 0
}
```

---

## 5. Locations

### 5.1 Update Location

**POST /api/rooms/:room_id/location**

**curl:**
```bash
curl -X POST http://localhost:3000/api/rooms/${ROOM_ID}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.7563,
    "longitude": 100.5018
  }' \
  -b cookies.txt
```

**httpie:**
```bash
http POST localhost:3000/api/rooms/${ROOM_ID}/location \
  latitude:=13.7563 \
  longitude:=100.5018 \
  --session=cookies
```

**Expected Response:**
```json
{
  "id": "location-uuid",
  "user_id": "user-uuid",
  "room_id": "room-uuid",
  "latitude": 13.7563,
  "longitude": 100.5018,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 5.2 Get Locations

**GET /api/rooms/:room_id/locations**

**curl:**
```bash
curl -X GET http://localhost:3000/api/rooms/${ROOM_ID}/locations \
  -b cookies.txt
```

**httpie:**
```bash
http GET localhost:3000/api/rooms/${ROOM_ID}/locations --session=cookies
```

**Expected Response:**
```json
{
  "locations": [
    {
      "id": "location-uuid",
      "user_id": "user-uuid",
      "room_id": "room-uuid",
      "latitude": 13.7563,
      "longitude": 100.5018,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## Complete Test Flow Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="cookies.txt"

echo "=== 1. Health Check ==="
curl -s -X GET ${BASE_URL}/api/health | jq

echo -e "\n=== 2. Register User ==="
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c ${COOKIE_FILE})

echo $REGISTER_RESPONSE | jq

echo -e "\n=== 3. Get Current User ==="
curl -s -X GET ${BASE_URL}/api/auth/me \
  -b ${COOKIE_FILE} | jq

echo -e "\n=== 4. Create Room ==="
ROOM_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Room",
    "description": "Test Description"
  }' \
  -b ${COOKIE_FILE})

echo $ROOM_RESPONSE | jq
ROOM_ID=$(echo $ROOM_RESPONSE | jq -r '.id')
echo "Room ID: $ROOM_ID"

echo -e "\n=== 5. Send Message ==="
curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from API test!",
    "message_type": "text"
  }' \
  -b ${COOKIE_FILE} | jq

echo -e "\n=== 6. Get Messages ==="
curl -s -X GET "${BASE_URL}/api/rooms/${ROOM_ID}/messages?page=0&page_size=20" \
  -b ${COOKIE_FILE} | jq

echo -e "\n=== 7. Update Location ==="
curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.7563,
    "longitude": 100.5018
  }' \
  -b ${COOKIE_FILE} | jq

echo -e "\n=== 8. Get Locations ==="
curl -s -X GET ${BASE_URL}/api/rooms/${ROOM_ID}/locations \
  -b ${COOKIE_FILE} | jq

echo -e "\n=== Test Complete ==="
```

Make it executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Using Postman

1. Import the collection: `postman/Road Trip Buddy API.postman_collection.json`
2. Set the `base_url` variable to `http://localhost:3000`
3. Run requests in order:
   - Health Check
   - Register or Login
   - Create Room
   - Send Message
   - Update Location
   - etc.

**Note:** Postman will automatically handle cookies for authenticated requests.

---

## Error Responses

All endpoints return standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not a room member)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": "Error message here"
}
```

---

## Tips

1. **Cookies:** Make sure to save and use cookies after login/register
2. **UUIDs:** Room IDs, User IDs, etc. are UUIDs - use the ones returned from previous requests
3. **Room Membership:** You must be a member of a room to access its messages and locations
4. **Pagination:** Messages support pagination - use `page` and `page_size` query parameters
