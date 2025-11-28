import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDf7bTYBUCJiVj8L-7nKxuWU8ueGdXc1W0",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "912128427084",
    appId: "1:912128427084:web:9f99ba64f9bd2c97f520e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateProductImages() {
    console.log('🔄 Starting migration: copying image to imageUrl...');

    try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);

        let updated = 0;
        let skipped = 0;

        for (const productDoc of snapshot.docs) {
            const data = productDoc.data();

            // If product has 'image' but not 'imageUrl', copy it
            if (data.image && !data.imageUrl) {
                await updateDoc(doc(db, 'products', productDoc.id), {
                    imageUrl: data.image
                });
                console.log(`✅ Updated product: ${data.name} (${productDoc.id})`);
                console.log(`   image: ${data.image}`);
                updated++;
            } else if (data.imageUrl) {
                console.log(`⏭️  Skipped product: ${data.name} (already has imageUrl)`);
                skipped++;
            } else {
                console.log(`⏭️  Skipped product: ${data.name} (no image)`);
                skipped++;
            }
        }

        console.log('\n📊 Migration complete!');
        console.log(`   Updated: ${updated} products`);
        console.log(`   Skipped: ${skipped} products`);
        console.log(`   Total: ${snapshot.size} products`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

// Run the migration
migrateProductImages();
