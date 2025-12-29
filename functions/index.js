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

        console.log(`[getLoyaltyPoints] Fetching points for customer ${customerId} in program ${ZEROSEI_PROGRAM_ID}`);

        // Fetch customer data
        const customerResponse = await fetch(`${CASSANOVA_API_URL}/customers/${customerId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Version': API_VERSION,
                'X-Requested-With': '*'
            }
        });

        if (!customerResponse.ok) {
            const errorText = await customerResponse.text();
            console.error('Customer API error:', customerResponse.status, errorText);
            throw new functions.https.HttpsError('internal', `Failed to fetch customer data: ${customerResponse.status} - ${errorText}`);
        }

        const customerData = await customerResponse.json();

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
                console.error('[getLoyaltyPoints] Error fetching accounts');
                break;
            }

            const accountsData = await accountsResp.json();
            const batch = accountsData.fidelityPointsAccount || [];
            const totalCount = accountsData.totalCount || 0;

            allAccounts = allAccounts.concat(batch);

            if (batch.length < limit || allAccounts.length >= totalCount) break;
            start += limit;
        }

        console.log(`[getLoyaltyPoints] Downloaded ${allAccounts.length} total accounts`);

        // Filter for this customer's account in ZeroSei program (ID 3159)
        const customerAccount = allAccounts.find(acc =>
            acc.idCustomer === customerId &&
            acc.idFidelityPointsProgram === ZEROSEI_PROGRAM_ID
        );

        let points = 0;
        if (customerAccount) {
            points = customerAccount.amount || 0;
            console.log(`[getLoyaltyPoints] Found ZeroSei account with ${points} points`);
        } else {
            console.log(`[getLoyaltyPoints] No ZeroSei account found for customer ${customerId}`);
        }

        return {
            success: true,
            customerId,
            points: points,
            tier: 'Member',
            lastUpdated: customerData.customer?.lastUpdate || new Date().toISOString()
        };
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

        // 2. Download ALL customers and search client-side
        console.log('[searchAndSync] Downloading all customers...');

        let allCustomers = [];
        let start = 0;
        const limit = 100;

        while (true) {
            const customersUrl = `${CASSANOVA_API_URL}/customers?start=${start}&limit=${limit}`;
            const customersResp = await fetch(customersUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Version': API_VERSION,
                    'X-Requested-With': '*'
                }
            });

            if (!customersResp.ok) {
                console.error('[searchAndSync] Error fetching customers');
                break;
            }

            const customersData = await customersResp.json();
            const batch = customersData.customers || [];
            const totalCount = customersData.totalCount || 0;

            allCustomers = allCustomers.concat(batch);
            console.log(`[searchAndSync] Downloaded ${allCustomers.length}/${totalCount} customers`);

            if (batch.length < limit || allCustomers.length >= totalCount) break;
            start += limit;
        }

        // Find customer by email (case-insensitive)
        const customerFound = allCustomers.find(c =>
            c.email && c.email.toLowerCase() === email.toLowerCase()
        );

        if (!customerFound) {
            console.log('[searchAndSync] Customer NOT found');
            return {
                success: false,
                code: 'CUSTOMER_NOT_FOUND',
                message: 'Nessuna Fidelity Card trovata. Registrati alla cassa!'
            };
        }

        const customerId = customerFound.id;
        console.log(`[searchAndSync] Found customer ${customerId} for email ${email}`);

        // 3. Fetch Points from FidelityPointsAccounts for ZeroSei Program (ID 3159)
        console.log(`[searchAndSync] Fetching points for ${customerId} in program ${ZEROSEI_PROGRAM_ID}`);

        // Download ALL fidelity points accounts
        let allAccounts = [];
        let accStart = 0;
        const accLimit = 100;

        while (true) {
            const accountsUrl = `${CASSANOVA_API_URL}/fidelitypointsaccounts?start=${accStart}&limit=${accLimit}`;
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

            if (batch.length < accLimit || allAccounts.length >= totalCount) break;
            accStart += accLimit;
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
            customerName: `${customerFound.firstName} ${customerFound.lastName}`,
            lastSync: new Date().toISOString()
        };

    } catch (error) {
        console.error('[searchAndSync] Error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
