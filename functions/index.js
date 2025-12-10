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

/**
 * Sincronizza i punti fedeltà per un utente dall'app
 * Flusso completo: autenticazione → ricerca/creazione cliente → recupero punti
 */
exports.syncFidelityPoints = functions.https.onCall(async (data, context) => {
    try {
        const { email, firstName, lastName, phone } = data;

        if (!email || !firstName || !lastName) {
            throw new functions.https.HttpsError('invalid-argument', 'Email, firstName e lastName sono obbligatori');
        }

        console.log(`[syncFidelityPoints] Inizio sync per ${email}`);

        // Step 1: Ottieni token
        const API_KEY = '052ee020-a2bb-4383-9ab0-dfef25dd8345';
        const tokenResponse = await fetch(`${CASSANOVA_API_URL}/apikey/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Version': API_VERSION },
            body: JSON.stringify({ apiKey: API_KEY })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token error:', tokenResponse.status, errorText);
            throw new functions.https.HttpsError('internal', 'Errore autenticazione con Cassa in Cloud');
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        console.log('[syncFidelityPoints] Token ottenuto');

        // Step 2: Cerca cliente per email
        let customerId = null;
        let customerFound = false;

        // Usa filtro email se supportato
        const searchUrl = `${CASSANOVA_API_URL}/customers?filter=email==${encodeURIComponent(email)}`;
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Version': API_VERSION
            }
        });

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const customers = searchData.customers || (Array.isArray(searchData) ? searchData : []);

            if (customers.length > 0) {
                customerId = customers[0].id;
                customerFound = true;
                console.log(`[syncFidelityPoints] Cliente trovato: ${customerId}`);
            }
        }

        // Step 2b: Se non trovato, cerca per nome e cognome
        if (!customerFound) {
            console.log('[syncFidelityPoints] Cliente non trovato per email, cerco per nome');
            const nameSearchUrl = `${CASSANOVA_API_URL}/customers?filter=firstName==${encodeURIComponent(firstName)};lastName==${encodeURIComponent(lastName)}`;
            const nameSearchResponse = await fetch(nameSearchUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Version': API_VERSION
                }
            });

            if (nameSearchResponse.ok) {
                const nameSearchData = await nameSearchResponse.json();
                const nameCustomers = nameSearchData.customers || (Array.isArray(nameSearchData) ? nameSearchData : []);

                if (nameCustomers.length === 1) {
                    customerId = nameCustomers[0].id;
                    customerFound = true;
                    console.log(`[syncFidelityPoints] Cliente trovato per nome: ${customerId}`);
                } else if (nameCustomers.length > 1) {
                    // Multipli risultati - disambigua con telefono se fornito
                    if (phone) {
                        const phoneMatch = nameCustomers.find(c => c.phoneNumber === phone);
                        if (phoneMatch) {
                            customerId = phoneMatch.id;
                            customerFound = true;
                            console.log(`[syncFidelityPoints] Cliente disambiguato con telefono: ${customerId}`);
                        }
                    }

                    if (!customerFound) {
                        return {
                            success: false,
                            errorCode: 'MULTIPLE_CUSTOMERS',
                            message: 'Trovati multipli clienti con stesso nome',
                            customers: nameCustomers.slice(0, 5).map(c => ({
                                id: c.id,
                                firstName: c.firstName,
                                lastName: c.lastName,
                                email: c.email,
                                phone: c.phoneNumber
                            }))
                        };
                    }
                }
            }
        }

        // Step 3: Se ancora non trovato, crea nuovo cliente
        if (!customerFound) {
            console.log('[syncFidelityPoints] Cliente non trovato, creo nuovo');
            const createPayload = {
                firstName,
                lastName,
                email,
                ...(phone && { phoneNumber: phone })
            };

            const createResponse = await fetch(`${CASSANOVA_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Version': API_VERSION
                },
                body: JSON.stringify(createPayload)
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                console.error('Create customer error:', createResponse.status, errorText);

                // Verifica se è errore "already exists"
                if (errorText.includes('already exists') || createResponse.status === 409) {
                    // Ritenta ricerca
                    console.log('[syncFidelityPoints] Cliente già esiste, ritento ricerca');
                    const retrySearchResponse = await fetch(`${CASSANOVA_API_URL}/customers?filter=email==${encodeURIComponent(email)}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                            'X-Version': API_VERSION
                        }
                    });

                    if (retrySearchResponse.ok) {
                        const retryData = await retrySearchResponse.json();
                        const retryCustomers = retryData.customers || (Array.isArray(retryData) ? retryData : []);
                        if (retryCustomers.length > 0) {
                            customerId = retryCustomers[0].id;
                        }
                    }
                }

                if (!customerId) {
                    throw new functions.https.HttpsError('internal', 'Impossibile creare o trovare cliente');
                }
            } else {
                const createData = await createResponse.json();
                customerId = createData.customer?.id || createData.id;
                console.log(`[syncFidelityPoints] Nuovo cliente creato: ${customerId}`);
            }
        }

        // Step 4: Recupera circuito fidelity
        console.log('[syncFidelityPoints] Cerco circuito fidelity "Fidelity Card ZeroSei 24/25"');
        const circuitsResponse = await fetch(`${CASSANOVA_API_URL}/fidelitycircuit`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Version': API_VERSION
            }
        });

        let programId = null;
        if (circuitsResponse.ok) {
            const circuitsData = await circuitsResponse.json();
            const circuits = circuitsData.fidelityCircuit || (Array.isArray(circuitsData) ? circuitsData : []);
            const targetCircuit = circuits.find(c => c.name === 'Fidelity Card ZeroSei 24/25');

            if (targetCircuit) {
                programId = targetCircuit.id;
                console.log(`[syncFidelityPoints] Circuito trovato: ${programId}`);
            } else {
                console.warn('[syncFidelityPoints] Circuito "Fidelity Card ZeroSei 24/25" non trovato');
            }
        }

        // Step 5: Recupera punti usando transazioni
        let points = 0;
        const limit = 1000;
        const transactionsUrl = programId
            ? `${CASSANOVA_API_URL}/fidelitypointstransactions?idCustomer=${customerId}&idsFidelityPointsPrograms=${programId}&start=0&limit=${limit}`
            : `${CASSANOVA_API_URL}/fidelitypointstransactions?idCustomer=${customerId}&start=0&limit=${limit}`;

        console.log(`[syncFidelityPoints] Recupero punti: ${transactionsUrl}`);

        const transactionsResponse = await fetch(transactionsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Version': API_VERSION
            }
        });

        if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            const transactions = transactionsData.fidelityPointsTransaction || [];

            points = transactions.reduce((total, transaction) => {
                return total + (transaction.amount || 0);
            }, 0);

            console.log(`[syncFidelityPoints] Punti calcolati: ${points} (da ${transactions.length} transazioni)`);
        } else {
            console.warn('[syncFidelityPoints] Errore recupero punti, uso 0 come default');
        }

        // Step 6: Ritorna risultato
        return {
            success: true,
            customerId,
            points,
            programId,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        console.error('[syncFidelityPoints] Errore:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
