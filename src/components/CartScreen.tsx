import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cart, UserProfile } from '../types';
import {
    updateQuantity,
    removeFromCart,
    clearCart
} from '../services/cartService';
import { openWhatsApp } from '../services/whatsappService';
import { callPizzeria } from '../services/phoneService';
import './CartScreen.css';

interface CartScreenProps {
    cart: Cart;
    setCart: (cart: Cart) => void;
    userProfile: UserProfile | null;
}

function CartScreen({ cart, setCart, userProfile }: CartScreenProps) {
    const navigate = useNavigate();
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    const handleQuantityChange = (productId: string, newQuantity: number) => {
        const newCart = updateQuantity(cart, productId, newQuantity);
        setCart(newCart);
    };

    const handleRemoveItem = (productId: string) => {
        const newCart = removeFromCart(cart, productId);
        setCart(newCart);
    };

    const handleClearCart = () => {
        if (window.confirm('Sei sicuro di voler svuotare il carrello?')) {
            const newCart = clearCart();
            setCart(newCart);
        }
    };

    const handleWhatsAppOrder = () => {
        let userInfo;

        if (userProfile) {
            userInfo = {
                name: `${userProfile.firstName} ${userProfile.lastName}`,
                phone: userProfile.phone
            };
        } else if (guestName && guestPhone) {
            userInfo = {
                name: guestName,
                phone: guestPhone
            };
        } else {
            alert('Per favore inserisci il tuo nome e numero di telefono o accedi al profilo.');
            return;
        }

        openWhatsApp(cart, userInfo);
    };

    if (cart.items.length === 0) {
        return (
            <div className="cart-screen empty fade-in">
                <div className="empty-state">
                    <span className="empty-icon">🛒</span>
                    <h2>Il tuo carrello è vuoto</h2>
                    <p>Aggiungi qualche pizza deliziosa!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/menu')}>
                        Vai al Menù
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-screen fade-in">
            <div className="cart-header">
                <h1>Il tuo Ordine</h1>
                <button className="clear-btn" onClick={handleClearCart}>
                    Svuota
                </button>
            </div>

            <div className="cart-items">
                {cart.items.map(item => (
                    <div key={item.product.id} className="cart-item">
                        <div className="item-info">
                            <h3>{item.product.name}</h3>
                            <p className="item-price">€{item.product.price.toFixed(2)} cad.</p>
                            {item.notes && <p className="item-notes">📝 {item.notes}</p>}
                        </div>

                        <div className="item-actions">
                            <div className="qty-control">
                                <button
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                                >
                                    -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                                >
                                    +
                                </button>
                            </div>
                            <div className="item-total">
                                €{(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            <button
                                className="remove-btn"
                                onClick={() => handleRemoveItem(item.product.id)}
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <div className="summary-row total">
                    <span>Totale</span>
                    <span>€{cart.total.toFixed(2)}</span>
                </div>
                <p className="payment-info">💳 Pagamento in contanti alla consegna</p>
            </div>

            {!userProfile && (
                <div className="guest-info">
                    <h3>I tuoi dati</h3>
                    <div className="input-group">
                        <input
                            type="text"
                            className="input"
                            placeholder="Nome e Cognome"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="tel"
                            className="input"
                            placeholder="Numero di Telefono"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                        />
                    </div>
                    <p className="guest-hint">
                        <span onClick={() => navigate('/profile')} className="link">Crea un profilo</span> per non dover inserire i dati ogni volta.
                    </p>
                </div>
            )}

            <div className="cart-actions">
                <button className="btn btn-whatsapp full-width" onClick={handleWhatsAppOrder}>
                    <span className="icon">💬</span> Invia Ordine su WhatsApp
                </button>

                <button className="btn btn-secondary full-width" onClick={callPizzeria}>
                    <span className="icon">📞</span> Ordina per Telefono
                </button>
            </div>
        </div>
    );
}

export default CartScreen;
