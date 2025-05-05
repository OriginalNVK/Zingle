# 📱 Zingle - Project Overview

Zingle is a real-time web chat application inspired by modern messaging platforms like Messenger. It is built with a robust tech stack to ensure scalability, security, and a smooth user experience. This document outlines the technical requirements, technologies, and core functionalities of the application.

---

## 🏗️ Technical Requirements

### 🚀 Tech Stack

| **Layer**      | **Technologies**                                  |
| -------------- | ------------------------------------------------- |
| **Frontend**   | React, TailwindCSS, Axios, SignalR (Client)       |
| **Backend**    | ASP.NET Core Web API, SignalR, JWT Authentication |
| **Database**   | SQL Server                                        |
| **Realtime**   | SignalR for real-time messaging                   |
| **Deployment** | Docker, Azure App Service, Azure Static Web Apps  |
| **CI/CD**      | GitHub Actions                                    |

### 🛠️ Development Tools

- **Version Control**: Git, GitHub
- **Containerization**: Docker, Docker Compose
- **IDE**: Visual Studio Code (Frontend), Visual Studio (Backend)
- **Package Management**: npm (Frontend), NuGet (Backend)

---

## ✅ Core Functionalities

### 🔐 Authentication & Authorization

- **User Registration/Login**: Secure signup and login with email/password.
- **JWT Security**: Token-based authentication for secure API access.
- **Role-Based Access**: Support for Admin and User roles.

### 👤 User Management

- **User Profiles**: View and update user information (name, avatar, etc.).
- **Online/Offline Status**: Display real-time user status using SignalR.
- **User Listing**: Browse all users with filtering options.

### 🤝 Friend System

- **Friend Requests**: Send, accept, or decline friend requests.
- **Friend List**: Manage and view the list of friends.

### 💬 Real-Time Messaging

- **Instant Messaging**: Send and receive messages in real-time via SignalR.
- **Message Storage**: Persist messages in the database for history.
- **Typing Indicators**: Show "typing..." status during conversations.
- **Read Receipts**: Display "seen" status for messages.

### 📎 Media Sharing (Bonus)

- **Image Upload**: Send images, stored on the server or Azure Blob Storage.
- **Media Preview**: View images directly in the chat interface.

### 🔎 Search & Filtering

- **User Search**: Search for users by name or username.
- **Conversation Search**: Find specific chats or messages within conversations.

### 📊 Admin Dashboard

- **User Analytics**: Monitor the number of online users.
- **Message Statistics**: Track message volume over time.

---

## 📁 Proposed Project Structure

```bash
zingle/
├── client/                     # React + TailwindCSS Frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page-level components
│   │   ├── assets/            # Images, icons, etc.
│   │   └── services/          # API and SignalR client logic
│   └── Dockerfile             # Docker configuration for frontend
├── server/                     # ASP.NET Core Backend
│   ├── Controllers/           # API endpoints
│   ├── Hubs/                  # SignalR hubs for real-time
│   ├── Models/                # Data models and entities
│   ├── Services/              # Business logic and SignalR services
│   └── Dockerfile             # Docker configuration for backend
├── docker-compose.yml          # Multi-container setup
└── README.md                   # Project documentation
```

---

## 🐳 Dockerization

- **Frontend**: Containerized React app with Nginx for serving.
- **Backend**: Containerized ASP.NET Core API with SignalR.
- **Database**: SQL Server (or PostgreSQL) container.
- **Run Locally**:
  ```bash
  docker-compose up --build
  ```

---

## ☁️ Deployment on Azure

- **Frontend**: Deployed on Azure Static Web Apps for fast, scalable hosting.
- **Backend**: Deployed on Azure App Service using Docker containers.
- **Database**: Hosted on Azure SQL Database or Azure PostgreSQL.
- **Realtime**: Optionally use Azure SignalR Service for scalability.

---

## 📌 Development Notes

- **User Experience**: Prioritize a smooth and responsive interface.
- **Security**: Implement JWT, CSRF protection, and secure WebSocket connections.
- **CI/CD**: Set up GitHub Actions for automated testing and deployment.
- **Scalability**: Design for horizontal scaling with Azure services.
- **Multilingual Support**: Optional extension for localization.

---

## 📄 License

MIT © 2025 Zingle Team
