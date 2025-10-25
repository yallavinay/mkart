const db = require('../config/db');

// Get all medicines
exports.getAll = (req, res) => {
    const query = 'SELECT * FROM medicines';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching medicines');
        }
        res.json(results);  // Send the list of medicines as JSON response
    });
};

// Add a new medicine
exports.addMedicine = (req, res) => {
    const { name, price, image, stock } = req.body;
    const query = 'INSERT INTO medicines (name, price, image, stock) VALUES (?, ?, ?, ?)';
    db.query(query, [name, price, image, stock], (err, results) => {
        if (err) {
            return res.status(500).send('Error adding medicine');
        }
        res.json({ message: 'Medicine added successfully', id: results.insertId });
    });
};

// Search medicines by name
exports.searchMedicine = (req, res) => {
    const searchQuery = req.query.name;  // Get the search term from query parameters
    if (!searchQuery) {
        return res.status(400).send('Search term is required');
    }

    const query = 'SELECT * FROM medicines WHERE name LIKE ?';
    db.query(query, [`%${searchQuery}%`], (err, results) => {
        if (err) {
            return res.status(500).send('Error searching medicines');
        }
        if (results.length === 0) {
            return res.status(404).send('No medicines found');
        }
        res.json(results);  // Send the search results as JSON response
    });
};
