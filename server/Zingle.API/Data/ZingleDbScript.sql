-- Zingle ChatApp SQL Server Database Script
-- Created: 2025-05-05
CREATE DATABASE Zingle_ChatApp

USE Zingle_ChatApp
-- =====================
-- 1. Roles & Users
-- =====================
CREATE TABLE Roles
(
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Users
(
    Id INT IDENTITY PRIMARY KEY,
    UserName NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    DisplayName NVARCHAR(100),
    AvatarUrl NVARCHAR(255),
    IsOnline BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    LastActiveAt DATETIME2,
    IsDeleted BIT DEFAULT 0
);

CREATE TABLE UserRoles
(
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id)
);

-- =====================
-- 2. Friend System
-- =====================
CREATE TABLE Friends
(
    Id INT IDENTITY PRIMARY KEY,
    UserId INT NOT NULL,
    FriendId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL,
    -- 'Accepted', 'Blocked', etc.
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (FriendId) REFERENCES Users(Id)
);

CREATE TABLE FriendRequests
(
    Id INT IDENTITY PRIMARY KEY,
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    -- 'Pending', 'Accepted', 'Declined'
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    RespondedAt DATETIME2,
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    FOREIGN KEY (ReceiverId) REFERENCES Users(Id)
);

-- =====================
-- 3. Conversations & Messaging
-- =====================
CREATE TABLE Conversations
(
    Id INT IDENTITY PRIMARY KEY,
    Name NVARCHAR(100),
    IsGroup BIT DEFAULT 0,
    CreatedBy INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
);

CREATE TABLE ConversationMembers
(
    ConversationId INT NOT NULL,
    UserId INT NOT NULL,
    JoinedAt DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (ConversationId, UserId),
    FOREIGN KEY (ConversationId) REFERENCES Conversations(Id),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- =====================
-- 4. Media Sharing
-- =====================
CREATE TABLE Media
(
    Id INT IDENTITY PRIMARY KEY,
    Url NVARCHAR(255) NOT NULL,
    FileType NVARCHAR(20),
    UploadedBy INT NOT NULL,
    UploadedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UploadedBy) REFERENCES Users(Id)
);

CREATE TABLE Messages
(
    Id INT IDENTITY PRIMARY KEY,
    ConversationId INT NOT NULL,
    SenderId INT NOT NULL,
    Content NVARCHAR(MAX),
    MessageType NVARCHAR(20) DEFAULT 'text',
    -- 'text', 'image', 'call', etc.
    MediaId INT,
    SentAt DATETIME2 DEFAULT GETDATE(),
    IsRead BIT DEFAULT 0,
    ReadAt DATETIME2,
    FOREIGN KEY (ConversationId) REFERENCES Conversations(Id),
    FOREIGN KEY (SenderId) REFERENCES Users(Id),
    FOREIGN KEY (MediaId) REFERENCES Media(Id)
);

-- =====================
-- 5. Call Logs (Video & Voice)
-- =====================
CREATE TABLE CallLogs
(
    Id INT IDENTITY PRIMARY KEY,
    ConversationId INT NOT NULL,
    CallerId INT NOT NULL,
    CalleeId INT NOT NULL,
    CallType NVARCHAR(10) NOT NULL,
    -- 'video', 'voice'
    StartedAt DATETIME2 NOT NULL,
    EndedAt DATETIME2,
    Status NVARCHAR(20) NOT NULL,
    -- 'missed', 'completed', 'declined'
    FOREIGN KEY (ConversationId) REFERENCES Conversations(Id),
    FOREIGN KEY (CallerId) REFERENCES Users(Id),
    FOREIGN KEY (CalleeId) REFERENCES Users(Id)
);

-- =====================
-- 6. Indexes & Constraints
-- =====================
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_UserName ON Users(UserName);
CREATE INDEX IX_Messages_ConversationId ON Messages(ConversationId);
CREATE INDEX IX_Messages_SenderId ON Messages(SenderId);
CREATE INDEX IX_Friends_UserId ON Friends(UserId);
CREATE INDEX IX_Friends_FriendId ON Friends(FriendId);
CREATE INDEX IX_CallLogs_ConversationId ON CallLogs(ConversationId);

-- =====================
-- 7. Seed Roles
-- =====================
INSERT INTO Roles
    (Name)
VALUES
    ('Admin'),
    ('User');

-- =====================
-- End of Script
-- =====================
