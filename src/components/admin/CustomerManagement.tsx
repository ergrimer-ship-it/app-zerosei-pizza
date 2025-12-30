import { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/dbService';
import { getLoyaltyPoints, linkCustomerProfile } from '../../services/cassaCloudService'; // Import sync services
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore'; // Import firestore functions
import { UserProfile } from '../../types';
import './CustomerManagement.css';

function CustomerManagement() {
    const [customers, setCustomers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false); // New state for sync progress
    const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 }); // Progress tracking
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            sortAndSetCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
            alert('Errore nel caricamento dei clienti');
        } finally {
            setLoading(false);
        }
    };

    const sortAndSetCustomers = (data: UserProfile[]) => {
        // Sort by Last Access (desc) then Created At (desc)
        data.sort((a, b) => {
            const lastAccessA = a.lastAccess ? new Date(a.lastAccess).getTime() : 0;
            const lastAccessB = b.lastAccess ? new Date(b.lastAccess).getTime() : 0;

            if (lastAccessA !== lastAccessB) {
                return lastAccessB - lastAccessA;
            }

            // Fallback to registration date
            const createdAtA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const createdAtB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return createdAtB - createdAtA;
        });
        setCustomers(data);
    };

    const handleSync = async () => {
        if (!window.confirm("Attenzione: Questa operazione sincronizzerà i punti di TUTTI i clienti con Cassa in Cloud.\n\nPotrebbe richiedere diversi minuti in base al numero di clienti.\n\nVuoi procedere?")) {
            return;
        }

        setSyncing(true);
        setSyncProgress({ current: 0, total: customers.length });

        // Working copy to update UI progressively
        let updatedCustomers = [...customers];
        let successCount = 0;

        for (let i = 0; i < customers.length; i++) {
            const customer = customers[i];
            setSyncProgress({ current: i + 1, total: customers.length });

            try {
                let loyaltyPoints = customer.loyaltyPoints || 0;
                let customerId = customer.cassaCloudId;

                // 1. If no ID, try to link
                if (!customerId) {
                    customerId = await linkCustomerProfile(customer) || undefined;
                    if (customerId && customer.id) {
                        // Save ID to Firestore if found
                        await updateDoc(doc(db, 'users', customer.id), { cassaCloudId: customerId });
                        // Update local object
                        customer.cassaCloudId = customerId;
                    }
                }

                // 2. Fetch points if ID available
                if (customerId) {
                    const pointsData = await getLoyaltyPoints(customerId);
                    if (pointsData) {
                        loyaltyPoints = pointsData.points;

                        // Update Firestore if changed
                        if (loyaltyPoints !== customer.loyaltyPoints && customer.id) {
                            await updateDoc(doc(db, 'users', customer.id), {
                                loyaltyPoints: loyaltyPoints,
                                loyaltyPointsLastSync: new Date().toISOString()
                            });
                        }
                    }
                }

                // Update local array for immediate feedback
                updatedCustomers[i] = {
                    ...customer,
                    loyaltyPoints: loyaltyPoints,
                    cassaCloudId: customerId
                };
                successCount++;

            } catch (err) {
                console.error(`Error syncing customer ${customer.email}:`, err);
            }

            // Small delay to prevent freezing UI completely
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 50));
        }

        // Final UI update
        sortAndSetCustomers(updatedCustomers);
        setSyncing(false);
        alert(`Sincronizzazione completata!\n${successCount} clienti elaborati.`);
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
                    <button
                        onClick={loadCustomers}
                        className="btn-icon"
                        title="Ricarica DB locale"
                        disabled={syncing}
                    >
                        🔄
                    </button>
                    <button
                        onClick={handleSync}
                        className="btn btn-primary btn-sm"
                        title="Sincronizza punti con CassaCloud"
                        disabled={syncing}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        {syncing ? 'Sincronizzazione...' : '☁️ Sincronizza Punti'}
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

            {syncing && (
                <div className="sync-progress-bar" style={{ margin: '15px 0', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>
                        Sincronizzazione in corso... ({syncProgress.current}/{syncProgress.total})
                    </p>
                    <div style={{ width: '100%', height: '8px', background: '#ddd', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                            style={{
                                width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                                height: '100%',
                                background: '#4CAF50',
                                transition: 'width 0.3s ease'
                            }}
                        />
                    </div>
                </div>
            )}

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
                                <th>Stato Sync</th>
                                <th>Registrato il</th>
                                <th>Ultimo Accesso</th>
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
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                                            {customer.cassaCloudId ? '✅ Collegato' : '⚠️ Non collegato'}
                                            {customer.loyaltyPointsLastSync && (
                                                <div title={new Date(customer.loyaltyPointsLastSync || '').toLocaleString()}>
                                                    Agg: {new Date(customer.loyaltyPointsLastSync || '').toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="registration-date">
                                            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('it-IT') : '-'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="registration-date">
                                            {customer.lastAccess ? new Date(customer.lastAccess).toLocaleDateString('it-IT') + ' ' + new Date(customer.lastAccess).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '-'}
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
