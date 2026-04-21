
async function test() {
    try {
        console.log('Testing Signup...');
        const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123',
                role: 'community_member'
            })
        });
        const signupData = await signupRes.json();
        console.log('Signup status:', signupRes.status);
        console.log('Signup data:', signupData);
    } catch (error) {
        console.error('Signup failed:', error.message);
    }

    try {
        console.log('\nTesting Login...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login status:', loginRes.status);
        console.log('Login data:', loginData);
    } catch (error) {
        console.error('Login failed:', error.message);
    }
}

test();
