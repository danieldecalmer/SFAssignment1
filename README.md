# Project Title: Group Management and Chat System (Phase 1)

## Overview

This project is a Group Management and Chat system built with Angular on the client-side and Node.js on the backend. The primary purpose of the system is to allow users to create groups, manage group members, and have a chat-like interaction within channels. There are different roles like Super Admins and Group Admins that have varied privileges, such as banning members, promoting them to admins, and managing waiting lists. The only thing I couldn't get working within my limited time was the functionality to support multiple Super Admins.

## Git Repository Organization

The project follows a straightforward Git organization. I used a single `main` branch, and commits were made regularly after completing bug-free iterations or implementing new pages.

The repository is divided into two main folders:

1\. **Frontend** (`/frontend`) -- This contains all Angular components, services, and routes. The front-end listens on port `4200`.

2\. **Backend** (`/backend`) -- This contains the Node.js server code, listening on port `3000`, which includes express and session management logic.

You can find a commit history screenshot provided for reference:

- **Login page**

- **Create New Group and Create New Channel**

- **View Group Members, Ban and Report Users**

- **Manage Waiting Lists**

## Data Structures

The system uses simple in-memory data structures on both the client and server sides. Here's a breakdown:

### Server-Side (Node.js)

- **Users**: 


  {

    id: uuidv4(),

    username: 'super',

    password: '123',

    email: 'super@example.com',

    roles: ['group', 'super'], // Roles can be 'super', 'group', or none

    groups: ['Group 1', 'Group 2'] // Array of groups the user belongs to

  }


- **Groups**: 


  {

    id: uuidv4(),

    name: 'Group 1',

    channels: ['Channel A', 'Channel B'], // List of channels in this group

    members: ['user1', 'user2'], // Members of the group

    groupAdmin: 'super', // Admin of the group

    waitingList: [] // Waiting list for pending members

  }


- **Banned List**:


  {

    username: 'bannedUser',

    report: 'Violation of rules' // Reason for ban

  }


### Client-Side (Angular)

- **User**: The user entity stored after login in the session, similar to the backend structure.

- **Group**: Contains group details including members, group admins, and channels.

- **Banned List**: Stores banned users and the reason for their ban.

## Angular Architecture

### Components

The system consists of various Angular components:

- **LoginComponent**: Handles user login.

- **CreateNewAccountComponent**: Registers new users.

- **GroupsComponent**: Displays groups for the logged-in user and allows management actions like viewing members, deleting groups, etc.

- **MemberListComponent**: Shows members of a group and enables actions like kicking or promoting users.

- **ChannelsComponent**: Displays channels of a selected group.

- **ChatComponent**: Placeholder for a future chat feature.

- **BanAndReportComponent**: Used by group admins and super admins to ban and report users.

- **BanListComponent**: Super admins can view banned users and unban them.

### Services

The Angular `HttpClient` service is used to interact with the backend. Each component that needs to send or fetch data communicates with the server via RESTful API requests.

### Routes

The `app.routes.ts` file defines the routes for the application, such as:

- `/login` for the login page

- `/groups` for managing groups

- `/member-list` for viewing group members

- `/ban-list` for viewing banned users (Super Admin only)

## Node.js Server Architecture

### Files

The project uses a single `server.js` file for the backend logic, simplifying Phase 1 implementation. It uses the following technologies:

- **express**: To set up the HTTP server and handle routing.

- **express-session**: To manage user sessions.

- **cors**: To allow cross-origin requests from the Angular frontend.

### Global Variables

- **users**: In-memory storage for users.

- **groups**: In-memory storage for groups.

- **bannedList**: In-memory storage for banned users.

### Functions and Modules

- **Session Management**: User sessions are handled using `express-session` and are tied to login/logout functionality.

- **Group and User Management**: Functions such as adding users to groups, managing group members, promoting admins, and banning users are handled in the express routes.

## Server-Side Routes

| Route                        | Method | Parameters                | Return Value                 | Description                                    |
|------------------------------|--------|---------------------------|------------------------------|------------------------------------------------|
| /login                      | POST   | { username, password }   | User session data             | Authenticates a user and creates a session.    |
| /register                   | POST   | { username, password, email } | Confirmation message      | Registers a new user.                         |
| /groups                     | GET    | None                      | List of all groups            | Fetches all groups.                           |
| /groups/:groupName/kick     | POST   | { member }               | Confirmation message          | Removes a member from the group.              |
| /groups/:groupName/promote  | POST   | { member }               | Confirmation message          | Promotes a member to group admin.             |
| /ban-user                   | POST   | { username, report }     | Confirmation message          | Bans a user and adds them to the banned list. |
| /unban-user                  | POST   | { username }             | Confirmation message          | Unbans a user by removing them from bannedList|
| /banned-users               | GET    | None                       | List of banned users          | Retrieves a list of banned users.             |


## Interaction Between Client and Server

- **Login**: The login form sends a POST request to `/login`. On success, the user is redirected to the Groups page. The user's session is saved, allowing privileged actions like creating or deleting groups.

- **Group Management**: Group Admins and Super Admins can create new groups via POST requests to `/groups`, and add channels via `/groups/:groupName/channels`.

- **Ban/Unban Users**: Group admins or Super Admins can ban users by sending a POST request to `/ban-user`. The user is removed from all groups and added to the banned list. Super Admins can unban users via `/unban-user`.

- **Displaying Members**: When viewing group members, the Angular component sends a GET request to `/groups/:groupName/waiting-list` to load the waiting list and manages group membership accordingly.

