import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDf7bTYBUCJiVj8L-7nKxuWU8ueGdXc1W0",
    authDomain: "app-zerosei-pizza.firebaseapp.com",
    projectId: "app-zerosei-pizza",
    storageBucket: "app-zerosei-pizza.firebasestorage.app",
    messagingSenderId: "912128427084",
    appId: "1:912128427084:web:9f99ba64f9bd2c97f520e9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixImageUrls() {
    console.log('Fixing product image URLs...');
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
        console.log('No products found.');
        return;
    }

    let fixedCount = 0;

    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const image = data.image || '';
        const imageUrl = data.imageUrl || '';

        // If 'image' is a valid URL but 'imageUrl' is a placeholder or missing
        if (image.startsWith('http') && (!imageUrl || !imageUrl.startsWith('http'))) {
            console.log(`Fixing product: ${data.name} (${docSnapshot.id})`);
            console.log(`  image: ${image}`);
            console.log(`  imageUrl (old): ${imageUrl}`);

            try {
                await updateDoc(doc(db, 'products', docSnapshot.id), {
                    imageUrl: image
                });
                console.log('  ✅ Updated imageUrl');
                fixedCount++;
            } catch (error) {
                console.error('  ❌ Error updating:', error);
            }
        }
    }

    console.log(`\nTotal products fixed: ${fixedCount}`);
}

fixImageUrls().catch(console.error);
