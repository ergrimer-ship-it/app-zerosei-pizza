import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ThemeConfig {
    colorPrimary?: string;
    colorPrimaryDark?: string;
    colorPrimaryLight?: string;
    colorSecondary?: string;
    colorSecondaryDark?: string;
    colorSecondaryLight?: string;
    colorAccent?: string;
    colorAccentDark?: string;
    colorBg?: string;
    colorBgSecondary?: string;
    colorBgTertiary?: string;
    colorText?: string;
    colorTextSecondary?: string;
    colorTextLight?: string;
    colorBorder?: string;
    fontSizeBase?: string;
    fontSizeSm?: string;
    fontSizeLg?: string;
    fontSizeXl?: string;
    fontSize2xl?: string;
    fontSize3xl?: string;
    fontSize4xl?: string;
    spacingSm?: string;
    spacingMd?: string;
    spacingLg?: string;
    spacingXl?: string;
    spacing2xl?: string;
    radiusSm?: string;
    radiusMd?: string;
    radiusLg?: string;
    radiusXl?: string;
    iconOrders?: string;
    iconProducts?: string;
    iconIngredients?: string;
    iconCategories?: string;
    iconPromotions?: string;
    iconCustomers?: string;
    iconSettings?: string;
}

export function useTheme() {
    const [theme, setTheme] = useState<ThemeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAndApplyTheme();
    }, []);

    const loadAndApplyTheme = async () => {
        try {
            const docRef = doc(db, 'config', 'theme');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const themeData = docSnap.data() as ThemeConfig;
                setTheme(themeData);
                applyTheme(themeData);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (themeConfig: ThemeConfig) => {
        const root = document.documentElement;

        // Apply all theme properties
        Object.entries(themeConfig).forEach(([key, value]) => {
            if (key.startsWith('color')) {
                const cssVar = '--' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
                root.style.setProperty(cssVar, value);
            } else if (key.startsWith('fontSize')) {
                const cssVar = '--font-size-' + key.replace('fontSize', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                root.style.setProperty(cssVar, value);
            } else if (key.startsWith('spacing')) {
                const cssVar = '--spacing-' + key.replace('spacing', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                root.style.setProperty(cssVar, value);
            } else if (key.startsWith('radius')) {
                const cssVar = '--radius-' + key.replace('radius', '').replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                root.style.setProperty(cssVar, value);
            }
        });
    };

    return { theme, loading, reload: loadAndApplyTheme };
}
