const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns true if the username is valid (not already taken)
const isValid = (username) => {
    return !users.some((user) => user.username === username);
};

// Returns true if username and password match a registered user
const authenticatedUser = (username, password) => {
    return users.some((user) => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Error logging in: username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ username: username }, 'access', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).json({
            message: "User successfully logged in",
            username: username,
            accessToken: accessToken
        });
    }
    return res.status(401).json({ message: "Invalid login. Check username and password" });
});

// Add or modify a book review (review text is sent as a request query)
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (!review) {
        return res.status(400).json({ message: "Review text is required as ?review=..." });
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been added/updated`,
        reviews: books[isbn].reviews
    });
});

// Delete the logged-in user's review for a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (!books[isbn].reviews[username]) {
        return res.status(404).json({ message: `No review by ${username} found for ISBN ${isbn}` });
    }

    delete books[isbn].reviews[username];
    return res.status(200).json({
        message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`,
        reviews: books[isbn].reviews
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
