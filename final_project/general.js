const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

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
 * Helper: simulates an asynchronous data source using a Promise
 * ------------------------------------------------------------------ */
const fetchBooks = () => new Promise((resolve) => resolve(books));

/* ------------------------------------------------------------------
 * Task 2: Get all books
 * ------------------------------------------------------------------ */
public_users.get('/', (req, res) => {
    fetchBooks().then((allBooks) => {
        return res.status(200).send(JSON.stringify(allBooks, null, 4));
    });
});

/* ------------------------------------------------------------------
 * Task 3: Get book details by ISBN
 * ------------------------------------------------------------------ */
public_users.get('/isbn/:isbn', (req, res) => {
    fetchBooks().then((allBooks) => {
        const book = allBooks[req.params.isbn];
        if (book) {
            return res.status(200).send(JSON.stringify(book, null, 4));
        }
        return res.status(404).json({ message: `Book with ISBN ${req.params.isbn} not found` });
    });
});

/* ------------------------------------------------------------------
 * Task 4: Get book details by author
 * ------------------------------------------------------------------ */
public_users.get('/author/:author', (req, res) => {
    fetchBooks().then((allBooks) => {
        const author = req.params.author.toLowerCase();
        const result = Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].author.toLowerCase() === author)
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));

        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbyauthor: result }, null, 4));
        }
        return res.status(404).json({ message: `No books found for author ${req.params.author}` });
    });
});

/* ------------------------------------------------------------------
 * Task 5: Get book details by title
 * ------------------------------------------------------------------ */
public_users.get('/title/:title', (req, res) => {
    fetchBooks().then((allBooks) => {
        const title = req.params.title.toLowerCase();
        const result = Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].title.toLowerCase() === title)
            .map((isbn) => ({ isbn, ...allBooks[isbn] }));

        if (result.length > 0) {
            return res.status(200).send(JSON.stringify({ booksbytitle: result }, null, 4));
        }
        return res.status(404).json({ message: `No books found with title ${req.params.title}` });
    });
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

/* ==================================================================
 * Task 11: Axios client functions (Promise callbacks and async/await)
 * They call the endpoints above over HTTP.
 * ================================================================== */

// Get all books - using Promise callbacks
const getAllBooks = () => {
    return axios.get(`${BASE_URL}/`)
        .then((response) => response.data)
        .catch((error) => {
            throw new Error(`Failed to fetch books: ${error.message}`);
        });
};

// Get book details by ISBN - using Promise callbacks
const getBookByISBN = (isbn) => {
    return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
        .then((response) => response.data)
        .catch((error) => {
            throw new Error(`Failed to fetch book with ISBN ${isbn}: ${error.message}`);
        });
};

// Get book details by author - using async/await
const getBooksByAuthor = async (author) => {
    try {
        const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch books by author ${author}: ${error.message}`);
    }
};

// Get book details by title - using async/await
const getBooksByTitle = async (title) => {
    try {
        const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch books by title ${title}: ${error.message}`);
    }
};

/* Routes that exercise the Axios client functions above */
public_users.get('/async/books', (req, res) => {
    getAllBooks()
        .then((data) => res.status(200).json(data))
        .catch((err) => res.status(500).json({ message: err.message }));
});

public_users.get('/async/isbn/:isbn', (req, res) => {
    getBookByISBN(req.params.isbn)
        .then((data) => res.status(200).json(data))
        .catch((err) => res.status(500).json({ message: err.message }));
});

public_users.get('/async/author/:author', async (req, res) => {
    try {
        res.status(200).json(await getBooksByAuthor(req.params.author));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

public_users.get('/async/title/:title', async (req, res) => {
    try {
        res.status(200).json(await getBooksByTitle(req.params.title));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
