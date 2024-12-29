# Book_Management_Application

## Overview
Developed a comprehensive book management web application using HTML, CSS, JavaScript, Node.js, Express.js, and EJS templates, with PostgreSQL as the database. Features include user authentication via Passport.js with Google OAuth and bcrypt for secure registration and login, session management, and API integrations with Axios. The application supports text-to-speech functionality, dynamic content rendering, and advanced book management operations such as search, filtering, sorting, adding, editing, and deletion operations.
## Features
- **Authentication**: 
  - Implements bcrypt for password hashing during user registration and login.
  - Utilizes Google OAuth 2.0 authentication strategy for user authentication.
  - All routes are authenticated to ensure secure access.
  - Implements session management using express-session middleware.

- **Session Management**:
  - Ensures that all routes are authenticated, and users are logged out automatically if inactive.
  - Users cannot access restricted pages after logout, even using the browser's back arrow.

- **Database Operations**:
  - Utilizes PostgreSQL database for storing user credentials and book data.
  - Handles user registration, login, and other database operations securely.

## Imported Modules
- **express**: Web framework for Node.js.
- **body-parser**: Middleware to parse request bodies.
- **axios**: HTTP client for making requests to external APIs.
- **pg**: PostgreSQL client for Node.js.
- **fs**: File system module for reading and writing files.
- **path**: Module for working with file paths.
- **dotenv**: Module for loading environment variables from .env files.
- **bcrypt**: Library for hashing passwords securely.
- **passport**: Authentication middleware for Node.js.
- **passport-google-oauth20**: Passport strategy for Google OAuth 2.0.
- **express-session**: Middleware for managing sessions in Express.js.

## Note
Please ensure proper configuration of environment variables, database setup, and secure handling of sensitive information before deploying this application to production.

## Contact
For any inquiries or support, please contact [Via email](mailto:obinnaakamadu@gmail.com).
