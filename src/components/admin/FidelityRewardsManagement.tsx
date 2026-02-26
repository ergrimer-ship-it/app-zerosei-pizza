import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LoyaltyReward } from '../../types';
import './FidelityRewardsManagement.css';

interface HowItWorksSection {
    title: string;
    description: string;
}

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

    // How It Works state
    const [howItWorks, setHowItWorks] = useState<HowItWorksSection[]>([]);
    const [savingHIW, setSavingHIW] = useState(false);
    const [newSection, setNewSection] = useState<HowItWorksSection>({ title: '', description: '' });

    useEffect(() => {
        loadRewards();
        loadHowItWorks();
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

    const loadHowItWorks = async () => {
        try {
            const docRef = doc(db, 'config', 'fidelity');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setHowItWorks(docSnap.data().howItWorks || []);
            }
        } catch (error) {
            console.error('Error loading howItWorks:', error);
        }
    };

    const saveHowItWorks = async (sections: HowItWorksSection[]) => {
        setSavingHIW(true);
        try {
            await setDoc(doc(db, 'config', 'fidelity'), {
                howItWorks: sections,
                updatedAt: new Date()
            }, { merge: true });
            setHowItWorks(sections);
            alert('✅ Sezione "Come Funziona" salvata!');
        } catch (error) {
            console.error('Error saving howItWorks:', error);
            alert('❌ Errore nel salvataggio');
        }
        setSavingHIW(false);
    };

    const handleAddSection = () => {
        if (!newSection.title && !newSection.description) {
            alert('Inserisci almeno un titolo o una descrizione');
            return;
        }
        saveHowItWorks([...howItWorks, newSection]);
        setNewSection({ title: '', description: '' });
    };

    const handleDeleteSection = (index: number) => {
        if (confirm('Eliminare questa sezione?')) {
            saveHowItWorks(howItWorks.filter((_, i) => i !== index));
        }
    };

    const handleMoveSectionUp = (index: number) => {
        if (index === 0) return;
        const updated = [...howItWorks];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        saveHowItWorks(updated);
    };

    const handleMoveSectionDown = (index: number) => {
        if (index === howItWorks.length - 1) return;
        const updated = [...howItWorks];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        saveHowItWorks(updated);
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

            {/* ---- SEZIONE COME FUNZIONA ---- */}
            <div className="rewards-form" style={{ marginTop: '32px' }}>
                <h3>📖 Come Funziona — Testo informativo</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Questo testo appare in fondo alla Fidelity Card dell'utente. Puoi aggiungere più sezioni con titolo e descrizione.
                </p>

                {/* Sezioni esistenti */}
                {howItWorks.map((section, index) => (
                    <div key={index} style={{
                        background: '#f8f8f8', borderRadius: '8px', padding: '12px 16px',
                        marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px'
                    }}>
                        <div style={{ flex: 1 }}>
                            {section.title && <strong style={{ display: 'block', marginBottom: '4px' }}>{section.title}</strong>}
                            {section.description && <span style={{ fontSize: '0.9rem', color: '#555' }}>{section.description}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => handleMoveSectionUp(index)} className="btn-icon" disabled={index === 0} title="Su">⬆️</button>
                            <button onClick={() => handleMoveSectionDown(index)} className="btn-icon" disabled={index === howItWorks.length - 1} title="Giù">⬇️</button>
                            <button onClick={() => handleDeleteSection(index)} className="btn-icon btn-danger" title="Elimina">🗑️</button>
                        </div>
                    </div>
                ))}

                {/* Nuova sezione */}
                <div style={{ marginTop: '16px' }}>
                    <h4 style={{ marginBottom: '10px', fontWeight: 600 }}>➕ Nuova sezione</h4>
                    <div className="form-group">
                        <label>Titolo</label>
                        <input
                            type="text"
                            placeholder="Es: Come si guadagnano i punti"
                            value={newSection.title}
                            onChange={e => setNewSection({ ...newSection, title: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Descrizione</label>
                        <textarea
                            rows={3}
                            placeholder="Es: Ogni volta che ordini, guadagni punti che puoi usare per ricevere premi..."
                            value={newSection.description}
                            onChange={e => setNewSection({ ...newSection, description: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <button
                        onClick={handleAddSection}
                        className="btn btn-primary"
                        disabled={savingHIW}
                    >
                        {savingHIW ? 'Salvataggio...' : '💾 Aggiungi e Salva'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FidelityRewardsManagement;
