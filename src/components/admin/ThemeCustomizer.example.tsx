/**
 * ESEMPIO: Come Aggiungere Nuove Proprietà al Sistema Tema
 * 
 * Questo file mostra come estendere il ThemeCustomizer per aggiungere
 * nuove proprietà personalizzabili (es: shadows, transitions, etc.)
 */

// ============================================
// STEP 1: Estendere ThemeConfig Interface
// ============================================

interface ThemeConfig {
    // ... proprietà esistenti ...

    // Nuove proprietà per le ombre
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowXl: string;

    // Nuove proprietà per le transizioni
    transitionFast: string;
    transitionBase: string;
    transitionSlow: string;

    // Nuove proprietà per font families
    fontHeading: string;
    fontBody: string;
}

// ============================================
// STEP 2: Aggiornare defaultTheme
// ============================================

const defaultTheme: ThemeConfig = {
    // ... valori esistenti ...

    // Valori default per le ombre
    shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
    shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',

    // Valori default per le transizioni
    transitionFast: '150ms ease-in-out',
    transitionBase: '250ms ease-in-out',
    transitionSlow: '350ms ease-in-out',

    // Valori default per i font
    fontHeading: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
};

// ============================================
// STEP 3: Estendere applyTheme()
// ============================================

const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;

    // ... applicazione proprietà esistenti ...

    // Applica ombre
    root.style.setProperty('--shadow-sm', themeConfig.shadowSm);
    root.style.setProperty('--shadow-md', themeConfig.shadowMd);
    root.style.setProperty('--shadow-lg', themeConfig.shadowLg);
    root.style.setProperty('--shadow-xl', themeConfig.shadowXl);

    // Applica transizioni
    root.style.setProperty('--transition-fast', themeConfig.transitionFast);
    root.style.setProperty('--transition-base', themeConfig.transitionBase);
    root.style.setProperty('--transition-slow', themeConfig.transitionSlow);

    // Applica font families
    root.style.setProperty('--font-heading', themeConfig.fontHeading);
    root.style.setProperty('--font-body', themeConfig.fontBody);
};

// ============================================
// STEP 4: Aggiungere Tab nella UI
// ============================================

// In ThemeCustomizer.tsx, aggiorna activeSection type:
type ActiveSection = 'colors' | 'typography' | 'spacing' | 'radius' | 'icons' | 'shadows' | 'transitions' | 'fonts';

// Aggiungi nuovi tab:
<button
    className={`theme-tab ${activeSection === 'shadows' ? 'active' : ''}`}
    onClick={() => setActiveSection('shadows')}
>
    💫 Ombre
</button>

<button
    className={`theme-tab ${activeSection === 'transitions' ? 'active' : ''}`}
    onClick={() => setActiveSection('transitions')}
>
    ⚡ Transizioni
</button>

<button
    className={`theme-tab ${activeSection === 'fonts' ? 'active' : ''}`}
    onClick={() => setActiveSection('fonts')}
>
    🔤 Font
</button>

// ============================================
// STEP 5: Aggiungere Contenuto Sezioni
// ============================================

// Sezione Ombre
{
    activeSection === 'shadows' && (
        <div className="theme-section">
            <h3>Ombre</h3>
            <div className="shadow-grid">
                <div className="input-group">
                    <label>Shadow Small</label>
                    <input
                        type="text"
                        value={theme.shadowSm}
                        onChange={(e) => updateTheme('shadowSm', e.target.value)}
                        placeholder="0 1px 2px rgba(0,0,0,0.1)"
                    />
                    <div
                        className="shadow-preview"
                        style={{ boxShadow: theme.shadowSm }}
                    >
                        Preview
                    </div>
                </div>

                <div className="input-group">
                    <label>Shadow Medium</label>
                    <input
                        type="text"
                        value={theme.shadowMd}
                        onChange={(e) => updateTheme('shadowMd', e.target.value)}
                        placeholder="0 4px 6px rgba(0,0,0,0.1)"
                    />
                    <div
                        className="shadow-preview"
                        style={{ boxShadow: theme.shadowMd }}
                    >
                        Preview
                    </div>
                </div>

                {/* ... altre ombre ... */}
            </div>
            <p className="hint">💡 Usa il formato CSS box-shadow (es: 0 4px 6px rgba(0,0,0,0.1))</p>
        </div>
    )
}

