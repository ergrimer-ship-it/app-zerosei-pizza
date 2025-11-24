import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Cart } from '../types';
import { addToCart } from '../services/cartService';
import { openWhatsApp } from '../services/whatsappService';
import './ProductDetailScreen.css';

interface ProductDetailScreenProps {
    cart: Cart;
    setCart: (cart: Cart) => void;
}

function ProductDetailScreen({ cart, setCart }: ProductDetailScreenProps) {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch product
        // In real app, fetch from dbService
        const mockProducts: Product[] = [
            {
                id: '1',
                name: 'Margherita',
                category: 'pizze-veraci',
                ingredients: ['Pomodoro San Marzano DOP', 'Fior di latte', 'Basilico', 'Olio EVO'],
                price: 6.50,
                available: true,
                imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                name: 'Bufalina',
                category: 'pizze-veraci',
                ingredients: ['Pomodoro San Marzano DOP', 'Mozzarella di Bufala', 'Basilico', 'Olio EVO'],
                price: 8.50,
                available: true,
                imageUrl: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            // Add more mock products as needed to match ProductListScreen
        ];

        const found = mockProducts.find(p => p.id === id);
        // Fallback if not found in small mock list, create generic one
        if (!found && id) {
            setProduct({
                id,
                name: 'Pizza Generic',
                category: 'pizze-classiche',
                ingredients: ['Pomodoro', 'Mozzarella'],
                price: 8.00,
                available: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } else {
            setProduct(found || null);
        }
        setLoading(false);
    }, [id]);

    const handleQuantityChange = (delta: number) => {
        const newQuantity = quantity + delta;
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            const newCart = addToCart(cart, product, quantity, notes);
            setCart(newCart);
            navigate(-1); // Go back
        }
    };

    const handleOrderNow = () => {
        if (product) {
            const tempCart = {
                items: [{ product, quantity, notes }],
                total: product.price * quantity
            };

            const userProfile = localStorage.getItem('user_profile');
            let userInfo;

            if (userProfile) {
                const profile = JSON.parse(userProfile);
                userInfo = {
                    name: `${profile.firstName} ${profile.lastName}`,
                    phone: profile.phone
                };
            }

            openWhatsApp(tempCart, userInfo);
        }
    };

    if (loading) return <div className="loading">Caricamento...</div>;
    if (!product) return <div className="error">Prodotto non trovato</div>;

    return (
        <div className="product-detail-screen fade-in">
            <button className="back-btn-floating" onClick={() => navigate(-1)}>
                ←
            </button>

            <div className="product-image-container">
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                ) : (
                    <div className="product-image-placeholder">🍕</div>
                )}
            </div>

            <div className="product-details-content">
                <div className="product-header">
                    <h1>{product.name}</h1>
                    <span className="product-price">€{product.price.toFixed(2)}</span>
                </div>

                <p className="product-ingredients">
                    {product.ingredients.join(', ')}
                </p>

                <div className="notes-section">
                    <label htmlFor="notes">Note per la cucina</label>
                    <textarea
                        id="notes"
                        placeholder="Es: Ben cotta, no basilico..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="quantity-selector">
                    <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                    >
                        -
                    </button>
                    <span className="qty-value">{quantity}</span>
                    <button
                        className="qty-btn"
                        onClick={() => handleQuantityChange(1)}
                    >
                        +
                    </button>
                </div>

                <div className="action-buttons">
                    <button className="btn btn-primary add-to-cart-btn" onClick={handleAddToCart}>
                        Aggiungi al carrello - €{(product.price * quantity).toFixed(2)}
                    </button>

                    <button className="btn btn-whatsapp order-now-btn" onClick={handleOrderNow}>
                        Ordina subito su WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailScreen;
