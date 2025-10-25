// public/scripts/review.js

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch cart items from the server
        const cartResponse = await fetch('/get-cart-items'); // Endpoint to get cart items
        const cartItems = await cartResponse.json();

        // Display cart items
        const itemList = document.getElementById('item-list');
        if (cartItems.length === 0) {
            itemList.innerHTML = '<li>No items in cart.</li>';
        } else {
            cartItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.name} - ${item.quantity} pcs`;
                itemList.appendChild(li);
            });
        }

        // Fetch shipping details from the server
        const shippingResponse = await fetch('/get-shipping-details'); // Endpoint to get shipping details
        const shippingDetails = await shippingResponse.json();

        // Display shipping details
        const address = document.getElementById('address');
        address.textContent = `Name: ${shippingDetails.firstName} ${shippingDetails.lastName}, 
                              Mobile: ${shippingDetails.mobile}, 
                              Address: ${shippingDetails.address}, 
                              ${shippingDetails.district}, ${shippingDetails.state}, 
                              Pin Code: ${shippingDetails.pinCode}`;
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('An error occurred while loading your review page.');
    }
});