// Sezione Transizioni
{
    activeSection === 'transitions' && (
        <div className="theme-section">
            <h3>Transizioni</h3>
            <div className="transition-grid">
                <div className="input-group">
                    <label>Transition Fast</label>
                    <input
                        type="text"
                        value={theme.transitionFast}
                        onChange={(e) => updateTheme('transitionFast', e.target.value)}
                        placeholder="150ms ease-in-out"
                    />
                    <button
                        className="transition-demo"
                        style={{ transition: `all ${theme.transitionFast}` }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Hover me!
                    </button>
                </div>

                {/* ... altre transizioni ... */}
            </div>
            <p className="hint">💡 Usa il formato CSS transition (es: 250ms ease-in-out)</p>
        </div>
    )
}

// Sezione Font Families
{
    activeSection === 'fonts' && (
        <div className="theme-section">
            <h3>Font Families</h3>
            <div className="font-grid">
                <div className="input-group">
                    <label>Font Heading</label>
                    <input
                        type="text"
                        value={theme.fontHeading}
                        onChange={(e) => updateTheme('fontHeading', e.target.value)}
                        placeholder="'Poppins', sans-serif"
                    />
                    <div
                        className="font-preview"
                        style={{ fontFamily: theme.fontHeading }}
                    >
                        <h2>Heading Preview</h2>
                    </div>
                </div>

                <div className="input-group">
                    <label>Font Body</label>
                    <input
                        type="text"
                        value={theme.fontBody}
                        onChange={(e) => updateTheme('fontBody', e.target.value)}
                        placeholder="'Inter', sans-serif"
                    />
                    <div
                        className="font-preview"
                        style={{ fontFamily: theme.fontBody }}
                    >
                        <p>Body text preview. Lorem ipsum dolor sit amet.</p>
                    </div>
                </div>
            </div>
            <p className="hint">💡 Usa nomi di font Google Fonts o font di sistema</p>
        </div>
    )
}

// ============================================
// STEP 6: Aggiungere Stili CSS
// ============================================

/* In ThemeCustomizer.css */

.shadow - grid,
.transition - grid,
.font - grid {
    display: grid;
    grid - template - columns: repeat(auto - fill, minmax(280px, 1fr));
    gap: var(--spacing - lg);
    margin - bottom: var(--spacing - lg);
}

.shadow - preview {
    width: 100 %;
    height: 80px;
    background: white;
    border - radius: var(--radius - md);
    display: flex;
    align - items: center;
    justify - content: center;
    margin - top: var(--spacing - sm);
    font - weight: var(--font - weight - medium);
}

.transition - demo {
    width: 100 %;
    padding: var(--spacing - md);
    background: var(--color - primary);
    color: white;
    border: none;
    border - radius: var(--radius - md);
    cursor: pointer;
    margin - top: var(--spacing - sm);
}

.font - preview {
    width: 100 %;
    padding: var(--spacing - lg);
    background: var(--color - bg - secondary);
    border - radius: var(--radius - md);
    margin - top: var(--spacing - sm);
}

// ============================================
// STEP 7: Aggiornare useTheme Hook (Opzionale)
// ============================================

// Se vuoi gestire automaticamente la conversione dei nomi,
// estendi la logica in useTheme.ts:

const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;

    Object.entries(themeConfig).forEach(([key, value]) => {
        // Gestione colori
        if (key.startsWith('color')) {
            const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
            root.style.setProperty(cssVar, value);
        }
        // Gestione font sizes
        else if (key.startsWith('fontSize')) {
            const cssVar = '--font-size-' + key.replace('fontSize', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
        // Gestione spacing
        else if (key.startsWith('spacing')) {
            const cssVar = '--spacing-' + key.replace('spacing', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
        // Gestione radius
        else if (key.startsWith('radius')) {
            const cssVar = '--radius-' + key.replace('radius', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
        // Gestione shadows
        else if (key.startsWith('shadow')) {
            const cssVar = '--shadow-' + key.replace('shadow', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
        // Gestione transitions
        else if (key.startsWith('transition')) {
            const cssVar = '--transition-' + key.replace('transition', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
        // Gestione font families
        else if (key.startsWith('font') && (key.includes('Heading') || key.includes('Body'))) {
            const cssVar = '--font-' + key.replace('font', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
            root.style.setProperty(cssVar, value);
        }
    });
};

// ============================================
// ESEMPIO COMPLETO: Preset Temi
// ============================================

// Puoi creare preset temi predefiniti:

const presetThemes = {
    default: {
        colorPrimary: '#E74C3C',
        colorSecondary: '#27AE60',
        // ... altri valori default
    },

    dark: {
        colorPrimary: '#E74C3C',
        colorSecondary: '#27AE60',
        colorBg: '#1a1a1a',
        colorBgSecondary: '#2d2d2d',
        colorBgTertiary: '#3d3d3d',
        colorText: '#ffffff',
        colorTextSecondary: '#b0b0b0',
        colorTextLight: '#808080',
        colorBorder: '#404040',
        // ... altri valori per dark mode
    },

    christmas: {
        colorPrimary: '#C41E3A',
        colorSecondary: '#0F8A5F',
        colorAccent: '#FFD700',
        iconOrders: '🎁',
        iconProducts: '🎄',
        // ... altri valori natalizi
    },

    summer: {
        colorPrimary: '#FF6B35',
        colorSecondary: '#00D9FF',
        colorAccent: '#FFD23F',
        iconOrders: '🏖️',
        iconProducts: '🍹',
        // ... altri valori estivi
    }
};

// Aggiungi pulsanti per applicare i preset:
<div className="preset-themes">
    <h3>Temi Predefiniti</h3>
    <div className="preset-grid">
        <button onClick={() => applyPreset('default')}>
            🎨 Default
        </button>
        <button onClick={() => applyPreset('dark')}>
            🌙 Dark Mode
        </button>
        <button onClick={() => applyPreset('christmas')}>
            🎄 Natale
        </button>
        <button onClick={() => applyPreset('summer')}>
            ☀️ Estate
        </button>
    </div>
</div>

const applyPreset = (presetName: keyof typeof presetThemes) => {
    const preset = presetThemes[presetName];
    setTheme(prev => ({ ...prev, ...preset }));
    applyTheme({ ...theme, ...preset });
};

// ============================================
// ESEMPIO: Export/Import Tema
// ============================================

// Funzione per esportare il tema corrente
const exportTheme = () => {
    const themeJson = JSON.stringify(theme, null, 2);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Funzione per importare un tema
const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedTheme = JSON.parse(e.target?.result as string);
            setTheme(importedTheme);
            applyTheme(importedTheme);
            alert('Tema importato con successo! 🎉');
        } catch (error) {
            alert('Errore nell\'importazione del tema');
            console.error(error);
        }
    };
    reader.readAsText(file);
};

// UI per export/import:
<div className="theme-io">
    <button onClick={exportTheme}>
        📥 Esporta Tema
    </button>
    <label className="import-btn">
        📤 Importa Tema
        <input
            type="file"
            accept=".json"
            onChange={importTheme}
            hidden
        />
    </label>
</div>

/**
 * CONCLUSIONE
 * 
 * Questo file mostra come estendere facilmente il sistema tema.
 * Segui questi step per aggiungere nuove funzionalità:
 * 
 * 1. Estendi ThemeConfig interface
 * 2. Aggiorna defaultTheme
 * 3. Estendi applyTheme()
 * 4. Aggiungi tab nella UI
 * 5. Aggiungi contenuto sezioni
 * 6. Aggiungi stili CSS
 * 7. (Opzionale) Aggiorna useTheme hook
 * 
 * Il sistema è progettato per essere facilmente estensibile!
 */
