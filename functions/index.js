const functions = require('firebase-functions');
const fetch = require('node-fetch');

const CASSANOVA_API_URL = 'https://api.cassanova.com';
const API_VERSION = '1.0.0';

exports.getAccessToken = functions.https.onCall(async (data, context) => {
    try {
        const { apiKey } = data;
        if (!apiKey) throw new functions.https.HttpsError('invalid-argument', 'API key is required');

        const response = await fetch(`${CASSANOVA_API_URL}/apikey/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Version': API_VERSION },
            body: JSON.stringify({ apiKey: apiKey })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cassanova API error:', response.status, errorText);
            throw new functions.https.HttpsError('internal', `Failed to get access token: ${response.status} - ${errorText}`);
        }

        const tokenData = await response.json();
        return { success: true, accessToken: tokenData.access_token, expiresIn: tokenData.expires_in || 3600 };
    } catch (error) {
        console.error('Error in getAccessToken:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.getLoyaltyPoints = functions.https.onCall(async (data, context) => {
    try {
        const { accessToken, customerId } = data;
        if (!accessToken || !customerId) throw new functions.https.HttpsError('invalid-argument', 'Access token and customer ID are required');

        const customerResponse = await fetch(`${CASSANOVA_API_URL}/customers/${customerId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Version': API_VERSION }
        });

        if (!customerResponse.ok) {
            const errorText = await customerResponse.text();
            console.error('Customer API error:', customerResponse.status, errorText);
            throw new functions.https.HttpsError('internal', `Failed to fetch customer data: ${customerResponse.status} - ${errorText}`);
        }

        const customerData = await customerResponse.json();

        let points = 0;

        // NEW STRATEGY: Use fidelitypointstransactions endpoint with idCustomer parameter
        // This endpoint accepts idCustomer as a string (not array) and returns all transactions for that customer
        const limit = 1000;
        const transactionsUrl = `${CASSANOVA_API_URL}/fidelitypointstransactions?idCustomer=${customerId}&start=0&limit=${limit}`;
        console.log(`Fetching transactions for customer: ${transactionsUrl}`);

        const transactionsResponse = await fetch(transactionsUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Version': API_VERSION }
        });

        if (!transactionsResponse.ok) {
            console.error('Transactions API error:', transactionsResponse.status, await transactionsResponse.text());
            return { success: true, customerId, points: 0, tier: 'Member', lastUpdated: new Date().toISOString() };
        }

        const transactionsData = await transactionsResponse.json();
        const transactions = transactionsData.fidelityPointsTransaction || [];

        console.log(`Downloaded ${transactions.length} transactions for customer ${customerId}`);

        // Sum all transaction amounts to get total points
        points = transactions.reduce((total, transaction) => {
            return total + (transaction.amount || 0);
        }, 0);

        console.log(`Total points calculated from transactions: ${points}`);

        return { success: true, customerId, points: points, tier: 'Member', lastUpdated: customerData.customer?.lastUpdate || new Date().toISOString() };
    } catch (error) {
        console.error('Error in getLoyaltyPoints:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.syncCustomerData = functions.https.onCall(async (data, context) => {
    try {
        const { accessToken, customerData } = data;
        if (!accessToken || !customerData) throw new functions.https.HttpsError('invalid-argument', 'Access token and customer data are required');

        const response = await fetch(`${CASSANOVA_API_URL}/customers/${customerData.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Version': API_VERSION },
            body: JSON.stringify({ firstName: customerData.firstName, lastName: customerData.lastName, phone: customerData.phone, email: customerData.email })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cassanova API error:', response.status, errorText);
            throw new functions.https.HttpsError('internal', `Failed to sync customer data: ${response.status} - ${errorText}`);
        }

        return { success: true, message: 'Customer data synced successfully' };
    } catch (error) {
        console.error('Error in syncCustomerData:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.searchCustomer = functions.https.onCall(async (data, context) => {
    try {
        const { accessToken, email } = data;
        if (!accessToken) throw new functions.https.HttpsError('invalid-argument', 'Access token is required');
        if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email is required');

        let foundCustomer = null;
        let page = 0;
        const limit = 100;
        const maxPages = 100;
        let totalScanned = 0;

        while (page < maxPages && !foundCustomer) {
            const response = await fetch(`${CASSANOVA_API_URL}/customers?start=${page * limit}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Version': API_VERSION }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cassanova API error:', response.status, errorText);
                throw new functions.https.HttpsError('internal', `Failed to search customer: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            const customers = result.customers || (Array.isArray(result) ? result : []);
            if (customers.length === 0) break;

            totalScanned += customers.length;
            foundCustomer = customers.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
            if (foundCustomer) break;
            page++;
        }

        if (foundCustomer) {
            return {
                success: true,
                customer: { id: foundCustomer.id, firstName: foundCustomer.firstName, lastName: foundCustomer.lastName, email: foundCustomer.email, phone: foundCustomer.phoneNumber }
            };
        }

        return { success: false, message: `Customer not found after scanning ${totalScanned} records`, debug: { totalScanned, pages: page, searchedEmail: email } };
    } catch (error) {
        console.error('Error in searchCustomer:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
