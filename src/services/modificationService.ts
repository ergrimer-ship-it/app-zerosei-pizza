import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PizzaModification } from '../types';

const MODIFICATIONS_COLLECTION = 'modifications';

/**
 * Carica tutte le modifiche da Firestore
 */
export async function getModifications(): Promise<PizzaModification[]> {
    try {
        const querySnapshot = await getDocs(collection(db, MODIFICATIONS_COLLECTION));
        const modifications: PizzaModification[] = [];

        querySnapshot.forEach((doc) => {
            modifications.push({ id: doc.id, ...doc.data() } as PizzaModification);
        });

        return modifications;
    } catch (error) {
        console.error('Error loading modifications:', error);
        return [];
    }
}

/**
 * Salva o aggiorna una modifica
 */
export async function saveModification(modification: PizzaModification): Promise<void> {
    try {
        const modRef = doc(db, MODIFICATIONS_COLLECTION, modification.id);
        await setDoc(modRef, {
            name: modification.name,
            price: modification.price,
            type: modification.type,
            available: modification.available,
            category: modification.category
        });
    } catch (error) {
        console.error('Error saving modification:', error);
        throw error;
    }
}

/**
 * Elimina una modifica
 */
export async function deleteModification(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, MODIFICATIONS_COLLECTION, id));
    } catch (error) {
        console.error('Error deleting modification:', error);
        throw error;
    }
}

/**
 * Aggiorna la disponibilità di una modifica
 */
export async function toggleModificationAvailability(id: string, available: boolean): Promise<void> {
    try {
        const modRef = doc(db, MODIFICATIONS_COLLECTION, id);
        await updateDoc(modRef, { available });
    } catch (error) {
        console.error('Error updating modification availability:', error);
        throw error;
    }
}
