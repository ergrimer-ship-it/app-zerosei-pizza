import { LoyaltyCard } from '../types';

/**
 * Servizio per integrazione con Cassa in Cloud
 * Gestisce il recupero dei punti fedeltà e la sincronizzazione dati cliente
 */

// Configurazione API Cassa in Cloud
// const CASSA_CLOUD_API_URL = 'https://api.cassaincloud.it'; // TODO: Verificare URL corretto
let CASSA_CLOUD_API_KEY = ''; // Sarà impostata dall'utente

/**
 * Imposta la chiave API di Cassa in Cloud
 */
export function setCassaCloudApiKey(apiKey: string): void {
    CASSA_CLOUD_API_KEY = apiKey;
    // Salva in localStorage per persistenza
    localStorage.setItem('cassacloud_api_key', apiKey);
}

/**
 * Recupera la chiave API salvata
 */
export function getCassaCloudApiKey(): string {
    if (!CASSA_CLOUD_API_KEY) {
        CASSA_CLOUD_API_KEY = localStorage.getItem('cassacloud_api_key') || '';
    }
    return CASSA_CLOUD_API_KEY;
}

/**
 * Recupera i punti fedeltà di un cliente da Cassa in Cloud
 */
export async function getLoyaltyPoints(customerId: string): Promise<LoyaltyCard | null> {
    try {
        const apiKey = getCassaCloudApiKey();
        if (!apiKey) {
            console.warn('Cassa in Cloud API key not configured');
            return null;
        }

        // TODO: Implementare la chiamata API reale quando avremo la documentazione
        // Esempio di chiamata API:
        /*
        const response = await fetch(`${CASSA_CLOUD_API_URL}/customers/${customerId}/loyalty`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
    
        if (!response.ok) {
          throw new Error('Failed to fetch loyalty points');
        }
    
        const data = await response.json();
        return {
          customerId,
          points: data.points,
          tier: data.tier,
          lastUpdated: new Date(data.lastUpdated)
        };
        */

        // Per ora, restituiamo dati mock
        console.log('Fetching loyalty points for customer:', customerId);
        return {
            customerId,
            points: 150, // Mock data
            tier: 'Gold',
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error('Error fetching loyalty points from Cassa in Cloud:', error);
        return null;
    }
}

/**
 * Sincronizza i dati del cliente con Cassa in Cloud
 */
export async function syncCustomerData(customerData: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
}): Promise<boolean> {
    try {
        const apiKey = getCassaCloudApiKey();
        if (!apiKey) {
            console.warn('Cassa in Cloud API key not configured');
            return false;
        }

        // TODO: Implementare la chiamata API reale
        /*
        const response = await fetch(`${CASSA_CLOUD_API_URL}/customers/${customerData.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customerData)
        });
    
        return response.ok;
        */

        // Per ora, simuliamo il successo
        console.log('Syncing customer data with Cassa in Cloud:', customerData);
        return true;
    } catch (error) {
        console.error('Error syncing customer data with Cassa in Cloud:', error);
        return false;
    }
}

/**
 * Verifica se l'API di Cassa in Cloud è configurata e funzionante
 */
export async function testCassaCloudConnection(): Promise<boolean> {
    try {
        const apiKey = getCassaCloudApiKey();
        if (!apiKey) {
            return false;
        }

        // TODO: Implementare un endpoint di test
        /*
        const response = await fetch(`${CASSA_CLOUD_API_URL}/health`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
    
        return response.ok;
        */

        // Per ora, restituiamo true se c'è una chiave API
        return true;
    } catch (error) {
        console.error('Error testing Cassa in Cloud connection:', error);
        return false;
    }
}

/**
 * Cache locale per i punti fedeltà (per ridurre chiamate API)
 */
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
 * Invalida la cache per un cliente specifico
 */
export function invalidateLoyaltyCache(customerId?: string): void {
    if (customerId) {
        loyaltyCache.delete(customerId);
    } else {
        loyaltyCache.clear();
    }
}
