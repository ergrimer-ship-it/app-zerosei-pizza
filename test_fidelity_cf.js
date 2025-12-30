
async function testSearchAndSync() {
    const url = 'https://us-central1-app-zerosei-pizza.cloudfunctions.net/searchAndSyncFidelityPoints';
    const body = {
        data: {
            email: 'grimaldi.andrea88@gmail.com',
            firstName: 'Andrea',
            lastName: 'Grimaldi'
        }
    };

    console.log('Calling Cloud Function:', url);
    console.log('Payload:', JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }

        const json = await response.json();
        console.log('Success! Result:', JSON.stringify(json, null, 2));

        if (json.result && json.result.success) {
            console.log('POINTS:', json.result.points);
            if (json.result.points === 12) {
                console.log('VERIFICATION PASSED: Points are 12 as expected.');
            } else {
                console.warn('VERIFICATION WARNING: Points are not 12. Maybe updated?');
            }
        } else {
            console.error('VERIFICATION FAILED: Operation unsuccessful.');
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testSearchAndSync();
