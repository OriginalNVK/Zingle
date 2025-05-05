# Zingle - Detailed Project Structure

## 📁 Root Directory Structure

```
zingle/
├── client/                     # Frontend React Application
├── server/                     # Backend ASP.NET Core Application
├── docker/                     # Docker configuration files
├── docs/                       # Project documentation
└── tests/                     # End-to-end tests
```

## 📱 Frontend Structure (client/)

```
client/
├── public/                    # Static files
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── images/
│       └── icons/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── chat/            # Chat components
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── TypingIndicator.jsx
│   │   ├── friends/         # Friend components
│   │   │   ├── FriendList.jsx
│   │   │   ├── FriendRequest.jsx
│   │   │   └── AddFriend.jsx
│   │   ├── profile/         # Profile components
│   │   │   ├── UserProfile.jsx
│   │   │   └── ProfileEdit.jsx
│   │   └── shared/          # Shared/common components
│   │       ├── Button.jsx
│   │       ├── Avatar.jsx
│   │       └── Loading.jsx
│   ├── constants/           # Application constants
│   │   ├── apiConstants.js
│   │   ├── routes.js
│   │   ├── messages.js
│   │   └── appConfig.js
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Chat.jsx
│   │   ├── Profile.jsx
│   │   └── Admin.jsx
│   ├── services/           # API and service integrations
│   │   ├── api.js         # Axios instance and interceptors
│   │   ├── authService.js
│   │   ├── chatService.js
│   │   ├── userService.js
│   │   └── signalR/
│   │       └── chatHub.js
│   ├── utils/             # Utility functions
│   │   ├── auth.js
│   │   ├── dateTime.js
│   │   ├── validation.js
│   │   └── helpers.js
│   ├── assets/            # Internal assets
│   │   ├── styles/       # CSS and style files
│   │   └── images/
│   ├── context/          # React Context
│   │   ├── AuthContext.js
│   │   └── ChatContext.js
│   ├── hooks/            # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useChat.js
│   ├── App.jsx
│   └── index.jsx
├── package.json
├── .env
├── .env.production
├── .eslintrc.js
└── Dockerfile
```

## 🖥️ Backend Structure (server/)

```
server/
├── Zingle.API/               # Main API Project
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── UserController.cs
│   │   ├── ChatController.cs
│   │   ├── FriendController.cs
│   │   └── AdminController.cs
│   ├── Hubs/
│   │   ├── ChatHub.cs
│   │   └── PresenceHub.cs
│   ├── Models/
│   │   ├── Domain/
│   │   │   ├── User.cs
│   │   │   ├── Message.cs
│   │   │   └── FriendRequest.cs
│   │   ├── DTOs/
│   │   └── ViewModels/
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── IAuthService.cs
│   │   │   ├── IChatService.cs
│   │   │   └── IUserService.cs
│   │   └── Implementations/
│   │       ├── AuthService.cs
│   │       ├── ChatService.cs
│   │       └── UserService.cs
│   ├── Data/
│   │   ├── ApplicationDbContext.cs
│   │   └── Configurations/
│   ├── Repositories/           # Repositories with implementations and tests
│   │   ├── Base/
│   │   │   ├── IBaseRepository.cs
│   │   │   ├── BaseRepository.cs
│   │   │   └── BaseRepositoryTests.cs
│   │   ├── User/
│   │   │   ├── IUserRepository.cs
│   │   │   ├── UserRepository.cs
│   │   │   └── UserRepositoryTests.cs
│   │   ├── Message/
│   │   │   ├── IMessageRepository.cs
│   │   │   ├── MessageRepository.cs
│   │   │   └── MessageRepositoryTests.cs
│   │   └── Friend/
│   │       ├── IFriendRepository.cs
│   │       ├── FriendRepository.cs
│   │       └── FriendRepositoryTests.cs
│   ├── Middleware/
│   │   ├── ExceptionMiddleware.cs
│   │   └── JwtMiddleware.cs
│   ├── Helpers/
│   ├── Extensions/
│   └── Configuration/
├── Zingle.Infrastructure/
│   ├── Email/
│   ├── Storage/
│   └── Security/
├── docker-compose.yml
├── Dockerfile
└── Zingle.sln
```

## 🐳 Docker Configuration (docker/)

```
docker/
├── nginx/
│   └── nginx.conf
├── sql/
│   └── init.sql
├── docker-compose.yml
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

## 📚 Documentation (docs/)

```
docs/
├── api/
│   └── swagger.json
├── setup/
├── deployment/
└── architecture/
```

## 🧪 Tests (tests/)

```
tests/
├── e2e/
├── integration/
└── performance/
```

## 🔧 Configuration Files

```
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── .gitignore
├── README.md
├── LICENSE
└── docker-compose.yml
```
