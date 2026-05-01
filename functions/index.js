const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

const CASSANOVA_API_URL = 'https://api.cassanova.com';
const API_VERSION = '2.0.0';
const ZEROSEI_PROGRAM_ID = 3159;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 ora

function getApiKey() {
    return process.env.CASSANOVA_API_KEY || null;
}

// Converte email in un ID documento Firestore valido
function emailToDocId(email) {
    return email.toLowerCase().replace(/[@.+]/g, '_');
}

// Token Cassanova con cache in Firestore (evita di ri-autenticarsi ogni volta)
async function getCassanovaToken() {
    const tokenRef = db.collection('fidelity_cache').doc('_token');
    const tokenDoc = await tokenRef.get();

    if (tokenDoc.exists) {
        const { accessToken, expiresAt } = tokenDoc.data();
        if (Date.now() < expiresAt - 60000) { // 1 minuto di margine
            console.log('[token] Usando token dalla cache Firestore');
            return accessToken;
        }
    }

    console.log('[token] Token scaduto o assente, richiedo nuovo token a Cassanova');
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'API Key non configurata');
    }

    const response = await fetch(`${CASSANOVA_API_URL}/apikey/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Version': API_VERSION,
            'X-Requested-With': '*'
        },
        body: JSON.stringify({ apiKey })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new functions.https.HttpsError('internal', `Auth Cassanova fallita: ${response.status} - ${err}`);
    }

    const tokenData = await response.json();
    const expiresIn = tokenData.expires_in || 3600;

    await tokenRef.set({
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + expiresIn * 1000
    });

    return tokenData.access_token;
}

// Scarica tutte le pagine di un endpoint Cassanova (100 alla volta)
async function fetchAllPages(baseUrl, accessToken, dataKey) {
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'X-Version': API_VERSION,
        'X-Requested-With': '*'
    };

    let all = [];
    let start = 0;
    const limit = 100;

    while (true) {
        const resp = await fetch(`${baseUrl}?start=${start}&limit=${limit}`, { headers });
        if (!resp.ok) {
            console.error(`[fetchAllPages] Errore su ${baseUrl}: ${resp.status}`);
            break;
        }
        const data = await resp.json();
        const batch = data[dataKey] || [];
        const total = data.totalCount || 0;
        all = all.concat(batch);
        if (batch.length < limit || all.length >= total) break;
        start += limit;
    }

    return all;
}

// Mantiene la firma originale per compatibilità con il frontend
exports.getAccessToken = functions.https.onCall(async (data, context) => {
    try {
        const accessToken = await getCassanovaToken();
        return { success: true, accessToken, expiresIn: 3600 };
    } catch (error) {
        console.error('Error in getAccessToken:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

exports.getLoyaltyPoints = functions.https.onCall(async (data, context) => {
    try {
        const { accessToken, customerId } = data;
        if (!accessToken || !customerId) {
            throw new functions.https.HttpsError('invalid-argument', 'Access token e customer ID richiesti');
        }

        console.log(`[getLoyaltyPoints] Fetching points for customer ${customerId}`);

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
            throw new functions.https.HttpsError('internal', `Errore cliente: ${customerResponse.status} - ${errorText}`);
        }

        const customerData = await customerResponse.json();

        const allAccounts = await fetchAllPages(
            `${CASSANOVA_API_URL}/fidelitypointsaccounts`,
            accessToken,
            'fidelityPointsAccount'
        );

        const customerAccount = allAccounts.find(acc =>
            acc.idCustomer === customerId &&
            acc.idFidelityPointsProgram === ZEROSEI_PROGRAM_ID
        );

        const points = customerAccount ? (customerAccount.amount || 0) : 0;
        console.log(`[getLoyaltyPoints] Punti trovati: ${points}`);

        return {
            success: true,
            customerId,
            points,
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
        if (!accessToken || !customerData) {
            throw new functions.https.HttpsError('invalid-argument', 'Access token e dati cliente richiesti');
        }

        const response = await fetch(`${CASSANOVA_API_URL}/customers/${customerData.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Version': API_VERSION
            },
            body: JSON.stringify({
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                phone: customerData.phone,
                email: customerData.email
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new functions.https.HttpsError('internal', `Sync fallita: ${response.status} - ${errorText}`);
        }

        return { success: true, message: 'Dati cliente sincronizzati' };
    } catch (error) {
        console.error('Error in syncCustomerData:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Cerca un cliente in Cassanova per email e recupera i suoi punti fidelity.
 * Usa una cache Firestore per email con TTL di 1 ora per evitare
 * di scaricare tutti i clienti ad ogni chiamata.
 */
exports.searchAndSyncFidelityPoints = functions.https.onCall(async (data, context) => {
    try {
        const { email, firstName, lastName, forceRefresh } = data;
        if (!email) {
            throw new functions.https.HttpsError('invalid-argument', 'Email richiesta');
        }

        const docId = emailToDocId(email);
        const cacheRef = db.collection('fidelity_cache').doc(docId);

        // Controlla cache Firestore
        if (!forceRefresh) {
            const cacheDoc = await cacheRef.get();
            if (cacheDoc.exists) {
                const cached = cacheDoc.data();
                const age = Date.now() - cached.cachedAt;
                if (age < CACHE_TTL_MS) {
                    console.log(`[searchAndSync] Cache hit per ${email} (${Math.round(age / 60000)}min fa)`);
                    return {
                        success: true,
                        customerId: cached.customerId,
                        points: cached.points,
                        customerName: cached.customerName,
                        lastSync: cached.lastSync,
                        fromCache: true
                    };
                }
                console.log(`[searchAndSync] Cache scaduta per ${email}, ri-scarico da Cassanova`);
            }
        } else {
            console.log(`[searchAndSync] forceRefresh=true, salto la cache per ${email}`);
        }

        // Cache miss o scaduta: recupera dati freschi da Cassanova
        const accessToken = await getCassanovaToken();

        console.log(`[searchAndSync] Scarico lista clienti da Cassanova...`);
        const allCustomers = await fetchAllPages(
            `${CASSANOVA_API_URL}/customers`,
            accessToken,
            'customers'
        );
        console.log(`[searchAndSync] Trovati ${allCustomers.length} clienti totali`);

        const customerFound = allCustomers.find(c =>
            c.email && c.email.toLowerCase() === email.toLowerCase()
        );

        if (!customerFound) {
            console.log(`[searchAndSync] Nessun cliente trovato per ${email}`);
            return {
                success: false,
                code: 'CUSTOMER_NOT_FOUND',
                message: 'Nessuna Fidelity Card trovata. Registrati alla cassa!'
            };
        }

        const customerId = customerFound.id;
        console.log(`[searchAndSync] Cliente trovato: ${customerId}`);

        const allAccounts = await fetchAllPages(
            `${CASSANOVA_API_URL}/fidelitypointsaccounts`,
            accessToken,
            'fidelityPointsAccount'
        );

        const customerAccount = allAccounts.find(acc =>
            acc.idCustomer === customerId &&
            acc.idFidelityPointsProgram === ZEROSEI_PROGRAM_ID
        );

        const points = customerAccount ? (customerAccount.amount || 0) : 0;
        const customerName = `${customerFound.firstName} ${customerFound.lastName}`;
        const lastSync = new Date().toISOString();

        console.log(`[searchAndSync] Punti ZeroSei: ${points} — salvo in cache Firestore`);

        // Salva risultato in cache Firestore
        await cacheRef.set({
            customerId,
            points,
            customerName,
            lastSync,
            cachedAt: Date.now()
        });

        return {
            success: true,
            customerId,
            points,
            customerName,
            lastSync,
            fromCache: false
        };

    } catch (error) {
        console.error('[searchAndSync] Errore:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ─── Admin Functions ──────────────────────────────────────────────────────────

// Converte Firestore Timestamps in ISO string prima di restituire al client
function serializeDoc(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (value && typeof value.toDate === 'function') {
            result[key] = value.toDate().toISOString();
        } else {
            result[key] = value;
        }
    }
    return result;
}

function verifyAdminToken(token) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || token !== expected) {
        throw new functions.https.HttpsError('permission-denied', 'Accesso negato');
    }
}

// Login admin: verifica la password e restituisce il token di sessione
exports.adminLogin = functions.https.onCall(async (data, context) => {
    const { password } = data;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
        throw new functions.https.HttpsError('unauthenticated', 'Password non corretta');
    }
    return { success: true, token: process.env.ADMIN_TOKEN };
});

// Lettura di tutti gli utenti (bypassa le regole Firestore tramite admin SDK)
exports.adminGetAllUsers = functions.https.onCall(async (data, context) => {
    verifyAdminToken(data.adminToken);
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...serializeDoc(doc.data()) }));
});

// Lettura di tutti gli ordini
exports.adminGetAllOrders = functions.https.onCall(async (data, context) => {
    verifyAdminToken(data.adminToken);
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...serializeDoc(doc.data()) }));
});

// Eliminazione utente
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
    verifyAdminToken(data.adminToken);
    const { userId } = data;
    if (!userId) throw new functions.https.HttpsError('invalid-argument', 'userId richiesto');
    await db.collection('users').doc(userId).delete();
    return { success: true };
});

// Aggiornamento campi utente (es. loyaltyPoints, cassaCloudId)
exports.adminUpdateUser = functions.https.onCall(async (data, context) => {
    verifyAdminToken(data.adminToken);
    const { userId, updates } = data;
    if (!userId || !updates) throw new functions.https.HttpsError('invalid-argument', 'userId e updates richiesti');
    await db.collection('users').doc(userId).update(updates);
    return { success: true };
});
