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

// Categories to migrate
const categories = [
    {
        name: 'Pizze Veraci',
        description: 'Le nostre pizze napoletane tradizionali',
        icon: '🍕',
        order: 1,
        imageUrl: ''
    },
    {
        name: 'Pizze Classiche',
        description: 'Le pizze classiche che tutti amano',
        icon: '🍕',
        order: 2,
        imageUrl: ''
    },
    {
        name: 'Le Nostre Proposte',
        description: 'Pizze speciali e creative',
        icon: '⭐',
        order: 3,
        imageUrl: ''
    },
    {
        name: 'Calzoni',
        description: 'Calzoni ripieni e gustosi',
        icon: '🥟',
        order: 4,
        imageUrl: ''
    },
    {
        name: 'Bevande',
        description: 'Bibite, acqua e altre bevande',
        icon: '🥤',
        order: 5,
        imageUrl: ''
    },
    {
        name: 'Birre',
        description: 'Selezione di birre artigianali e classiche',
        icon: '🍺',
        order: 6,
        imageUrl: ''
    }
];

async function migrateCategories() {
    console.log('Starting category migration...');
    console.log(`Total categories to migrate: ${categories.length}`);

    const categoriesRef = collection(db, 'categories');
    let successCount = 0;
    let errorCount = 0;

    for (const category of categories) {
        try {
            await addDoc(categoriesRef, category);
            successCount++;
            console.log(`✓ Migrated: ${category.name}`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Error migrating ${category.name}:`, error);
        }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total categories: ${categories.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    process.exit(0);
}

migrateCategories().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});
