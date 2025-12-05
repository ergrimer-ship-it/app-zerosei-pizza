import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LoyaltyReward } from '../../types';
import './FidelityRewardsManagement.css';

interface RewardFormData {
    name: string;
    description: string;
    pointsRequired: number;
    imageUrl: string;
}

const defaultRewards: LoyaltyReward[] = [
    {
        id: 'reward1',
        name: 'Bibita in omaggio',
        description: 'Una bibita a scelta',
        pointsRequired: 100,
        imageUrl: '🥤',
        available: true
    },
    {
        id: 'reward2',
        name: 'Pizza Margherita',
        description: 'Pizza Margherita omaggio',
        pointsRequired: 200,
        imageUrl: '🍕',
        available: true
    },
    {
        id: 'reward3',
        name: 'Dolce a scelta',
        description: 'Un dolce della casa',
        pointsRequired: 150,
        imageUrl: '🍰',
        available: true
    }
];

function FidelityRewardsManagement() {
    const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<RewardFormData>({
        name: '',
        description: '',
        pointsRequired: 100,
        imageUrl: '🎁'
    });

    useEffect(() => {
        loadRewards();
    }, []);

    const loadRewards = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'config', 'rewards');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setRewards(data.rewards || defaultRewards);
            } else {
                // Se non esiste, usa i default
                setRewards(defaultRewards);
                await saveRewards(defaultRewards);
            }
        } catch (error) {
            console.error('Error loading rewards:', error);
            setRewards(defaultRewards);
        }
        setLoading(false);
    };

    const saveRewards = async (updatedRewards: LoyaltyReward[]) => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'config', 'rewards'), {
                rewards: updatedRewards,
                updatedAt: new Date()
            });
            setRewards(updatedRewards);
            alert('✅ Premi salvati con successo!');
        } catch (error) {
            console.error('Error saving rewards:', error);
            alert('❌ Errore nel salvataggio');
        }
        setSaving(false);
    };

    const handleAddReward = () => {
        if (!formData.name || formData.pointsRequired <= 0) {
            alert('Inserisci nome e punti validi');
            return;
        }

        const newReward: LoyaltyReward = {
            id: `reward_${Date.now()}`,
            name: formData.name,
            description: formData.description,
            pointsRequired: formData.pointsRequired,
            imageUrl: formData.imageUrl,
            available: true
        };

        saveRewards([...rewards, newReward]);
        resetForm();
    };

    const handleUpdateReward = () => {
        if (!editingId || !formData.name || formData.pointsRequired <= 0) {
            alert('Inserisci dati validi');
            return;
        }

        const updatedRewards = rewards.map(r =>
            r.id === editingId
                ? { ...r, ...formData }
                : r
        );

        saveRewards(updatedRewards);
        resetForm();
    };

    const handleEditReward = (reward: LoyaltyReward) => {
        setEditingId(reward.id);
        setFormData({
            name: reward.name,
            description: reward.description,
            pointsRequired: reward.pointsRequired,
            imageUrl: reward.imageUrl || '🎁'
        });
    };

    const handleDeleteReward = (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo premio?')) {
            const updatedRewards = rewards.filter(r => r.id !== id);
            saveRewards(updatedRewards);
        }
    };

    const handleToggleAvailable = (id: string) => {
        const updatedRewards = rewards.map(r =>
            r.id === id ? { ...r, available: !r.available } : r
        );
        saveRewards(updatedRewards);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const updatedRewards = [...rewards];
        [updatedRewards[index], updatedRewards[index - 1]] = [updatedRewards[index - 1], updatedRewards[index]];
        saveRewards(updatedRewards);
    };

    const handleMoveDown = (index: number) => {
        if (index === rewards.length - 1) return;
        const updatedRewards = [...rewards];
        [updatedRewards[index], updatedRewards[index + 1]] = [updatedRewards[index + 1], updatedRewards[index]];
        saveRewards(updatedRewards);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            pointsRequired: 100,
            imageUrl: '🎁'
        });
    };

    if (loading) {
        return <div className="rewards-management"><div className="loading">Caricamento...</div></div>;
    }

    return (
        <div className="rewards-management">
            <div className="rewards-header">
                <h2>🎁 Gestione Premi Fidelity</h2>
                <p className="rewards-description">
                    Configura i premi che i clienti possono visualizzare nella loro Fidelity Card
                </p>
            </div>

            {/* Form */}
            <div className="rewards-form">
                <h3>{editingId ? 'Modifica Premio' : 'Nuovo Premio'}</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Icona (Emoji)</label>
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="🎁"
                            maxLength={2}
                        />
                    </div>
                    <div className="form-group">
                        <label>Nome Premio *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Es: Bibita in omaggio"
                        />
                    </div>
                    <div className="form-group">
                        <label>Punti Richiesti *</label>
                        <input
                            type="number"
                            value={formData.pointsRequired}
                            onChange={(e) => setFormData({ ...formData, pointsRequired: Number(e.target.value) })}
                            min="1"
                        />
                    </div>
                    <div className="form-group full-width">
                        <label>Descrizione</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descrizione breve del premio"
                        />
                    </div>
                </div>
                <div className="form-actions">
                    {editingId ? (
                        <>
                            <button onClick={handleUpdateReward} className="btn btn-primary" disabled={saving}>
                                💾 Aggiorna
                            </button>
                            <button onClick={resetForm} className="btn btn-outline">
                                ✖️ Annulla
                            </button>
                        </>
                    ) : (
                        <button onClick={handleAddReward} className="btn btn-primary" disabled={saving}>
                            ➕ Aggiungi Premio
                        </button>
                    )}
                </div>
            </div>

            {/* Lista Premi */}
            <div className="rewards-list">
                <h3>Premi Configurati ({rewards.length})</h3>
                {rewards.length === 0 ? (
                    <div className="empty-state">
                        <p>Nessun premio configurato. Aggiungi il primo premio!</p>
                    </div>
                ) : (
                    <div className="rewards-grid">
                        {rewards.map((reward, index) => (
                            <div key={reward.id} className={`reward-card ${!reward.available ? 'inactive' : ''}`}>
                                <div className="reward-icon-large">{reward.imageUrl}</div>
                                <div className="reward-content">
                                    <h4>{reward.name}</h4>
                                    <p className="reward-desc">{reward.description}</p>
                                    <p className="reward-points">{reward.pointsRequired} Punti</p>
                                    <span className={`reward-status ${reward.available ? 'active' : 'inactive'}`}>
                                        {reward.available ? '✅ Attivo' : '❌ Disattivato'}
                                    </span>
                                </div>
                                <div className="reward-actions">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="btn-icon"
                                        title="Sposta su"
                                    >
                                        ⬆️
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === rewards.length - 1}
                                        className="btn-icon"
                                        title="Sposta giù"
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        onClick={() => handleToggleAvailable(reward.id)}
                                        className="btn-icon"
                                        title={reward.available ? 'Disattiva' : 'Attiva'}
                                    >
                                        {reward.available ? '🔒' : '🔓'}
                                    </button>
                                    <button
                                        onClick={() => handleEditReward(reward)}
                                        className="btn-icon"
                                        title="Modifica"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDeleteReward(reward.id)}
                                        className="btn-icon btn-danger"
                                        title="Elimina"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FidelityRewardsManagement;
