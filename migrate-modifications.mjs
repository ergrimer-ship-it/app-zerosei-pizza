import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDJKdVFhYAhxEJWsAWBQKGlx5oPLVjKxRw",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "1095029827088",
    appId: "1:1095029827088:web:5f3f5a5c5e5c5e5c5e5c5e"
};

// Hardcoded modifications data
const AVAILABLE_MODIFICATIONS = [
    { id: 'm1', name: 'Mozzarella di Bufala', price: 2.00, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm2', name: 'Prosciutto Crudo', price: 2.00, type: 'add', available: true, category: 'Salumi' },
    { id: 'm3', name: 'Speck', price: 1.50, type: 'add', available: true, category: 'Salumi' },
    { id: 'm4', name: 'Salame Piccante', price: 1.00, type: 'add', available: true, category: 'Salumi' },
    { id: 'm5', name: 'Funghi Porcini', price: 2.00, type: 'add', available: true, category: 'Verdure' },
    { id: 'm6', name: 'Rucola', price: 0.50, type: 'add', available: true, category: 'Verdure' },
    { id: 'm7', name: 'Scaglie di Grana', price: 1.00, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm8', name: 'Doppia Mozzarella', price: 1.50, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm9', name: 'Patatine Fritte', price: 1.50, type: 'add', available: true, category: 'Altro' },
    { id: 'm10', name: 'Uovo', price: 1.00, type: 'add', available: true, category: 'Altro' }
];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateModifications() {
    console.log('Starting modifications migration...');

    for (const mod of AVAILABLE_MODIFICATIONS) {
        try {
            const modRef = doc(db, 'modifications', mod.id);
            await setDoc(modRef, {
                name: mod.name,
                price: mod.price,
                type: mod.type,
                available: mod.available,
                category: mod.category
            });
            console.log(`✓ Migrated: ${mod.name}`);
        } catch (error) {
            console.error(`✗ Error migrating ${mod.name}:`, error);
        }
    }

    console.log('Migration completed!');
    process.exit(0);
}

migrateModifications();
