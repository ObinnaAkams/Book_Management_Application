# Book_Management_Application

## Overview
This repository contains code for a book management web application built with HTML, CSS, Javascript, NodeJS, EJS, Axios, Express.js, a web framework for Node.js. The application implements various text-to-speech functionalties, API calls, authentication features, session management, database operations using PostgreSQL, search, filtering, sort, edit and delete operations, .

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
