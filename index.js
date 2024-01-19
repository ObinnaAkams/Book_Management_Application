
// TO IMPLEMENT LATER
// That all routes are authenticated
// Ensure that once user logs out, he cannot access the page again (when he uses browser's back arrow)
//  unless he logins in
// Forgot Passowrd
// logout if inactive
// Level 5 AUTH: Using pssports to add cookies and sessions. Adds hash/salt authomatically while creating cookies
// Payment authentication

// See explanations last below
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import fs from "fs";
import { fileURLToPath } from 'url';
import path from 'path';
import { join, dirname, relative } from 'path';
import dotenv from 'dotenv'; // Module to load environment variables from .env file
import bcrypt from 'bcrypt'; // Library for hashing passwords
import passport from 'passport';  // Authentication middleware for Node.js
import GoogleStrategy from 'passport-google-oauth20'; // Passport strategy for Google OAuth 2.0
import session from 'express-session'; // Middleware to handle sessions

dotenv.config(); // Load environment variables from .env file
const saltRounds = 10; // Set the number of rounds for bcrypt hashing

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Configure session middleware with session options
app.use(session({
  secret: 'your secret value',
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport and session for authentication
app.use(passport.initialize());
app.use(passport.session());

// Create a PostgreSQL client and connect to the database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book",
  password: process.env.DB_PASSWORD,
  port: 5433,
});
db.connect();

// Serialize user instance to the session and deserialize it
// for managing user authentication sessions in an Express application using Passport.js. 
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
db.query('SELECT * FROM loginTable2 WHERE id = $1', [id], (err, res) => {
  if (err) {
  done(err, null);
  } else {
  done(null, res.rows[0]);
  }
});
});

// For Google authentication (Both login & register)
// Configure Google OAuth strategy for Passport
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID, // See .env Gotten when done with creating a project with Google developer console
  clientSecret: process.env.CLIENT_SECRET, // Same
  // Created with google developer console: https://console.cloud.google.com/cloud-resource-manager?pli=1
  // I called it 'secret' cos of video secret lesson i learnt it from
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  // console.log(profile);
// loginTable2 is for Google login only
  db.query('SELECT * FROM loginTable2 WHERE googleId = $1', [profile.id], (err, res) => {
    if (err) {
      return cb(err, null);
    }

    if(res.rows.length > 0) {
      // If the user is found, return the user (login)
      return cb(null, res.rows[0]);
    } else {
      // If the user is not found, create a new user (register)
      db.query('INSERT INTO loginTable2 (googleid, email, displayname) VALUES ($1, $2, $3) RETURNING *', [profile.id, profile.emails[0].value, profile.displayName], (err, res) => {
        if (err) {
          return cb(err, null);
        }
 
        return cb(null, res.rows[0]);
      });
    }
  });
}
));

let books = [];

app.get("/", function(req, res){
  res.render("home"); // home or home.ejs
});

app.get("/auth/google", // Route created during project creation @ Google developer console
  passport.authenticate('google', { scope: ["profile", "email"] })
);

app.get("/auth/google/secrets", // Same
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    res.redirect("/main");
  });

app.get("/login", function(req, res){ // Get login form
  res.render("login");
});

app.get("/register", function(req, res){ // Get Signup form
  res.render("register");
});

app.get("/logout", function(req, res){ // Logout route
  req.logout(function(err) { // Keyword: logout()
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// For bcrypt registration NOT Google
app.post("/register", function(req, res) { // Register route
  // Extract each parameter from the request body
  const firstName = req.body.firstName;
  const surName = req.body.surName;
  const userName = req.body.userName;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  // Check if passwords match
  if (password !== confirmPassword) {
    const passwordError = 'Passwords do not match';
    return res.render('register', { passwordError });
  }

  // Hash password and insert new user
  bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).send('An error occurred while hashing the password.');
    }

    db.query('INSERT INTO loginTable1 (firstname, surname, username, password) VALUES ($1, $2, $3, $4) RETURNING *', 
    [firstName, surName, userName, hash], (err, result) => {
      if (err) {
        console.error('Error inserting into table:', err);
        if (err.code === '23505') {
          return res.render("register.ejs", { usernameError: `${userName} already exists.`});
        }
        return res.status(500).send('An error occurred while inserting data into the table.');
      } else {

        // Store firstName in session so it be passed to the /main route in realtime
        req.session.firstName = firstName;
        // console.log(req.session);

        passport.authenticate("local")(req, res, function(){
          res.redirect("/main");
        });
      }
    });
  });
});

