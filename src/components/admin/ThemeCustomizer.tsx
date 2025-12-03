import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import './ThemeCustomizer.css';

interface ThemeConfig {
    // Colors
    colorPrimary: string;
    colorPrimaryDark: string;
    colorPrimaryLight: string;
    colorSecondary: string;
    colorSecondaryDark: string;
    colorSecondaryLight: string;
    colorAccent: string;
    colorAccentDark: string;
    colorBg: string;
    colorBgSecondary: string;
    colorBgTertiary: string;
    colorText: string;
    colorTextSecondary: string;
    colorTextLight: string;
    colorBorder: string;

    // Typography
    fontSizeBase: string;
    fontSizeSm: string;
    fontSizeLg: string;
    fontSizeXl: string;
    fontSize2xl: string;
    fontSize3xl: string;
    fontSize4xl: string;

    // Spacing
    spacingSm: string;
    spacingMd: string;
    spacingLg: string;
    spacingXl: string;
    spacing2xl: string;

    // Border Radius
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    radiusXl: string;

    // Admin Icons
    iconOrders: string;
    iconProducts: string;
    iconIngredients: string;
    iconCategories: string;
    iconPromotions: string;
    iconCustomers: string;
    iconSettings: string;
}

const defaultTheme: ThemeConfig = {
    colorPrimary: '#E74C3C',
    colorPrimaryDark: '#C0392B',
    colorPrimaryLight: '#EC7063',
    colorSecondary: '#27AE60',
    colorSecondaryDark: '#229954',
    colorSecondaryLight: '#58D68D',
    colorAccent: '#F39C12',
    colorAccentDark: '#D68910',
    colorBg: '#FFFFFF',
    colorBgSecondary: '#F8F9FA',
    colorBgTertiary: '#ECF0F1',
    colorText: '#2C3E50',
    colorTextSecondary: '#7F8C8D',
    colorTextLight: '#95A5A6',
    colorBorder: '#E0E0E0',

    fontSizeBase: '1rem',
    fontSizeSm: '0.875rem',
    fontSizeLg: '1.125rem',
    fontSizeXl: '1.25rem',
    fontSize2xl: '1.5rem',
    fontSize3xl: '2rem',
    fontSize4xl: '2.5rem',

    spacingSm: '0.5rem',
    spacingMd: '1rem',
    spacingLg: '1.5rem',
    spacingXl: '2rem',
    spacing2xl: '3rem',

    radiusSm: '0.25rem',
    radiusMd: '0.5rem',
    radiusLg: '1rem',
    radiusXl: '1.5rem',

    iconOrders: '📦',
    iconProducts: '🍕',
    iconIngredients: '🧀',
    iconCategories: '📂',
    iconPromotions: '📢',
    iconCustomers: '👥',
    iconSettings: '⚙️',
};

