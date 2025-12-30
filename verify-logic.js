import { generateMockHistory } from './src/services/cassaCloudService';

console.log("Verifying Cassa Cloud Mock History Logic...");
try {
    const history = generateMockHistory(150);
    console.log("Mock History for 150 points:", history);
    if (history.length > 0 && history[0].description) {
        console.log("✅ Mock history generation works");
    } else {
        console.error("❌ Mock history generation failed");
    }
} catch (e) {
    console.error("❌ Error running verification:", e);
}
