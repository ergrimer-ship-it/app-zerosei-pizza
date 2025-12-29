import { LoyaltyCard } from '../types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';

/**
 * Servizio per integrazione con Cassa in Cloud tramite Firebase Cloud Functions
 * Gestisce il recupero dei punti fedeltà e la sincronizzazione dati cliente
 * 
 * NOTA: L'API Key è configurata in modo sicuro nelle Cloud Functions, 
 * MAI esposta al frontend per motivi di sicurezza.
 */

// Inizializza Firebase Functions
const functions = getFunctions(app);

// Token cache (gestito dalle Cloud Functions)
let ACCESS_TOKEN: string | null = null;
let TOKEN_EXPIRY: number = 0;

/**
 * Ottiene un access token OAuth2 tramite Cloud Function
 * La Cloud Function gestisce l'API Key in modo sicuro
 */
async function getAccessToken(): Promise<string> {
    try {
        // Se abbiamo un token valido, usalo
        if (ACCESS_TOKEN && Date.now() < TOKEN_EXPIRY) {
            return ACCESS_TOKEN;
        }

        // Chiama la Cloud Function per ottenere il token
        // L'API Key è gestita in modo sicuro nel backend
        const getTokenFunction = httpsCallable(functions, 'getAccessToken');
        const result = await getTokenFunction({});
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
 * Collega il profilo locale a Cassa in Cloud cercando per email
 * Usa direttamente searchAndSyncFidelityPoints per trovare e recuperare i dati
 */
export async function linkCustomerProfile(userProfile: any): Promise<string | null> {
    if (userProfile.cassaCloudId) {
        return userProfile.cassaCloudId;
    }

    // Usa searchAndSyncFidelityPoints per cercare il cliente
    try {
        const searchAndSync = httpsCallable(functions, 'searchAndSyncFidelityPoints');
        const result = await searchAndSync({
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            phone: userProfile.phone
        });

        const data = result.data as any;

        if (data.success && data.customerId) {
            console.log('[linkCustomerProfile] Found customer:', data.customerId, 'with', data.points, 'points');
            return data.customerId;
        }

        console.log('[linkCustomerProfile] Customer not found in Cassa in Cloud');
        return null;
    } catch (error) {
        console.error('[linkCustomerProfile] Error:', error);
        return null;
    }
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
