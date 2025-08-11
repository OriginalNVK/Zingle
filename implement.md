# Zingle-App: Mô tả triển khai & Database

## 1. Tổng quan dự án

**Zingle-App** là một ứng dụng chat đa nền tảng, sử dụng React (client) và ASP.NET Core (server) với SignalR cho realtime, Entity Framework Core cho ORM, và Microsoft SQL Server làm database.

---

## 2. Kiến trúc tổng thể

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: ASP.NET Core Web API (.NET 8), SignalR, Entity Framework Core
- **Database**: Microsoft SQL Server
- **Realtime**: SignalR (chat, call)
- **Authentication**: ASP.NET Identity + JWT

---

## 3. Các bảng trong Microsoft SQL Server

Dưới đây là mô tả chi tiết các bảng chính trong database, dựa trên migration và model thực tế:

### 3.1. Bảng người dùng (AspNetUsers)

Sử dụng ASP.NET Identity, kế thừa thêm các trường mở rộng:

| Tên cột     | Kiểu dữ liệu  | Ý nghĩa                         |
| ----------- | ------------- | ------------------------------- |
| Id          | nvarchar(450) | Khóa chính, định danh user      |
| DisplayName | nvarchar(max) | Tên hiển thị                    |
| AvatarUrl   | nvarchar(max) | Ảnh đại diện                    |
| IsOnline    | bit           | Trạng thái online               |
| LastActive  | datetime2     | Lần hoạt động cuối              |
| Bio         | nvarchar(max) | Tiểu sử                         |
| CreatedAt   | datetime2     | Ngày tạo                        |
| ...         | ...           | Các trường của ASP.NET Identity |

### 3.2. Bảng vai trò (AspNetRoles) và các bảng liên quan

- **AspNetRoles**: Danh sách các vai trò (Admin, User, ...)
- **AspNetUserRoles**: Liên kết user với role
- **AspNetUserClaims, AspNetRoleClaims, AspNetUserLogins, AspNetUserTokens**: Các bảng chuẩn của Identity

### 3.3. Bảng cuộc trò chuyện (Chats)

| Tên cột      | Kiểu dữ liệu  | Ý nghĩa               |
| ------------ | ------------- | --------------------- |
| Id           | nvarchar(450) | Khóa chính            |
| Name         | nvarchar(max) | Tên nhóm/chat         |
| IsGroupChat  | bit           | Chat nhóm hay cá nhân |
| AvatarUrl    | nvarchar(max) | Ảnh đại diện nhóm     |
| CreatedAt    | datetime2     | Ngày tạo              |
| LastActivity | datetime2     | Lần hoạt động cuối    |
| AppUserId    | nvarchar(450) | (nullable)            |

### 3.4. Bảng thành viên chat (ChatParticipants)

| Tên cột             | Kiểu dữ liệu  | Ý nghĩa                   |
| ------------------- | ------------- | ------------------------- |
| Id                  | nvarchar(450) | Khóa chính                |
| ChatId              | nvarchar(450) | FK đến Chats              |
| UserId              | nvarchar(450) | FK đến AspNetUsers        |
| CustomNickname      | nvarchar(max) | Nickname riêng trong nhóm |
| JoinedAt            | datetime2     | Ngày tham gia             |
| IsAdmin             | bit           | Có phải admin nhóm        |
| LastReadMessageTime | datetime2     | Thời gian đọc tin cuối    |

### 3.5. Bảng tin nhắn (Messages)

| Tên cột   | Kiểu dữ liệu  | Ý nghĩa              |
| --------- | ------------- | -------------------- |
| Id        | nvarchar(450) | Khóa chính           |
| ChatId    | nvarchar(450) | FK đến Chats         |
| SenderId  | nvarchar(450) | FK đến AspNetUsers   |
| Content   | nvarchar(max) | Nội dung             |
| Timestamp | datetime2     | Thời gian gửi        |
| Type      | int           | Loại tin nhắn (enum) |
| ImageUrl  | nvarchar(max) | Ảnh gửi kèm          |
| FileUrl   | nvarchar(max) | File gửi kèm         |
| FileName  | nvarchar(max) | Tên file             |
| FileSize  | bigint        | Kích thước file      |

