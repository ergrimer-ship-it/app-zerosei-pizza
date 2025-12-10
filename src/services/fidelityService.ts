import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Sincronizza i punti fedeltà dall'API Cassa in Cloud
 * @param userData - Dati utente (email, firstName, lastName, phone)
 * @returns Risultato con punti, customerId e metadata
 */
export const syncFidelityPoints = async (userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
}) => {
    try {
        const syncFunction = httpsCallable(functions, 'syncFidelityPoints');
        const result = await syncFunction(userData);

        return result.data as {
            success: boolean;
            customerId?: string;
            points?: number;
            programId?: string;
            lastUpdated?: string;
            errorCode?: string;
            message?: string;
            customers?: Array<{
                id: string;
                firstName: string;
                lastName: string;
                email: string;
                phone: string;
            }>;
        };
    } catch (error: any) {
        console.error('Error syncing fidelity points:', error);
        throw new Error(error.message || 'Errore durante la sincronizzazione');
    }
};
