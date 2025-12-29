const functions = require('firebase-functions');
const fetch = require('node-fetch');

const CASSANOVA_API_URL = 'https://api.cassanova.com';
const API_VERSION = '2.0.0'; // Updated to 2.0.0
const ZEROSEI_PROGRAM_ID = 3159; // Fidelity Card ZeroSei 24/25

// Get API Key from Firebase config
function getApiKey() {
    const config = functions.config();
    return config.cassanova && config.cassanova.api_key ? config.cassanova.api_key : null;
}

exports.getAccessToken = functions.https.onCall(async (data, context) => {
    try {
        // Get API Key from Firebase config (secure!)
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'API Key not configured in Firebase');
        }

        const response = await fetch(`${CASSANOVA_API_URL}/apikey/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Version': API_VERSION,
                'X-Requested-With': '*'
            },
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

/**
 * Cerca un cliente CassaCloud e sincronizza i punti (SOLO RICERCA)
 * 1. Cerca per Email
 * 2. Se non trova, cerca per Nome/Cognome
 * 3. Se non trova, restituisce errore (Nessuna creazione)
 * 4. Se trova, recupera le transazioni e somma i punti
 */
exports.searchAndSyncFidelityPoints = functions.https.onCall(async (data, context) => {
    try {
        const { email, firstName, lastName, phone } = data;
        if (!email) throw new functions.https.HttpsError('invalid-argument', 'Email is required');

        console.log(`[searchAndSync] Start search for: ${email}, ${firstName} ${lastName}`);

        // 1. Get Access Token from Firebase config
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new functions.https.HttpsError('failed-precondition', 'API Key not configured in Firebase');
        }

        const tokenResponse = await fetch(`${CASSANOVA_API_URL}/apikey/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Version': API_VERSION,
                'X-Requested-With': '*'
            },
            body: JSON.stringify({ apiKey })
        });

        if (!tokenResponse.ok) throw new Error('Auth failed');
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // 2. Search Strategy
        let customerId = null;
        let customerDataFound = null;

        // A. Try Email
        console.log('[searchAndSync] Searching by Email...');
        const emailSearchUrl = `${CASSANOVA_API_URL}/customers?filter=email==${encodeURIComponent(email)}`;
        const emailResp = await fetch(emailSearchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Version': API_VERSION }
        });

        if (emailResp.ok) {
            const res = await emailResp.json();
            const list = res.customers || (Array.isArray(res) ? res : []);
            if (list.length > 0) {
                customerId = list[0].id;
                customerDataFound = list[0];
                console.log(`[searchAndSync] Found by Email: ${customerId}`);
            }
        }

        // B. Try Name + Surname (if not found by email)
        if (!customerId && firstName && lastName) {
            console.log('[searchAndSync] Searching by Name...');
            const nameSearchUrl = `${CASSANOVA_API_URL}/customers?filter=firstName==${encodeURIComponent(firstName)};lastName==${encodeURIComponent(lastName)}`;
            const nameResp = await fetch(nameSearchUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'X-Version': API_VERSION }
            });

            if (nameResp.ok) {
                const res = await nameResp.json();
                const list = res.customers || (Array.isArray(res) ? res : []);

                if (list.length === 1) {
                    customerId = list[0].id; // Unique match
                    customerDataFound = list[0];
                    console.log(`[searchAndSync] Found by Name (Unique): ${customerId}`);
                } else if (list.length > 1) {
                    // Try to disambiguate with phone
                    if (phone) {
                        const phoneMatch = list.find(c => c.phoneNumber === phone || c.phone === phone);
                        if (phoneMatch) {
                            customerId = phoneMatch.id;
                            customerDataFound = phoneMatch;
                            console.log(`[searchAndSync] Found by Name + Phone match: ${customerId}`);
                        }
                    }

                    if (!customerId) {
                        // Still ambiguous? Return conflict
                        console.warn('[searchAndSync] Multiple customers found, ambiguous');
                        return {
                            success: false,
                            code: 'MULTIPLE_CUSTOMERS',
                            message: 'Trovati più clienti con lo stesso nome. Contatta il negozio.'
                        };
                    }
                }
            }
        }

        if (!customerId) {
            console.log('[searchAndSync] Customer NOT found');
            return {
                success: false,
                code: 'CUSTOMER_NOT_FOUND',
                message: 'Nessuna Fidelity Card trovata per i tuoi dati. Registrati alla cassa!'
            };
        }

        // 3. Fetch Points from FidelityPointsAccounts for ZeroSei Program (ID 3159)
        console.log(`[searchAndSync] Fetching points for ${customerId} in program ${ZEROSEI_PROGRAM_ID}`);

        // Download ALL fidelity points accounts
        let allAccounts = [];
        let start = 0;
        const limit = 100;

        while (true) {
            const accountsUrl = `${CASSANOVA_API_URL}/fidelitypointsaccounts?start=${start}&limit=${limit}`;
            const accountsResp = await fetch(accountsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Version': API_VERSION,
                    'X-Requested-With': '*'
                }
            });

            if (!accountsResp.ok) {
                console.error('[searchAndSync] Error fetching accounts');
                break;
            }

            const accountsData = await accountsResp.json();
            const batch = accountsData.fidelityPointsAccount || [];
            const totalCount = accountsData.totalCount || 0;

            allAccounts = allAccounts.concat(batch);

            if (batch.length < limit || allAccounts.length >= totalCount) break;
            start += limit;
        }

        console.log(`[searchAndSync] Downloaded ${allAccounts.length} total accounts`);

        // Filter for this customer's account in ZeroSei program
        const customerAccount = allAccounts.find(acc =>
            acc.idCustomer === customerId &&
            acc.idFidelityPointsProgram === ZEROSEI_PROGRAM_ID
        );

        let points = 0;
        if (customerAccount) {
            points = customerAccount.amount || 0;
            console.log(`[searchAndSync] Found ZeroSei account with ${points} points`);
        } else {
            console.log(`[searchAndSync] No ZeroSei account found for customer ${customerId}`);
        }

        return {
            success: true,
            customerId: customerId,
            points: points,
            customerName: `${customerDataFound.firstName} ${customerDataFound.lastName}`,
            lastSync: new Date().toISOString()
        };

    } catch (error) {
        console.error('[searchAndSync] Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
