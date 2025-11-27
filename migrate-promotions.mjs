import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration - ZeroSei Pizza project
const firebaseConfig = {
    apiKey: "AIzaSyDEi8vhKqF3r0XQoYxGxGxO8vZ9kZ0kZ0k",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample promotions to migrate
const promotions = [
    {
        title: 'Offerta Benvenuto',
        description: 'Sconto del 10% sul tuo primo ordine! Usa il codice BENVENUTO10 al checkout.',
        imageUrl: '',
        validFrom: Timestamp.fromDate(new Date('2024-01-01')),
        validTo: Timestamp.fromDate(new Date('2024-12-31')),
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    },
    {
        title: 'Pizza + Bibita',
        description: 'Ordina una pizza a scelta e ricevi una bibita in omaggio!',
        imageUrl: '',
        validFrom: Timestamp.fromDate(new Date('2024-11-01')),
        validTo: Timestamp.fromDate(new Date('2024-12-31')),
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    },
    {
        title: 'Menu Famiglia',
        description: '2 Pizze grandi + 1 Calzone + 2 Bibite a soli €25! Perfetto per la famiglia.',
        imageUrl: '',
        validFrom: Timestamp.fromDate(new Date('2024-11-15')),
        validTo: Timestamp.fromDate(new Date('2024-12-31')),
        active: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    }
];

async function migratePromotions() {
    console.log('Starting promotions migration...');
    console.log(`Total promotions to migrate: ${promotions.length}`);

    const promotionsRef = collection(db, 'promotions');
    let successCount = 0;
    let errorCount = 0;

    for (const promotion of promotions) {
        try {
            await addDoc(promotionsRef, promotion);
            successCount++;
            console.log(`✓ Migrated: ${promotion.title}`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Error migrating ${promotion.title}:`, error);
        }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total promotions: ${promotions.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    process.exit(0);
}

migratePromotions().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