// For bcrypt login, NOT Google
app.post("/login", function(req, res, next) { // Login route with username and pw
  const { username, password } = req.body;
    // User is logging in with username and password
    db.query('SELECT * FROM loginTable1 WHERE username = $1', [username], (err, dbResult) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('An error occurred while querying the database.');
      } else {
        if (dbResult.rows.length > 0) {
          bcrypt.compare(password, dbResult.rows[0].password, function(err, bcryptResult) {
            if (err) {
              console.error('Bcrypt error:', err);
              return res.status(500).send('An error occurred during password comparison.');
            }
            if (bcryptResult === true) {
              // Store the user's firstName in the session to be able to hold it and pass it 
              // to /main route
              req.session.firstName = dbResult.rows[0].firstname;
              res.redirect("/main");
            } else {
              res.render('login', { passwordError: 'Invalid password' });
            }
          });
        } else {
          res.render('login', { usernameError: 'Invalid Username' });
        }
      }
    });
});

app.get("/main", async (req, res) => {
  // Continuation of sort route: see "/sort" POST route down below
  let sOption = req.query.sOption || "readdate"; // Default to sorted with readdate (seen first each time the page refreshes)
  let sDirection = req.query.sDirection || "desc"; // Default to descending order (sorts this way each time web page refreshes)

  // Validate sortOption and sortDirection
  if (!['rating', 'bookname', 'readdate'].includes(sOption)) {
    return res.status(400).send('Invalid sort option');
  }
  if (!['asc', 'desc'].includes(sDirection)) {
    return res.status(400).send('Invalid sort direction');
  }
  // Query the database with ORDER BY (see code end)
  // This ensures that the selected sorts are effected and picked from the db at once
  const result = await db.query(`SELECT id, ISBN, authorName, bookName, coverImgPath, rating, TO_CHAR(readDate, 'YYYY-MM-DD') as readDate, bookSummary FROM books ORDER BY ${sOption} ${sDirection}`);
  books = result.rows,
 // Send the results and the sort parameters back to the client

 res.render("index.ejs", {
  books: books,
  sOption: sOption,
  sDirection: sDirection,
  firstName: req.session.firstName
});
});

// Helper function for sentence case
function toSentenceCase(str) {
  var sentences = str.toLowerCase().split('. ');
  for(var i = 0; i< sentences.length; i++){
      sentences[i] = sentences[i][0].toUpperCase() + sentences[i].slice(1);
  }
  return sentences.join('. ');
}
app.post("/add", async (req, res) => {
  let ISBN = req.body.ISBN;
  
  try {
    let { title, ISBN, author, date, content, rating } = req.body;

    // Validate and sanitize input
    const isEmpty = str => (!str || /^\s*$/.test(str));
    const isNumeric = str => (!str || /^\d+$/.test(str));

    // Stop the execution of the function as soon as an error is encountered. 
    // By adding a return statement before each res.render() call
    // The 'test' method of a regular expression is used to check if the provided string matches 
    // the pattern defined by the regular expression.
if (isEmpty(title)) {
  return res.render("modify.ejs", { titleError: "Title must not be empty." });
}

if (!isNumeric(ISBN)) {
  return res.render("modify.ejs", { ISBNerror: "ISBN can contain only numbers." });
}

if (isEmpty(author)) {
  return res.render("modify.ejs", { authorError: "Author must not be empty." });
}

if (isEmpty(content)) {
  return res.render("modify.ejs", { contentError: "Summary must not be empty." });
}
    
    // Process data
    title = title.toString().toUpperCase();
    author = author.toString().toUpperCase();
    content = content.toString(); 
    content = toSentenceCase(content);
    
    // Construct the URL for the Open Library Covers API
    const url = `https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg`;
    let response;
    // Handle if there is failure to get cover image from the API. This error will be 
    // displayed in ISBN input placeholder in modify.ejs
    try {
      // Fetch the image from the API
      response = await axios.get(url, { responseType: 'arraybuffer' });
    } catch (err) {
      console.error(err);
      return res.render("modify.ejs", { ISBNerror: "Failed to fetch book cover from API." });
    }
    // Construct the file path for the cover image based on the book title
    // replacing spaces with hyphens and appending the ".jpg" extension.
    let coverImgPath = path.join(__dirname, 'public/assets/icons/', `${title.replace(/\s/g, '-')}.jpg`);
    // Write the image to a file
    fs.writeFileSync(coverImgPath, Buffer.from(response.data, 'binary'));
    // Extract the realtive file path
    const relativeCoverImgPath = path.relative(path.join(__dirname, 'public'), coverImgPath).replace(/\\/g, '/');
    // Replace backslashes with forward slashes
    coverImgPath = coverImgPath.replace(/\\/g, '/');

    const data = {
      text: 'INSERT INTO books(bookname, isbn, authorname, readdate, booksummary, rating, coverimgpath) VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [title, ISBN, author, date, content, rating, relativeCoverImgPath],
    };

    const result = await db.query(data);
    res.redirect("/main");
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.render("modify.ejs", { ISBNerror: `${ISBN} already exists.`});
    } 
  }
});

