const sendPush = async (token, title, body) => {
    if (!token || !token.startsWith('ExponentPushToken')) return;
    try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ to: token, title, body, sound: 'default', priority: 'high' }),
        });
        const json = await res.json();
        if (json.data?.status === 'error') {
            console.error('Expo push error:', json.data.message);
        }
    } catch (err) {
        console.error('Push send failed:', err.message);
    }
};

export default sendPush;
