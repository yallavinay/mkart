
document.getElementById('pin-code').addEventListener('input', function () {
    const validPincodes = ['533262', '654321','533001']; // Add your valid pin codes here
    const pinCode = this.value;
    const proceedButton = document.getElementById('proceed-btn');
    proceedButton.disabled = !validPincodes.includes(pinCode);
});

// Handle form submission
document.getElementById('shipping-form').addEventListener('submit', async function (event) {
    event.preventDefault(); 

    const shippingDetails = {
        firstName: document.getElementById('first-name').value,
        lastName: document.getElementById('last-name').value,
        mobile: document.getElementById('mobile').value,
        pinCode: document.getElementById('pin-code').value,
        state: document.getElementById('state').value,
        district: document.getElementById('district').value,
        address: document.getElementById('address').value,
    };

    try {
        const response = await fetch('/save-shipping-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shippingDetails),
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message); // Success message
            window.location.href = '/review'; // Redirect to the review page
            document.getElementById('shipping-form').reset(); // Clear the form
        } else {
            alert(data.message); // Error message
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while saving shipping details.');
    }
});
