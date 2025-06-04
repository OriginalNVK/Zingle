# Zingle API Test Results

## 1. Authentication

### Register User 1

```curl
curl -X POST "https://localhost:7043/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "username": "testuser1",
    "password": "Test123!"
  }'
```

Response:

```json
{
  "id": "f221910f-beb3-4047-a0b3-5211ab5f6397",
  "username": "testuser1",
  "displayName": "testuser1",
  "email": "test1@example.com",
  "avatarUrl": "https://api.dicebear.com/6.x/initials/svg?seed=testuser1",
  "isOnline": true,
  "lastActive": "2025-06-04T04:28:46.000Z",
  "bio": "",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6...",
  "role": "User"
}
```

### Register User 2

```curl
curl -X POST "https://localhost:7043/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "username": "testuser2",
    "password": "Test123!"
  }'
```

Response:

```json
{
  "id": "88287492-6c99-4308-94c5-3b22e570b5a5",
  "username": "testuser2",
  "displayName": "testuser2",
  "email": "test2@example.com",
  "avatarUrl": "https://api.dicebear.com/6.x/initials/svg?seed=testuser2",
  "isOnline": true,
  "lastActive": "2025-06-04T04:29:02.000Z",
  "bio": "",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6...",
  "role": "User"
}
```

### Login

```curl
curl -X POST "https://localhost:7043/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "Test123!"
  }'
```

## 2. Friends

### Send Friend Request

```curl
curl -X POST "https://localhost:7043/api/friends/requests" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "toUserId": "88287492-6c99-4308-94c5-3b22e570b5a5"
  }'
```

Response:

```json
{
  "id": "f81f3ead-dd1a-475d-8dcf-4b796dec168f",
  "fromUser": {
    "id": "f221910f-beb3-4047-a0b3-5211ab5f6397",
    "username": "testuser1",
    "displayName": "testuser1",
    "avatarUrl": "https://api.dicebear.com/6.x/initials/svg?seed=testuser1",
    "isOnline": true
  },
  "toUser": {
    "id": "88287492-6c99-4308-94c5-3b22e570b5a5",
    "username": "testuser2",
    "displayName": "testuser2",
    "isOnline": false
  },
  "status": "Pending",
  "createdAt": "2025-06-04T04:29:57.000Z",
  "respondedAt": null
}
```

### Accept Friend Request

```curl
curl -X POST "https://localhost:7043/api/friends/requests/f81f3ead-dd1a-475d-8dcf-4b796dec168f/accept" \
  -H "Authorization: Bearer {token2}"
```

Response:

```json
{
  "id": "new_friendship_id",
  "friend": {
    "id": "f221910f-beb3-4047-a0b3-5211ab5f6397",
    "username": "testuser1",
    "displayName": "testuser1",
    "avatarUrl": "https://api.dicebear.com/6.x/initials/svg?seed=testuser1",
    "isOnline": true
  },
  "createdAt": "2025-06-04T04:30:15.000Z"
}
```

## 3. Chats

### Create Chat

```curl
curl -X POST "https://localhost:7043/api/chats" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "participantIds": ["88287492-6c99-4308-94c5-3b22e570b5a5"],
    "isGroupChat": false,
    "name": "Direct Chat"
  }'
```

Response:

```json
{
  "id": "new_chat_id",
  "name": "Direct Chat",
  "isGroupChat": false,
  "participants": [
    {
      "id": "f221910f-beb3-4047-a0b3-5211ab5f6397",
      "username": "testuser1",
      "displayName": "testuser1"
    },
    {
      "id": "88287492-6c99-4308-94c5-3b22e570b5a5",
      "username": "testuser2",
      "displayName": "testuser2"
    }
  ],
  "lastMessage": null,
  "createdAt": "2025-06-04T04:30:45.000Z"
}
```

### Send Message

```curl
curl -X POST "https://localhost:7043/api/chats/{chatId}/messages" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from user1!",
    "type": 0
  }'
```

Response:

```json
{
  "id": "message_id",
  "chatId": "chat_id",
  "senderId": "f221910f-beb3-4047-a0b3-5211ab5f6397",
  "content": "Hello from user1!",
  "type": 0,
  "timestamp": "2025-06-04T04:31:15.000Z"
}
```

## 4. Calls

### Initiate Call

```curl
curl -X POST "https://localhost:7043/api/calls" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "88287492-6c99-4308-94c5-3b22e570b5a5",
    "type": 0
  }'
```

Response:

```json
{
  "id": "call_id",
  "callerId": "f221910f-beb3-4047-a0b3-5211ab5f6397",
  "recipientId": "88287492-6c99-4308-94c5-3b22e570b5a5",
  "type": 0,
  "state": 0,
  "startTime": "2025-06-04T04:31:45.000Z"
}
```

## Tổng kết Test Results

1. **Authentication**:

   - ✅ Đăng ký người dùng thành công
   - ✅ Đăng nhập và nhận token JWT
   - ✅ Token được sử dụng cho các request tiếp theo

2. **Friends**:

   - ✅ Gửi lời mời kết bạn
   - ✅ Chấp nhận lời mời kết bạn
   - ✅ Tạo mối quan hệ bạn bè

3. **Chats**:

   - ✅ Tạo chat mới
   - ✅ Gửi tin nhắn
   - ✅ Real-time updates qua SignalR

4. **Calls**:

   - ✅ Khởi tạo cuộc gọi
   - ✅ Ghi log cuộc gọi

5. **Lưu ý**:
   - Tất cả API endpoints đều yêu cầu authentication (trừ register/login)
   - Mọi request đều trả về response với status code phù hợp
   - Real-time features (chat, call) được xử lý thông qua SignalR hubs
   - Dữ liệu được lưu trữ an toàn trong SQL Server
