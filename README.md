# Project Documentation

## Table of Contents
1. [Git Repository Organization](#git-repository-organization)
2. [Data Structures](#data-structures)
3. [Client and Server Responsibilities](#client-and-server-responsibilities)
4. [Server Routes](#server-routes)
5. [Angular Architecture](#angular-architecture)
6. [Client-Server Interaction](#client-server-interaction)

## Git Repository Organization

The repository contains only the `main` branch with 31 commits. Commit messages reflect the incremental progress and feature implementations, such as:

- `fixed joining and leaving messages for socket chats`
- `added frontend and external tests`
- `finished updating UI`
- `added video chat and is now functional`
- `Sending images now works`

The project structure is as follows:
```
└── 📁SFAssignment1
    └── 📁backend
        └── 📁uploads
            └── 📁message-images
            └── 📁profile-pictures
        └── data.json
        └── db.js
        └── package-lock.json
        └── package.json
        └── server.js
    └── 📁coverage
        └── 📁lcov-report
    └── 📁frontend
        └── 📁app
            └── 📁public
            └── 📁src
                └── 📁app
                    └── various Angular components
                └── 📁assets
            └── angular.json
            └── cookies.txt
            └── package-lock.json
            └── package.json
            └── README.md
            └── tsconfig files
        └── .DS_Store
    └── 📁test
        └── group-api.test.js
        └── mongodb.test.js
        └── user-api.test.js
    └── package-lock.json
    └── package.json
    └── README.md
```

## Data Structures

The backend uses MongoDB collections to handle data for the following entities:
- **Users**: Fields include `id`, `username`, `password`, `email`, `roles`, and `groups`.
- **Groups**: Fields include `name`, `channels`, `members`, and `groupAdmin`.
- **Messages**: Stores chat messages with fields like `group`, `channel`, `sender`, `message`, `profilePicture`, and `timestamp`.
- **Banned List**: Contains users who are banned from the groups.

The frontend interacts with these data structures by accessing the backend endpoints directly.

## Client and Server Responsibilities

### Server Responsibilities
The server, built with Node.js and Express, handles most of the application logic, including:
- User authentication and session handling
- Real-time messaging with Socket.io
- File uploads (profile pictures and message images) using Multer
- Data storage in MongoDB for users, groups, messages, and bans
- REST API endpoints for creating, updating, and deleting groups, channels, and users

### Client Responsibilities
The frontend, built with Angular, performs the following tasks:
- Sending requests to the server for data retrieval and updates
- Handling user interactions and displaying dynamic data
- Connecting to the Socket.io server for real-time communication
- Managing state updates in standalone components

## Server Routes

The following is a list of key routes available on the server, including their parameters and purposes:

| Route                             | Method | Parameters                                 | Purpose                                                         |
|-----------------------------------|--------|--------------------------------------------|----------------------------------------------------------------|
| `/login`                          | POST   | `username`, `password`                     | Logs in a user and creates a session                           |
| `/register`                       | POST   | `username`, `password`, `email`            | Registers a new user                                           |
| `/groups`                         | GET    | None                                       | Retrieves all groups                                           |
| `/groups/:groupName/channels`     | POST   | `groupName`, `channel`                     | Adds a new channel to a specified group                        |
| `/upload-profile-picture`         | POST   | `profilePicture` (file)                    | Uploads a profile picture                                      |
| `/ban-user`                       | POST   | `username`, `report`                       | Bans a user and logs a report                                  |
| `/unban-user`                     | POST   | `username`                                 | Unbans a user                                                  |
| `/delete-account`                 | DELETE | `username`                                 | Deletes a user account and all associated data                 |
| `/groups/:groupName/leave`        | POST   | `groupName`, `username`                    | Allows a user to leave a group                                 |
| `/upload-image`                   | POST   | `file` (image), `group`, `channel`, `sender`, `timestamp` | Handles image uploads for chat messages                     |

## Angular Architecture

The Angular project uses a modular architecture with standalone components for each functionality. The main routes and components in the application are as follows:

| Path                     | Component                      | Description                               |
|--------------------------|-------------------------------|-------------------------------------------|
| `/login`                 | `LoginComponent`              | Handles user login                         |
| `/create-new-account`    | `CreateNewAccountComponent`   | Allows users to create a new account       |
| `/groups`                | `GroupsComponent`             | Displays the list of groups                |
| `/chat`                  | `ChatComponent`               | Handles the chat functionality             |
| `/channels`              | `ChannelsComponent`           | Shows the list of channels within a group  |
| `/member-list`           | `MemberListComponent`         | Displays the members of a group            |
| `/ban-list`              | `BanListComponent`            | Shows the list of banned users             |
| `/video-chat`            | `VideoChatComponent`          | Handles video chat functionality           |

## Client-Server Interaction

### Chat Component Example
The ChatComponent demonstrates how the Angular client interacts with the Node.js server using both HttpClient and Socket.io for seamless communication. Here's a summary of its functionality:
- **Connecting to Socket.io**: Establishes a connection to the server and joins the appropriate chat channel.
- **Real-Time Messaging**: Listens for incoming messages, updates chat history, and sends text or image messages.
- **Loading User Session**: Fetches session data from the server to identify the logged-in user.
- **File Uploads**: Supports image file uploads within the chat interface, sending them to the server for processing.

### Flow of Interaction
1. **User logs in**: Login information is sent to the server, and upon successful authentication, a session is created.
2. **Chat Initialization**: Upon joining a chat channel, the client requests the chat history from the server.
3. **Message Sending**: Messages and images are sent from the client to the server via Socket.io, and the server broadcasts them to all connected users.
4. **Real-Time Updates**: New messages are received from the server in real time and displayed in the chat interface.

## Additional Information
- **File Uploads**: Profile pictures and message images are stored in the `/uploads` directory on the server.
- **Technologies Used**: Node.js, Express, MongoDB, Angular, Socket.io, and Multer.
