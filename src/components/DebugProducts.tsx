import { useState, useEffect } from 'react';
import { getAllProductsForAdmin, getProductsByCategory } from '../services/dbService';
import { Product } from '../types';

function DebugProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [testCategory, setTestCategory] = useState<Product[]>([]);

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

    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>Debug Products</h1>
            <h2>All Products: {products.length}</h2>
            <h2>Pizze Classiche: {testCategory.length}</h2>

            <h3>Category Test Results:</h3>
            <pre>{JSON.stringify(testCategory, null, 2)}</pre>

            <h3>All Products:</h3>
            <pre>{JSON.stringify(products, null, 2)}</pre>
        </div>
    );
}

export default DebugProducts;
