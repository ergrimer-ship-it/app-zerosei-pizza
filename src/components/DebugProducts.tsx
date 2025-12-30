import { useState, useEffect } from 'react';
import { getAllProductsForAdmin, getProductsByCategory } from '../services/dbService';
import { Product } from '../types';

function DebugProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testCategory, setTestCategory] = useState<Product[]>([]);

    // ==========================================
    // PROFILE DIAGNOSTIC
    // ==========================================
    const [diagPhone, setDiagPhone] = useState('3999999999');
    const [diagLogs, setDiagLogs] = useState<string[]>([]);


    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            console.log('🔍 Loading all products...');
            const data = await getAllProductsForAdmin();
            console.log('✅ Products loaded:', data.length);
            console.log('📦 Products:', data);
            setProducts(data);

            // Test category query
            console.log('🔍 Testing category query for pizze-classiche...');
            const categoryData = await getProductsByCategory('pizze-classiche');
            console.log('✅ Category products loaded:', categoryData.length);
            console.log('📦 Category products:', categoryData);
            setTestCategory(categoryData);
        } catch (err: any) {
            console.error('❌ Error loading products:', err);
            setError(err.message || 'Unknown error');
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: 20 }}>Loading debug data...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;

    const addLog = (msg: string) => {
        console.log(`[DIAG] ${msg}`);
        setDiagLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);
    };

    const runProfileDiagnostic = async () => {
        setDiagLogs([]);
        addLog('🚀 Starting Profile Save Diagnostic...');

        try {
            // 1. Simulate Form Data
            const formData = {
                firstName: 'Test',
                lastName: 'User',
                phone: diagPhone,
                email: 'test@example.com'
            };
            addLog(`📝 Form Data: ${JSON.stringify(formData)}`);

            // 2. Check Existing by Phone
            addLog('Searching user by phone...');
            const existingUser = await import('../services/dbService').then(m => m.getUserByPhone(formData.phone));

            if (existingUser) {
                addLog(`✅ Found existing user: ${existingUser.id}`);
                addLog(`Existing Data: ${JSON.stringify(existingUser)}`);

                // 3. Simulate Update Logic
                const newProfile: any = {
                    id: existingUser.id, // ID explicitly set from existing
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    loyaltyPoints: existingUser.loyaltyPoints || 0,
                    createdAt: existingUser.createdAt,
                    updatedAt: new Date()
                };

                addLog(`🔄 Preparing UPDATE for ID: ${existingUser.id}`);

                // Sanitize
                const { id, ...dataToUpdate } = newProfile;
                addLog(`Sanitized Payload (no ID): ${JSON.stringify(dataToUpdate)}`);

                await import('../services/dbService').then(m => m.updateUserProfile(existingUser.id, dataToUpdate));
                addLog('✅ Update SUCCESS');

            } else {
                addLog('ℹ️ User not found. Creating NEW...');

                // 3. Simulate Create Logic
                const newProfile: any = {
                    id: '', // Empty ID initially
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    email: formData.email,
                    loyaltyPoints: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                addLog('🆕 Preparing CREATE');

                // Sanitize
                const { id, ...dataToCreate } = newProfile;
                addLog(`Sanitized Payload (no ID): ${JSON.stringify(dataToCreate)}`);

                const { createUserProfile } = await import('../services/dbService');
                const newId = await createUserProfile(dataToCreate);
                addLog(`✅ Create SUCCESS. New ID: ${newId}`);
            }

        } catch (error: any) {
            addLog(`❌ ERROR: ${error.message}`);
            addLog(`Stack: ${error.stack}`);
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Loading debug data...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;

    return (
        <div style={{ padding: 20, fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Debug Products & Profiles</h1>

            <div style={{ border: '2px solid #333', padding: 20, margin: '20px 0', borderRadius: 8, background: '#f5f5f5' }}>
                <h2>👤 Profile Save Diagnostic</h2>
                <div style={{ marginBottom: 10 }}>
                    <label>Test Phone: </label>
                    <input
                        value={diagPhone}
                        onChange={e => setDiagPhone(e.target.value)}
                        style={{ padding: 5 }}
                    />
                </div>
                <button
                    onClick={runProfileDiagnostic}
                    style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                >
                    RUN DIAGNOSTIC
                </button>

                <div style={{ marginTop: 20, background: '#1e1e1e', color: '#0f0', padding: 15, borderRadius: 4, minHeight: 200, whiteSpace: 'pre-wrap' }}>
                    {diagLogs.length === 0 ? '// Ready to run...' : diagLogs.join('\n')}
                </div>
            </div>

            <h2>All Products: {products.length}</h2>
            <h2>Pizze Classiche: {testCategory.length}</h2>

            <h3>Category Test Results:</h3>
            <pre style={{ background: '#eee', padding: 10 }}>{JSON.stringify(testCategory, null, 2)}</pre>
        </div>
    );
}

export default DebugProducts;
