import { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/dbService';
import { UserProfile } from '../../types';
import './CustomerManagement.css';

function CustomerManagement() {
    const [customers, setCustomers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await getAllUsers();
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
            alert('Errore nel caricamento dei clienti');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const searchLower = searchTerm.toLowerCase();
        const firstName = customer.firstName?.toLowerCase() || '';
        const lastName = customer.lastName?.toLowerCase() || '';
        const phone = customer.phone || '';
        const email = customer.email?.toLowerCase() || '';

        return (
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            phone.includes(searchTerm) ||
            email.includes(searchLower)
        );
    });

    const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

    if (loading) {
        return (
            <div className="customer-management">
                <div className="loading-state">
                    <span className="loading-spinner">⌛</span>
                    <p>Caricamento clienti...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-management fade-in">
            <div className="customer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h2>Gestione Clienti</h2>
                    <button onClick={loadCustomers} className="btn-icon" title="Ricarica lista">
                        🔄
                    </button>
                </div>
                <div className="customer-stats">
                    <div className="stat-card">
                        <span className="stat-value">{customers.length}</span>
                        <span className="stat-label">Clienti Totali</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{totalPoints}</span>
                        <span className="stat-label">Punti Emessi</span>
                    </div>
                </div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Cerca per nome, telefono o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="customers-table-container">
                {filteredCustomers.length === 0 ? (
                    <div className="empty-state">
                        <p>Nessun cliente trovato.</p>
                    </div>
                ) : (
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Contatti</th>
                                <th>Punti Fedeltà</th>
                                <th>Registrato il</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="customer-name">
                                            {customer.firstName} {customer.lastName}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="customer-phone">📞 {customer.phone}</div>
                                        <div className="customer-email">✉️ {customer.email}</div>
                                    </td>
                                    <td>
                                        <span className="loyalty-points">
                                            💎 {customer.loyaltyPoints || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="registration-date">
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('it-IT') : '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default CustomerManagement;
