import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function findAndDeleteDuplicate() {
    console.log('Searching for duplicate users with email grimaldi.andrea88@gmail.com...');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'grimaldi.andrea88@gmail.com'));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} users with that email.`);

    const users = [];
    snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
    });

    if (users.length <= 1) {
        console.log('No duplicates found!');
        process.exit(0);
    }

    // Sort by loyaltyPoints to find the one with 0 points
    users.sort((a, b) => (a.loyaltyPoints || 0) - (b.loyaltyPoints || 0));

    // The first one will be the one with 0 points (or the lowest points)
    const duplicateToDelete = users[0];

    console.log(`Deleting duplicate user: ID=${duplicateToDelete.id}, Points=${duplicateToDelete.loyaltyPoints || 0}`);
    await deleteDoc(doc(db, 'users', duplicateToDelete.id));

    console.log('Duplicate successfully deleted.');
    process.exit(0);
}

findAndDeleteDuplicate().catch(console.error);