// To render modify.ejs before submitting the added data
app.post("/addForm", async (req, res) => {
    res.render("modify.ejs")
});

// To render modify.ejs with the data already existing info on the form
app.post("/editBook", async (req, res) => {
  try {
    const id = req.body.editItemId;
    const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);
    const book = result.rows[0];
    if (!book) {
      return res.status(404).send('Book not found');
    }
    res.render("modify.ejs", 
      { book: book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching post" });
  }
});

// To add the edited data to the db and update webpage
app.post("/editedBook", async (req, res) => {
  const id = req.body.editedItemId;
  let { title, ISBN, author, date, content, rating } = req.body;

// Validate and sanitize input
const isEmpty = str => (!str || /^\s*$/.test(str));
const isNumeric = str => (!str || /^\d+$/.test(str));

// Stop the execution of the function as soon as an error is encountered. 
// By adding a return statement before each res.render() call
if (isEmpty(title)) {
  return res.render("modify.ejs", { titleError: "Title must not be empty." });
}

if (!isNumeric(ISBN)) {
  return res.render("modify.ejs", { ISBNerror: "ISBN can contain only numbers." });
}

if (isEmpty(author)) {
  return res.render("modify.ejs", { authorError: "Author must not be empty." });
}

if (isEmpty(content)) {
  return res.render("modify.ejs", { contentError: "Summary must not be empty." });
}

  // // Process data
  // Convert to strings and uppercase
  title = title.toString().toUpperCase();
  author = author.toString().toUpperCase();
  content = content.toString(); 
  // See helper function (sentenceCase) above
  content = toSentenceCase(content); 

  // Construct the URL for the Open Library Covers API
  const url = `https://covers.openlibrary.org/b/isbn/${ISBN}-M.jpg`;
  let response;
    // Handle if there is failure to get cover image from the API. This error will be 
    // displayed in ISBN input placeholder in modify.ejs
    try {
      // Fetch the image from the API
      response = await axios.get(url, { responseType: 'arraybuffer' });
    } catch (err) {
      console.error(err);
      return res.render("modify.ejs", { ISBNerror: "Failed to fetch book cover from API." });
    }
  // Construct the file path
  let coverImgPath = path.join(__dirname, 'public/assets/icons/', `${title.replace(/\s/g, '-')}.jpg`);
  // Write the image to a file
  fs.writeFileSync(coverImgPath, Buffer.from(response.data, 'binary'));
  // Extract the relative file path
  coverImgPath = path.relative(path.join(__dirname, 'public'), coverImgPath);
  // Replace backslashes with forward slashes
  coverImgPath = coverImgPath.replace(/\\/g, '/');
  console.log(coverImgPath);
  // Update the book data in the 'books' table
  const data = {
    text: 'UPDATE books SET bookname = $1, isbn = $2, authorname = $3, readdate = $4, booksummary = $5, rating = $6, coverimgpath = $7 WHERE id = $8',
    values: [title, ISBN, author, date, content, rating, coverImgPath, id],
  };

  try {
    await db.query(data); // db updated
    res.redirect("/main");
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});


// Handles all go back by refreshing
app.post("/goBack", (req, res) => {
  res.redirect("/main");
});

// To handle delete
app.post("/delete", async (req, res) => {
  const id = req.body.deleteItemId; // Get the id from the form
  await db.query("DELETE FROM books WHERE id = $1", [id]); // Delete the item with the matching id
  res.redirect("/main");
});

app.post('/sort', async (req, res) => {
  const { sOption, sDirection } = req.body;

  // Validate sortOption and sortDirection
  if (!['rating', 'bookname', 'readdate'].includes(sOption)) {
    return res.status(400).send('Invalid sort option');
  }
  if (!['asc', 'desc'].includes(sDirection)) {
    return res.status(400).send('Invalid sort direction');
  }
  // Redirect with sort parameters in the URL
  res.redirect(`/main?sOption=${sOption}&sDirection=${sDirection}`);
});

// # Handles search by searching (search-as-you-type)
app.get('/searchBook', async (req, res) => {
  const searchQuery = req.query.q;
  // ILIKE is not case sensitive unlike LIKE
  const result = await db.query('SELECT * FROM books WHERE bookname ILIKE $1', [`%${searchQuery}%`]);
  res.json(result.rows);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


// express-session
// express-session is a middleware for Express.js, a popular web framework for Node.js, used for
// managing user sessions.
// When a client makes a request to a server, express-session creates a unique session for that user. 
// This session is identified by a unique ID.
// The session data is stored on the server side. By default, express-session stores session data in memory.
// However, for production environments, it's recommended to use stores like Redis, MongoDB, etc., 
// as in-memory storage is not scalable and can lead to memory leaks.

// app.use(bodyParser.urlencoded({ extended: true }));
// Configure Express to use body-parser middleware.
// This allows Express to handle POST requests with URL-encoded bodies (like form submissions).
// The 'extended: true' option enables parsing of rich objects and arrays encoded in the URL-encoded format.


// app.use(express.static("public"));
// Configure Express to serve static files.
// This line tells Express to look in the 'public' directory for any static files, 
// such as images, CSS files, and JavaScript files, and serve them directly to the client.
// For example, if there is an image at 'public/images/photo.jpg', it can be accessed at 'http://yourserver.com/images/photo.jpg'

// app.set('view engine', 'ejs');
// Set EJS as the templating engine
// This line configures Express to use EJS (Embedded JavaScript) as its templating engine.
// Templating engines allow you to use static template files in your application. 
// At runtime, the templating engine replaces variables in a template file with actual values, 
// and transforms the template into an HTML file sent to the client.
// This makes it easier to design an HTML page with dynamic content.

// app.get("/auth/google",
//   passport.authenticate('google', { scope: ["profile", "email"] })
// );
// Path: "/auth/google" is the route that initiates the authentication process with Google.
// passport.authenticate: This middleware is provided by Passport.js. It uses the 'google' strategy 
// (defined elsewhere in your code) to authenticate users.
// Scope: The scope option specifies what information you want to access from the user's Google account.
// In this case, it's requesting access to the user's profile information and email address.
// Process: When a user hits this route, they are redirected to Google's sign-in page. After they log in,
// Google will redirect them to the callback URL you've specified in your Google Developer Console and
// in your Passport strategy configuration.

// app.get("/auth/google/secrets",
//   passport.authenticate('google', { failureRedirect: "/login" }),
//   function(req, res) {
//     res.redirect("/main");
// //   });
// Path: "/auth/google/secrets" is the callback route that Google redirects to after the user has 
// authenticated. This URL should match the one you've specified in your Google Developer Console.
// passport.authenticate Again: This middleware is called a second time to handle the response from Google.
// If authentication fails (e.g., if the user denies access), Passport redirects the user to the specified
// failureRedirect URL, in this case, "/login".
// Success Handling: If authentication is successful, the callback function is executed, where you can then
// redirect the user to another page, such as "/main" in this case.



// { responseType: 'arraybuffer' } is instructing axios to retrieve the data as a binary string, which
//  can then be written directly to a file using fs.writeFileSync(). This is necessary for correctly 
//  saving the image file.




