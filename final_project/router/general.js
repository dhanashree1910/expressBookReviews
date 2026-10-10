const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL of this server. The Axios calls below fetch the book data over HTTP.
const BASE_URL = "http://localhost:5000";

/* ------------------------------------------------------------------
 * Task 7: Register a new user
 * ------------------------------------------------------------------ */
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
    if (!isValid(username)) {
        return res.status(409).json({ message: "User already exists" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/* ------------------------------------------------------------------
 * Data endpoint: returns the raw book database as JSON.
 * The Axios functions below call this endpoint.
 * ------------------------------------------------------------------ */
public_users.get('/booksdb', (req, res) => {
    return res.status(200).json(books);
});

/* ==================================================================
 * Axios functions (Promise callbacks and async/await)
 * ================================================================== */

// Get all books - Promise callbacks (.then/.catch)
const getAllBooks = () => {
    return axios.get(`${BASE_URL}/booksdb`)
        .then((response) => response.data)
        .catch((error) => {
            throw new Error(`Failed to fetch books: ${error.message}`);
        });
};

// Get book details by ISBN - Promise callbacks (.then/.catch)
const getBookByISBN = (isbn) => {
    return axios.get(`${BASE_URL}/booksdb`)
        .then((response) => response.data[isbn])
        .catch((error) => {
            throw new Error(`Failed to fetch book with ISBN ${isbn}: ${error.message}`);
        });
};

// Get book details by author - async/await
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`${BASE_URL}/booksdb`);
        const allBooks = response.data;
        // Keep only the books whose author matches (case-insensitive), and add the ISBN to each
        return Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].author.toLowerCase() === author.toLowerCase())
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));
    } catch (error) {
        throw new Error(`Failed to fetch books by author ${author}: ${error.message}`);
    }
};

// Get book details by title - async/await
const getBooksByTitle = async (title) => {
    try {
        const response = await axios.get(`${BASE_URL}/booksdb`);
        const allBooks = response.data;
        // Keep only the books whose title matches (case-insensitive), and add the ISBN to each
        return Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].title.toLowerCase() === title.toLowerCase())
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));
    } catch (error) {
        throw new Error(`Failed to fetch books by title ${title}: ${error.message}`);
    }
};

/* ------------------------------------------------------------------
 * Task 2: Get the list of all books (Axios + Promise callbacks)
 * ------------------------------------------------------------------ */
public_users.get('/', (req, res) => {
    getAllBooks()
        .then((allBooks) => res.status(200).send(JSON.stringify(allBooks, null, 4)))
        .catch((error) => res.status(500).json({ message: error.message }));
});

/* ------------------------------------------------------------------
 * Task 3: Get book details by ISBN (Axios + Promise callbacks)
 * ------------------------------------------------------------------ */
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    getBookByISBN(isbn)
        .then((book) => {
            if (book) {
                return res.status(200).send(JSON.stringify(book, null, 4));
            }
            return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
        })
        .catch((error) => res.status(500).json({ message: error.message }));
});

/* ------------------------------------------------------------------
 * Task 4: Get book details by author (Axios + async/await)
 * ------------------------------------------------------------------ */
public_users.get('/author/:author', async (req, res) => {
    try {
        const result = await getBooksByAuthor(req.params.author);
        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
        }
        return res.status(404).json({ message: `No books found for author ${req.params.author}` });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

/* ------------------------------------------------------------------
 * Task 5: Get book details by title (Axios + async/await)
 * ------------------------------------------------------------------ */
public_users.get('/title/:title', async (req, res) => {
    try {
        const result = await getBooksByTitle(req.params.title);
        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
        }
        return res.status(404).json({ message: `No books found with title ${req.params.title}` });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

/* ------------------------------------------------------------------
 * Task 6: Get book review
 * ------------------------------------------------------------------ */
public_users.get('/review/:isbn', (req, res) => {
    const book = books[req.params.isbn];
    if (book) {
        return res.status(200).send(JSON.stringify(book.reviews, null, 4));
    }
    return res.status(404).json({ message: `Book with ISBN ${req.params.isbn} not found` });
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
