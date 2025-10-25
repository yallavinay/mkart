const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const path = require('path');

// Excel file path
const excelFilePath = path.join(__dirname, 'users.xlsx'); // Correct path to users.xlsx

// Helper function to read Excel data
function readExcelData() {
    // ... Your existing logic
}

// Helper function to write Excel data
function writeExcelData(users) {
    // ... Your existing logic
}

// Route to save shipping details
router.post('/save-shipping-details', (req, res) => {
    const { firstName, lastName, mobile, pinCode, state, district, address } = req.body;
    const users = readExcelData();
    const username = req.session.username; // Get the username from session

    const user = users.find((user) => user.username === username);

    if (!user) {
        return res.status(404).json({ message: 'User not found!' });
    }

    // Update user's shipping details
    user.shippingDetails = { firstName, lastName, mobile, pinCode, state, district, address };
    writeExcelData(users); // Write updated data back to Excel

    res.status(200).json({ message: 'Shipping details saved successfully!' });
    // window.location.href = '/review';
});

// Route to update shipping details (if needed)
router.post('/update-shipping-details', (req, res) => {
    // ... Your existing logic
});

module.exports = router;
