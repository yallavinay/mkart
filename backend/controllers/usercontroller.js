const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = (req, res) => {
    const { username, email, password } = req.body;

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('Error hashing password');
        }

        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, results) => {
            if (err) {
                return res.status(500).send('Error registering user');
            }
            res.status(200).json({ message: 'User registered successfully!' });
        });
    });
};

// Login user
exports.login = (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            return res.status(500).send('Error checking user');
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password with the hashed one in the database
        bcrypt.compare(password, results[0].password, (err, isMatch) => {
            if (err) {
                return res.status(500).send('Error comparing passwords');
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Create JWT token
            const token = jwt.sign({ userId: results[0].id, username: results[0].username }, 'secretKey', { expiresIn: '1h' });
            res.status(200).json({ message: 'Login successful!', token });
        });
    });
};
