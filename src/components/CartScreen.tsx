import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cart, UserProfile, DeliveryType, PaymentMethod, OrderDetails } from '../types';
import {
    updateQuantity,
    removeFromCart,
    clearCart,
    calculateItemUnitPrice
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

    // Delivery options
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
    const [pickupTime, setPickupTime] = useState('');
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [doorbell, setDoorbell] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [orderNotes, setOrderNotes] = useState('');

    const handleQuantityChange = (index: number, newQuantity: number) => {
        const newCart = updateQuantity(cart, index, newQuantity);
        setCart(newCart);
    };

    const handleRemoveItem = (index: number) => {
        const newCart = removeFromCart(cart, index);
        setCart(newCart);
    };

    const handleClearCart = () => {
        if (window.confirm('Sei sicuro di voler svuotare il carrello?')) {
            const newCart = clearCart();
            setCart(newCart);
        }
    };

    const handleWhatsAppOrder = () => {
        console.log('WhatsApp order button clicked');
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

        // Validate delivery options
        if (deliveryType === 'delivery') {
            if (!street || !city || !doorbell) {
                alert('Per favore compila tutti i campi dell\'indirizzo di consegna.');
                return;
            }
            if (!pickupTime) {
                alert('Per favore seleziona un orario di consegna.');
                return;
            }
        }

        const orderDetails: OrderDetails = {
            deliveryType,
            pickupTime,
            deliveryAddress: deliveryType === 'delivery' ? { street, city, doorbell } : undefined,
            paymentMethod,
            notes: orderNotes
        };

        console.log('Opening WhatsApp with:', { cart, userInfo, orderDetails });
        openWhatsApp(cart, userInfo, orderDetails);
    };

    const handlePhoneCall = () => {
        console.log('Phone call button clicked');
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
        }

        const orderDetails = {
            deliveryType,
            pickupTime,
            deliveryAddress: deliveryType === 'delivery' ? { street, city, doorbell } : undefined,
            paymentMethod,
            notes: orderNotes
        };

        console.log('Calling pizzeria with:', { cart, userInfo, orderDetails });
        callPizzeria(cart, userInfo, orderDetails);
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
                {cart.items.map((item, index) => {
                    const unitPrice = calculateItemUnitPrice(item);
                    return (
                        <div key={`${item.product.id}-${index}`} className="cart-item">
                            <div className="item-info">
                                <h3>{item.product.name}</h3>
                                <p className="item-price">€{unitPrice.toFixed(2)} cad.</p>

                                {item.modifications && item.modifications.length > 0 && (
                                    <div className="item-modifications">
                                        {item.modifications.map(mod => (
                                            <span key={mod.id} className="mod-tag">
                                                + {mod.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {item.notes && <p className="item-notes">📝 {item.notes}</p>}
                            </div>

                            <div className="item-actions">
                                <div className="qty-control">
                                    <button
                                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="item-total">
                                    €{(unitPrice * item.quantity).toFixed(2)}
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() => handleRemoveItem(index)}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="cart-summary">
                <div className="summary-row total">
                    <span>Totale</span>
                    <span>€{cart.total.toFixed(2)}</span>
                </div>
            </div>

            <div className="quick-order-section">
                <p className="quick-order-hint">💡 <strong>Ordine veloce?</strong> Chiama direttamente!</p>
                <button className="btn btn-secondary full-width" onClick={handlePhoneCall}>
                    <span className="icon">📞</span> Chiama Ora - 045 618 0120
                </button>
            </div>

            {/* WhatsApp Order - Requires delivery details */}
            <div className="whatsapp-order-section">
                <h3>Ordina su WhatsApp</h3>
                <p className="section-hint">Compila i dettagli per ricevere il riepilogo completo</p>

                {!userProfile && (
                    <div className="guest-info-inline">
                        <div className="input-group">
                            <label htmlFor="guestName">Nome e Cognome *</label>
                            <input
                                type="text"
                                id="guestName"
                                className="input"
                                placeholder="Nome e Cognome"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="guestPhone">Telefono *</label>
                            <input
                                type="tel"
                                id="guestPhone"
                                className="input"
                                placeholder="Numero di Telefono"
                                value={guestPhone}
                                onChange={(e) => setGuestPhone(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Delivery Type Selection */}
                <div className="delivery-options-wrapper">
                    <label className="section-label">Modalità di Ritiro *</label>
                    <div className="delivery-options">
                        <button
                            className={`delivery-option ${deliveryType === 'pickup' ? 'active' : ''}`}
                            onClick={() => setDeliveryType('pickup')}
                        >
                            <span className="option-icon">🏪</span>
                            <span className="option-label">Ritiro in Pizzeria</span>
                        </button>
                        <button
                            className={`delivery-option ${deliveryType === 'delivery' ? 'active' : ''}`}
                            onClick={() => setDeliveryType('delivery')}
                        >
                            <span className="option-icon">🏠</span>
                            <span className="option-label">Consegna a Domicilio</span>
                        </button>
                    </div>

                    {deliveryType === 'pickup' && (
                        <div className="pickup-details">
                            <label htmlFor="pickupTime">Orario Preferito (opzionale)</label>
                            <input
                                type="time"
                                id="pickupTime"
                                className="input"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                            />
                        </div>
                    )}

                    {deliveryType === 'delivery' && (
                        <div className="delivery-details">
                            <div className="input-group">
                                <label htmlFor="street">Via e Numero Civico *</label>
                                <input
                                    type="text"
                                    id="street"
                                    className="input"
                                    placeholder="Es: Via Roma, 123"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="city">Paese/Città *</label>
                                <input
                                    type="text"
                                    id="city"
                                    className="input"
                                    placeholder="Es: Verona"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="doorbell">Nome sul Campanello *</label>
                                <input
                                    type="text"
                                    id="doorbell"
                                    className="input"
                                    placeholder="Nome e Cognome"
                                    value={doorbell}
                                    onChange={(e) => setDoorbell(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="deliveryTime">Orario di Consegna *</label>
                                <input
                                    type="time"
                                    id="deliveryTime"
                                    className="input"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                    required
                                />
                            </div>

                            <label className="section-label">Metodo di Pagamento *</label>
                            <div className="payment-options">
                                <button
                                    className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('cash')}
                                >
                                    💵 Contanti
                                </button>
                                <button
                                    className={`payment-option ${paymentMethod === 'pos' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('pos')}
                                >
                                    💳 POS
                                </button>
                                <button
                                    className={`payment-option ${paymentMethod === 'satispay' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('satispay')}
                                >
                                    📱 Satispay
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="orderNotes">Note Aggiuntive (opzionale)</label>
                        <textarea
                            id="orderNotes"
                            className="input"
                            placeholder="Es: Suonare al citofono, non al campanello..."
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <button className="btn btn-whatsapp full-width" onClick={handleWhatsAppOrder}>
                    <span className="icon">💬</span> Invia Ordine su WhatsApp
                </button>

                {!userProfile && (
                    <p className="profile-hint">
                        💡 <span onClick={() => navigate('/profile')} className="link">Crea un profilo</span> per salvare i tuoi dati
                    </p>
                )}
            </div>
        </div>
    );
}

export default CartScreen;
