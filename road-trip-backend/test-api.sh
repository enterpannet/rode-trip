#!/bin/bash

# Road Trip Buddy API Test Script
# Make sure the server is running on localhost:3000

set -e

BASE_URL="http://localhost:3000"
COOKIE_FILE="cookies.txt"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Road Trip Buddy API Test ===${NC}\n"

# Clean up old cookies
rm -f ${COOKIE_FILE}

# 1. Health Check
echo -e "${GREEN}1. Health Check${NC}"
HEALTH=$(curl -s -X GET ${BASE_URL}/api/health)
echo "$HEALTH" | jq
echo ""

# 2. Register User
echo -e "${GREEN}2. Register User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' \
  -c ${COOKIE_FILE})

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to register user${NC}"
  exit 1
fi

echo "$REGISTER_RESPONSE" | jq
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.id')
echo -e "User ID: ${BLUE}${USER_ID}${NC}\n"

# 3. Get Current User
echo -e "${GREEN}3. Get Current User${NC}"
curl -s -X GET ${BASE_URL}/api/auth/me \
  -b ${COOKIE_FILE} | jq
echo ""

# 4. Create Room
echo -e "${GREEN}4. Create Room${NC}"
ROOM_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Road Trip to Beach",
    "description": "Weekend trip to the beach"
  }' \
  -b ${COOKIE_FILE})

if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to create room${NC}"
  exit 1
fi

echo "$ROOM_RESPONSE" | jq
ROOM_ID=$(echo $ROOM_RESPONSE | jq -r '.id')
echo -e "Room ID: ${BLUE}${ROOM_ID}${NC}\n"

# 5. Get User Rooms
echo -e "${GREEN}5. Get User Rooms${NC}"
curl -s -X GET ${BASE_URL}/api/rooms \
  -b ${COOKIE_FILE} | jq
echo ""

# 6. Get Room Members
echo -e "${GREEN}6. Get Room Members${NC}"
curl -s -X GET ${BASE_URL}/api/rooms/${ROOM_ID}/members \
  -b ${COOKIE_FILE} | jq
echo ""

# 7. Send Message
echo -e "${GREEN}7. Send Text Message${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello everyone! Lets meet at the parking lot at 8 AM.",
    "message_type": "text"
  }' \
  -b ${COOKIE_FILE})

echo "$MESSAGE_RESPONSE" | jq
MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.id')
echo -e "Message ID: ${BLUE}${MESSAGE_ID}${NC}\n"

# 8. Get Messages
echo -e "${GREEN}8. Get Messages${NC}"
curl -s -X GET "${BASE_URL}/api/rooms/${ROOM_ID}/messages?page=0&page_size=20" \
  -b ${COOKIE_FILE} | jq
echo ""

# 9. Send Another Message
echo -e "${GREEN}9. Send Another Message${NC}"
curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/messages \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Dont forget to bring sunscreen!",
    "message_type": "text"
  }' \
  -b ${COOKIE_FILE} | jq
echo ""

# 10. Update Location
echo -e "${GREEN}10. Update Location (Bangkok)${NC}"
LOCATION_RESPONSE=$(curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.7563,
    "longitude": 100.5018
  }' \
  -b ${COOKIE_FILE})

echo "$LOCATION_RESPONSE" | jq
echo ""

# 11. Get Locations
echo -e "${GREEN}11. Get Locations${NC}"
curl -s -X GET ${BASE_URL}/api/rooms/${ROOM_ID}/locations \
  -b ${COOKIE_FILE} | jq
echo ""

# 12. Update Location Again
echo -e "${GREEN}12. Update Location Again (Different coordinates)${NC}"
curl -s -X POST ${BASE_URL}/api/rooms/${ROOM_ID}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.7565,
    "longitude": 100.5020
  }' \
  -b ${COOKIE_FILE} | jq
echo ""

# 13. Logout
echo -e "${GREEN}13. Logout${NC}"
curl -s -X POST ${BASE_URL}/api/auth/logout \
  -b ${COOKIE_FILE} \
  -c ${COOKIE_FILE} | jq
echo ""

# Clean up
rm -f ${COOKIE_FILE}

echo -e "${GREEN}=== All Tests Completed! ===${NC}"