### 3.6. Bảng yêu cầu kết bạn (FriendRequests)

| Tên cột     | Kiểu dữ liệu  | Ý nghĩa           |
| ----------- | ------------- | ----------------- |
| Id          | nvarchar(450) | Khóa chính        |
| FromUserId  | nvarchar(450) | Người gửi         |
| ToUserId    | nvarchar(450) | Người nhận        |
| Status      | int           | Trạng thái (enum) |
| CreatedAt   | datetime2     | Ngày gửi          |
| RespondedAt | datetime2     | Ngày phản hồi     |

### 3.7. Bảng bạn bè (Friendships)

| Tên cột   | Kiểu dữ liệu  | Ý nghĩa      |
| --------- | ------------- | ------------ |
| Id        | nvarchar(450) | Khóa chính   |
| User1Id   | nvarchar(450) | Người 1      |
| User2Id   | nvarchar(450) | Người 2      |
| CreatedAt | datetime2     | Ngày kết bạn |

### 3.8. Bảng lịch sử cuộc gọi (CallLogs)

| Tên cột         | Kiểu dữ liệu  | Ý nghĩa              |
| --------------- | ------------- | -------------------- |
| Id              | nvarchar(450) | Khóa chính           |
| CallerId        | nvarchar(450) | Người gọi            |
| RecipientId     | nvarchar(450) | Người nhận           |
| Type            | int           | Loại cuộc gọi (enum) |
| State           | int           | Trạng thái (enum)    |
| StartTime       | datetime2     | Bắt đầu              |
| EndTime         | datetime2     | Kết thúc             |
| DurationSeconds | int           | Thời lượng (giây)    |

---

## 4. Mối quan hệ giữa các bảng

- **AspNetUsers** liên kết với **Chats** (qua AppUserId), **ChatParticipants**, **Messages**, **FriendRequests**, **Friendships**, **CallLogs**
- **Chats** liên kết với **ChatParticipants**, **Messages**
- **ChatParticipants** liên kết với **Chats** và **AspNetUsers**
- **Messages** liên kết với **Chats** và **AspNetUsers**
- **FriendRequests** liên kết với **AspNetUsers** (FromUser, ToUser)
- **Friendships** liên kết với **AspNetUsers** (User1, User2)
- **CallLogs** liên kết với **AspNetUsers** (Caller, Recipient)

---

## 5. Enum sử dụng trong database

- **MessageType**: Text, Image, File, System
- **FriendRequestStatus**: Pending, Accepted, Declined, Blocked
- **CallType**: Audio, Video
- **CallState**: Initiated, Active, Missed, Rejected, Completed

---

## 6. Các điểm nổi bật khi triển khai

- **Authentication**: ASP.NET Identity + JWT, bảo mật API, phân quyền
- **Realtime**: SignalR cho chat/call realtime
- **CORS**: Được cấu hình để client và server kết nối an toàn
- **Migration**: Sử dụng Entity Framework Core để quản lý schema
- **Upload**: Hỗ trợ upload file, ảnh qua API

---

## 7. Hướng dẫn mở rộng

- Có thể thêm các bảng như Notification, Group, hoặc mở rộng bảng Message cho các loại media khác.
- Có thể thêm các chỉ mục (index) cho các trường truy vấn nhiều như UserId, ChatId, Timestamp.

---

## 8. Sơ đồ ERD (mô tả logic)

```
[AppUser] 1---* [ChatParticipant] *---1 [Chat]
[AppUser] 1---* [Message] *---1 [Chat]
[AppUser] 1---* [FriendRequest] *---1 [AppUser]
[AppUser] 1---* [Friendship] *---1 [AppUser]
[AppUser] 1---* [CallLog] *---1 [AppUser]
```