function ThemeCustomizer() {
    const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'spacing' | 'radius' | 'icons'>('colors');

    useEffect(() => {
        loadTheme();
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const loadTheme = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'config', 'theme');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const savedTheme = { ...defaultTheme, ...docSnap.data() };
                setTheme(savedTheme);
                applyTheme(savedTheme);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
        setLoading(false);
    };

    const applyTheme = (themeConfig: ThemeConfig) => {
        const root = document.documentElement;

        // Apply colors
        root.style.setProperty('--color-primary', themeConfig.colorPrimary);
        root.style.setProperty('--color-primary-dark', themeConfig.colorPrimaryDark);
        root.style.setProperty('--color-primary-light', themeConfig.colorPrimaryLight);
        root.style.setProperty('--color-secondary', themeConfig.colorSecondary);
        root.style.setProperty('--color-secondary-dark', themeConfig.colorSecondaryDark);
        root.style.setProperty('--color-secondary-light', themeConfig.colorSecondaryLight);
        root.style.setProperty('--color-accent', themeConfig.colorAccent);
        root.style.setProperty('--color-accent-dark', themeConfig.colorAccentDark);
        root.style.setProperty('--color-bg', themeConfig.colorBg);
        root.style.setProperty('--color-bg-secondary', themeConfig.colorBgSecondary);
        root.style.setProperty('--color-bg-tertiary', themeConfig.colorBgTertiary);
        root.style.setProperty('--color-text', themeConfig.colorText);
        root.style.setProperty('--color-text-secondary', themeConfig.colorTextSecondary);
        root.style.setProperty('--color-text-light', themeConfig.colorTextLight);
        root.style.setProperty('--color-border', themeConfig.colorBorder);

        // Apply typography
        root.style.setProperty('--font-size-base', themeConfig.fontSizeBase);
        root.style.setProperty('--font-size-sm', themeConfig.fontSizeSm);
        root.style.setProperty('--font-size-lg', themeConfig.fontSizeLg);
        root.style.setProperty('--font-size-xl', themeConfig.fontSizeXl);
        root.style.setProperty('--font-size-2xl', themeConfig.fontSize2xl);
        root.style.setProperty('--font-size-3xl', themeConfig.fontSize3xl);
        root.style.setProperty('--font-size-4xl', themeConfig.fontSize4xl);

        // Apply spacing
        root.style.setProperty('--spacing-sm', themeConfig.spacingSm);
        root.style.setProperty('--spacing-md', themeConfig.spacingMd);
        root.style.setProperty('--spacing-lg', themeConfig.spacingLg);
        root.style.setProperty('--spacing-xl', themeConfig.spacingXl);
        root.style.setProperty('--spacing-2xl', themeConfig.spacing2xl);

        // Apply border radius
        root.style.setProperty('--radius-sm', themeConfig.radiusSm);
        root.style.setProperty('--radius-md', themeConfig.radiusMd);
        root.style.setProperty('--radius-lg', themeConfig.radiusLg);
        root.style.setProperty('--radius-xl', themeConfig.radiusXl);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'config', 'theme'), {
                ...theme,
                updatedAt: new Date()
            });
            alert('Tema salvato con successo! ✨');
        } catch (error) {
            console.error('Error saving theme:', error);
            alert('Errore nel salvataggio del tema');
        }
        setSaving(false);
    };

    const handleReset = async () => {
        if (confirm('Sei sicuro di voler ripristinare il tema predefinito?')) {
            setTheme(defaultTheme);
            applyTheme(defaultTheme);
            try {
                await setDoc(doc(db, 'config', 'theme'), {
                    ...defaultTheme,
                    updatedAt: new Date()
                });
                alert('Tema ripristinato! 🔄');
            } catch (error) {
                console.error('Error resetting theme:', error);
            }
        }
    };

    const updateTheme = (key: keyof ThemeConfig, value: string) => {
        setTheme(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="loading">Caricamento tema...</div>;

    return (
        <div className="theme-customizer">
            <div className="theme-header">
                <h2>🎨 Personalizzazione Tema</h2>
                <p className="theme-description">
                    Personalizza tutti gli aspetti estetici dell'applicazione
                </p>
            </div>

            <div className="theme-tabs">
                <button
                    className={`theme-tab ${activeSection === 'colors' ? 'active' : ''}`}
                    onClick={() => setActiveSection('colors')}
                >
                    🎨 Colori
                </button>
                <button
                    className={`theme-tab ${activeSection === 'typography' ? 'active' : ''}`}
                    onClick={() => setActiveSection('typography')}
                >
                    📝 Tipografia
                </button>
                <button
                    className={`theme-tab ${activeSection === 'spacing' ? 'active' : ''}`}
                    onClick={() => setActiveSection('spacing')}
                >
                    📏 Spaziature
                </button>
                <button
                    className={`theme-tab ${activeSection === 'radius' ? 'active' : ''}`}
                    onClick={() => setActiveSection('radius')}
                >
                    ⭕ Arrotondamenti
                </button>
                <button
                    className={`theme-tab ${activeSection === 'icons' ? 'active' : ''}`}
                    onClick={() => setActiveSection('icons')}
                >
                    🎭 Icone Admin
                </button>
            </div>

            <div className="theme-content">
                {activeSection === 'colors' && (
                    <div className="theme-section">
                        <h3>Colori Primari</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Colore Primario</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorPrimary}
                                        onChange={(e) => updateTheme('colorPrimary', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorPrimary}
                                        onChange={(e) => updateTheme('colorPrimary', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Primario Scuro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorPrimaryDark}
                                        onChange={(e) => updateTheme('colorPrimaryDark', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorPrimaryDark}
                                        onChange={(e) => updateTheme('colorPrimaryDark', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Primario Chiaro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorPrimaryLight}
                                        onChange={(e) => updateTheme('colorPrimaryLight', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorPrimaryLight}
                                        onChange={(e) => updateTheme('colorPrimaryLight', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3>Colori Secondari</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Colore Secondario</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorSecondary}
                                        onChange={(e) => updateTheme('colorSecondary', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorSecondary}
                                        onChange={(e) => updateTheme('colorSecondary', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Secondario Scuro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorSecondaryDark}
                                        onChange={(e) => updateTheme('colorSecondaryDark', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorSecondaryDark}
                                        onChange={(e) => updateTheme('colorSecondaryDark', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Secondario Chiaro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorSecondaryLight}
                                        onChange={(e) => updateTheme('colorSecondaryLight', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorSecondaryLight}
                                        onChange={(e) => updateTheme('colorSecondaryLight', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3>Colori Accent</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Colore Accent</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorAccent}
                                        onChange={(e) => updateTheme('colorAccent', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorAccent}
                                        onChange={(e) => updateTheme('colorAccent', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Accent Scuro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorAccentDark}
                                        onChange={(e) => updateTheme('colorAccentDark', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorAccentDark}
                                        onChange={(e) => updateTheme('colorAccentDark', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3>Colori Sfondo</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Sfondo Principale</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorBg}
                                        onChange={(e) => updateTheme('colorBg', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorBg}
                                        onChange={(e) => updateTheme('colorBg', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Sfondo Secondario</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorBgSecondary}
                                        onChange={(e) => updateTheme('colorBgSecondary', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorBgSecondary}
                                        onChange={(e) => updateTheme('colorBgSecondary', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Sfondo Terziario</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorBgTertiary}
                                        onChange={(e) => updateTheme('colorBgTertiary', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorBgTertiary}
                                        onChange={(e) => updateTheme('colorBgTertiary', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3>Colori Testo</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Testo Principale</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorText}
                                        onChange={(e) => updateTheme('colorText', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorText}
                                        onChange={(e) => updateTheme('colorText', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Testo Secondario</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorTextSecondary}
                                        onChange={(e) => updateTheme('colorTextSecondary', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorTextSecondary}
                                        onChange={(e) => updateTheme('colorTextSecondary', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                            <div className="color-input-group">
                                <label>Testo Chiaro</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorTextLight}
                                        onChange={(e) => updateTheme('colorTextLight', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorTextLight}
                                        onChange={(e) => updateTheme('colorTextLight', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3>Altri Colori</h3>
                        <div className="color-grid">
                            <div className="color-input-group">
                                <label>Bordi</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={theme.colorBorder}
                                        onChange={(e) => updateTheme('colorBorder', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={theme.colorBorder}
                                        onChange={(e) => updateTheme('colorBorder', e.target.value)}
                                        className="color-text-input"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === 'typography' && (
                    <div className="theme-section">
                        <h3>Dimensioni Font</h3>
                        <div className="typography-grid">
                            <div className="input-group">
                                <label>Font Base (16px default)</label>
                                <input
                                    type="text"
                                    value={theme.fontSizeBase}
                                    onChange={(e) => updateTheme('fontSizeBase', e.target.value)}
                                    placeholder="1rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font Small</label>
                                <input
                                    type="text"
                                    value={theme.fontSizeSm}
                                    onChange={(e) => updateTheme('fontSizeSm', e.target.value)}
                                    placeholder="0.875rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font Large</label>
                                <input
                                    type="text"
                                    value={theme.fontSizeLg}
                                    onChange={(e) => updateTheme('fontSizeLg', e.target.value)}
                                    placeholder="1.125rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font XL</label>
                                <input
                                    type="text"
                                    value={theme.fontSizeXl}
                                    onChange={(e) => updateTheme('fontSizeXl', e.target.value)}
                                    placeholder="1.25rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font 2XL</label>
                                <input
                                    type="text"
                                    value={theme.fontSize2xl}
                                    onChange={(e) => updateTheme('fontSize2xl', e.target.value)}
                                    placeholder="1.5rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font 3XL</label>
                                <input
                                    type="text"
                                    value={theme.fontSize3xl}
                                    onChange={(e) => updateTheme('fontSize3xl', e.target.value)}
                                    placeholder="2rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Font 4XL</label>
                                <input
                                    type="text"
                                    value={theme.fontSize4xl}
                                    onChange={(e) => updateTheme('fontSize4xl', e.target.value)}
                                    placeholder="2.5rem"
                                />
                            </div>
                        </div>
                        <p className="hint">💡 Usa unità rem (es: 1rem, 1.5rem) o px (es: 16px, 24px)</p>
                    </div>
                )}

                {activeSection === 'spacing' && (
                    <div className="theme-section">
                        <h3>Spaziature</h3>
                        <div className="spacing-grid">
                            <div className="input-group">
                                <label>Spacing Small</label>
                                <input
                                    type="text"
                                    value={theme.spacingSm}
                                    onChange={(e) => updateTheme('spacingSm', e.target.value)}
                                    placeholder="0.5rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Spacing Medium</label>
                                <input
                                    type="text"
                                    value={theme.spacingMd}
                                    onChange={(e) => updateTheme('spacingMd', e.target.value)}
                                    placeholder="1rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Spacing Large</label>
                                <input
                                    type="text"
                                    value={theme.spacingLg}
                                    onChange={(e) => updateTheme('spacingLg', e.target.value)}
                                    placeholder="1.5rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Spacing XL</label>
                                <input
                                    type="text"
                                    value={theme.spacingXl}
                                    onChange={(e) => updateTheme('spacingXl', e.target.value)}
                                    placeholder="2rem"
                                />
                            </div>
                            <div className="input-group">
                                <label>Spacing 2XL</label>
                                <input
                                    type="text"
                                    value={theme.spacing2xl}
                                    onChange={(e) => updateTheme('spacing2xl', e.target.value)}
                                    placeholder="3rem"
                                />
                            </div>
                        </div>
                        <p className="hint">💡 Usa unità rem (es: 1rem, 2rem) o px (es: 16px, 32px)</p>
                    </div>
                )}

                {activeSection === 'radius' && (
                    <div className="theme-section">
                        <h3>Arrotondamenti Bordi</h3>
                        <div className="radius-grid">
                            <div className="input-group">
                                <label>Radius Small</label>
                                <input
                                    type="text"
                                    value={theme.radiusSm}
                                    onChange={(e) => updateTheme('radiusSm', e.target.value)}
                                    placeholder="0.25rem"
                                />
                                <div className="radius-preview" style={{ borderRadius: theme.radiusSm }}></div>
                            </div>
                            <div className="input-group">
                                <label>Radius Medium</label>
                                <input
                                    type="text"
                                    value={theme.radiusMd}
                                    onChange={(e) => updateTheme('radiusMd', e.target.value)}
                                    placeholder="0.5rem"
                                />
                                <div className="radius-preview" style={{ borderRadius: theme.radiusMd }}></div>
                            </div>
                            <div className="input-group">
                                <label>Radius Large</label>
                                <input
                                    type="text"
                                    value={theme.radiusLg}
                                    onChange={(e) => updateTheme('radiusLg', e.target.value)}
                                    placeholder="1rem"
                                />
                                <div className="radius-preview" style={{ borderRadius: theme.radiusLg }}></div>
                            </div>
                            <div className="input-group">
                                <label>Radius XL</label>
                                <input
                                    type="text"
                                    value={theme.radiusXl}
                                    onChange={(e) => updateTheme('radiusXl', e.target.value)}
                                    placeholder="1.5rem"
                                />
                                <div className="radius-preview" style={{ borderRadius: theme.radiusXl }}></div>
                            </div>
                        </div>
                        <p className="hint">💡 Usa unità rem (es: 0.5rem, 1rem) o px (es: 8px, 16px)</p>
                    </div>
                )}

                {activeSection === 'icons' && (
                    <div className="theme-section">
                        <h3>Icone Sidebar Admin</h3>
                        <div className="icons-grid">
                            <div className="input-group">
                                <label>Icona Ordini</label>
                                <input
                                    type="text"
                                    value={theme.iconOrders}
                                    onChange={(e) => updateTheme('iconOrders', e.target.value)}
                                    placeholder="📦"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconOrders}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Prodotti</label>
                                <input
                                    type="text"
                                    value={theme.iconProducts}
                                    onChange={(e) => updateTheme('iconProducts', e.target.value)}
                                    placeholder="🍕"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconProducts}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Ingredienti</label>
                                <input
                                    type="text"
                                    value={theme.iconIngredients}
                                    onChange={(e) => updateTheme('iconIngredients', e.target.value)}
                                    placeholder="🧀"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconIngredients}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Categorie</label>
                                <input
                                    type="text"
                                    value={theme.iconCategories}
                                    onChange={(e) => updateTheme('iconCategories', e.target.value)}
                                    placeholder="📂"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconCategories}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Promozioni</label>
                                <input
                                    type="text"
                                    value={theme.iconPromotions}
                                    onChange={(e) => updateTheme('iconPromotions', e.target.value)}
                                    placeholder="📢"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconPromotions}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Clienti</label>
                                <input
                                    type="text"
                                    value={theme.iconCustomers}
                                    onChange={(e) => updateTheme('iconCustomers', e.target.value)}
                                    placeholder="👥"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconCustomers}</span>
                            </div>
                            <div className="input-group">
                                <label>Icona Impostazioni</label>
                                <input
                                    type="text"
                                    value={theme.iconSettings}
                                    onChange={(e) => updateTheme('iconSettings', e.target.value)}
                                    placeholder="⚙️"
                                    maxLength={2}
                                />
                                <span className="icon-preview">{theme.iconSettings}</span>
                            </div>
                        </div>
                        <p className="hint">💡 Usa emoji o caratteri speciali (max 2 caratteri)</p>
                    </div>
                )}
            </div>

            <div className="theme-actions">
                <button
                    className="btn-reset"
                    onClick={handleReset}
                    disabled={saving}
                >
                    🔄 Ripristina Default
                </button>
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '💾 Salvataggio...' : '💾 Salva Modifiche'}
                </button>
            </div>
        </div>
    );
}

export default ThemeCustomizer;
