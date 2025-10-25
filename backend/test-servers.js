const http = require('http');

// Test admin server (port 3000)
const testAdminServer = () => {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3000/', (res) => {
            console.log('✅ Admin Server (3000): Status', res.statusCode);
            resolve(true);
        });
        
        req.on('error', (err) => {
            console.log('❌ Admin Server (3000): Error', err.message);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ Admin Server (3000): Timeout');
            resolve(false);
        });
    });
};

// Test user server (port 5000)
const testUserServer = () => {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5000/', (res) => {
            console.log('✅ User Server (5000): Status', res.statusCode);
            resolve(true);
        });
        
        req.on('error', (err) => {
            console.log('❌ User Server (5000): Error', err.message);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ User Server (5000): Timeout');
            resolve(false);
        });
    });
};

// Test both servers
const testServers = async () => {
    console.log('🔍 Testing servers...\n');
    
    const adminStatus = await testAdminServer();
    const userStatus = await testUserServer();
    
    console.log('\n📊 Server Status:');
    console.log(`Admin Server (3000): ${adminStatus ? '✅ Running' : '❌ Not Running'}`);
    console.log(`User Server (5000): ${userStatus ? '✅ Running' : '❌ Not Running'}`);
    
    if (adminStatus && userStatus) {
        console.log('\n🎉 Both servers are running successfully!');
        console.log('🔧 Admin Login: http://localhost:3000/');
        console.log('🛒 User Login: http://localhost:5000/login');
    } else {
        console.log('\n⚠️  Some servers are not running. Please check the logs.');
    }
};

testServers();
