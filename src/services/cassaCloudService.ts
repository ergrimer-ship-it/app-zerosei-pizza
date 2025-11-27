import { LoyaltyCard } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

/**
 * Servizio per integrazione con Cassa in Cloud tramite Firebase Cloud Functions
 * Gestisce il recupero dei punti fedeltà e la sincronizzazione dati cliente
 */

// Inizializza Firebase Functions
const functions = getFunctions(app);

// Configurazione
let CASSA_CLOUD_API_KEY = '052ee020-a2bb-4383-9ab0-dfef25dd8345'; // API Key predefinita
let ACCESS_TOKEN: string | null = null;
let TOKEN_EXPIRY: number = 0;

/**
 * Imposta la chiave API di Cassa in Cloud
 */
export function setCassaCloudApiKey(apiKey: string): void {
    CASSA_CLOUD_API_KEY = apiKey;
    // Salva in localStorage per persistenza
    localStorage.setItem('cassacloud_api_key', apiKey);
    // Invalida il token corrente
    ACCESS_TOKEN = null;
    TOKEN_EXPIRY = 0;
}

/**
 * Recupera la chiave API salvata
 */
export function getCassaCloudApiKey(): string {
    if (!CASSA_CLOUD_API_KEY) {
        CASSA_CLOUD_API_KEY = localStorage.getItem('cassacloud_api_key') || '052ee020-a2bb-4383-9ab0-dfef25dd8345';
    }
    return CASSA_CLOUD_API_KEY;
}

/**
 * Ottiene un access token OAuth2 tramite Cloud Function
 */
async function getAccessToken(): Promise<string> {
    try {
        // Se abbiamo un token valido, usalo
        if (ACCESS_TOKEN && Date.now() < TOKEN_EXPIRY) {
            return ACCESS_TOKEN;
        }

        const apiKey = getCassaCloudApiKey();
        if (!apiKey) {
            throw new Error('Chiave API non configurata');
        }

        // Chiama la Cloud Function per ottenere il token
        const getTokenFunction = httpsCallable(functions, 'getAccessToken');
        const result = await getTokenFunction({ apiKey });
        const data = result.data as { success: boolean; accessToken: string; expiresIn: number };

        if (data.success) {
            ACCESS_TOKEN = data.accessToken;
            // Imposta scadenza (usiamo 50 minuti per sicurezza)
            TOKEN_EXPIRY = Date.now() + (data.expiresIn - 600) * 1000;
            return ACCESS_TOKEN;
        }

        throw new Error('Risposta API non valida (success=false)');
    } catch (error: any) {
        console.error('Error getting access token via Cloud Function:', error);
        throw new Error(error.message || 'Errore sconosciuto nel recupero del token');
    }
}

/**
 * Recupera i punti fedeltà di un cliente tramite Cloud Function
 */
export async function getLoyaltyPoints(customerId: string): Promise<LoyaltyCard | null> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.warn('Could not obtain access token');
            // Restituisci dati mock se non c'è token
            return {
                customerId,
                points: 0,
                tier: 'Member',
                lastUpdated: new Date()
            };
        }

        // Chiama la Cloud Function per recuperare i punti fedeltà
        const getLoyaltyFunction = httpsCallable(functions, 'getLoyaltyPoints');
        const result = await getLoyaltyFunction({ accessToken: token, customerId });
        const data = result.data as {
            success: boolean;
            customerId: string;
            points: number;
            tier: string;
            lastUpdated: string;
        };

        if (data.success) {
            return {
                customerId: data.customerId,
                points: data.points,
                tier: data.tier,
                lastUpdated: new Date(data.lastUpdated)
            };
        }

        // Se non ha successo, restituisci 0 punti
        return {
            customerId,
            points: 0,
            tier: 'Member',
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error fetching loyalty points via Cloud Function:', error);
        // In caso di errore, restituisci dati mock
        return {
            customerId,
            points: 0,
            tier: 'Member',
            lastUpdated: new Date()
        };
    }
}

/**
 * Sincronizza i dati del cliente tramite Cloud Function
 */
export async function syncCustomerData(customerData: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}): Promise<boolean> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.warn('Could not obtain access token');
            return false;
        }

        // Chiama la Cloud Function per sincronizzare i dati
        const syncFunction = httpsCallable(functions, 'syncCustomerData');
        const result = await syncFunction({ accessToken: token, customerData });
        const data = result.data as { success: boolean };

        return data.success;
    } catch (error) {
        console.error('Error syncing customer data via Cloud Function:', error);
        return false;
    }
}

/**
 * Verifica se l'API di Cassa in Cloud è configurata e funzionante
 */
export async function testCassaCloudConnection(): Promise<{ success: boolean; error?: string }> {
    try {
        await getAccessToken();
        return { success: true };
    } catch (error: any) {
        console.error('Error testing Cassa in Cloud connection:', error);
        return {
            success: false,
            error: error.message || 'Errore sconosciuto durante il test di connessione'
        };
    }
}

const loyaltyCache = new Map<string, { data: LoyaltyCard; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

/**
 * Recupera i punti fedeltà con cache
 */
export async function getCachedLoyaltyPoints(customerId: string): Promise<LoyaltyCard | null> {
    const cached = loyaltyCache.get(customerId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }

    const data = await getLoyaltyPoints(customerId);
    if (data) {
        loyaltyCache.set(customerId, { data, timestamp: now });
    }

    return data;
}

/**
 * Cerca un cliente su Cassa in Cloud per email o telefono
 */
export async function searchCustomer(params: { email?: string; phone?: string }): Promise<{ id: string; firstName: string; lastName: string } | null> {
    try {
        const token = await getAccessToken();
        if (!token) {
            console.warn('Could not obtain access token');
            return null;
        }

        const searchFunction = httpsCallable(functions, 'searchCustomer');
        const result = await searchFunction({ accessToken: token, ...params });
        const data = result.data as { success: boolean; customer?: any };

        if (data.success && data.customer) {
            return data.customer;
        }

        return null;
    } catch (error) {
        console.error('Error searching customer:', error);
        return null;
    }
}

/**
 * Collega il profilo locale a Cassa in Cloud cercando per email o telefono
 */
export async function linkCustomerProfile(userProfile: any): Promise<string | null> {
    if (userProfile.cassaCloudId) {
        return userProfile.cassaCloudId;
    }

    // Cerca per email
    if (userProfile.email) {
        const customer = await searchCustomer({ email: userProfile.email });
        if (customer) {
            return customer.id;
        }
    }

    // Cerca per telefono (rimuovi spazi e caratteri non numerici)
    if (userProfile.phone) {
        const cleanPhone = userProfile.phone.replace(/\D/g, '');
        const customer = await searchCustomer({ phone: cleanPhone });
        if (customer) {
            return customer.id;
        }
    }

    return null;
}

/**
 * Invalida la cache per un cliente specifico
 */
export function invalidateLoyaltyCache(customerId?: string): void {
    if (customerId) {
        loyaltyCache.delete(customerId);
    } else {
        loyaltyCache.clear();
    }
}
