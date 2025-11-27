import { Category } from '../types';

export const categories: Category[] = [
    {
        id: 'pizze-veraci',
        name: 'Pizze Veraci',
        description: 'Le nostre pizze veraci napoletane',
        icon: '🍕',
        order: 1
    },
    {
        id: 'pizze-classiche',
        name: 'Pizze Classiche',
        description: 'Le pizze tradizionali',
        icon: '🍕',
        order: 2
    },
    {
        id: 'proposte',
        name: 'Le Nostre Proposte',
        description: 'Pizze speciali della casa',
        icon: '⭐',
        order: 3
    },
    {
        id: 'calzoni',
        name: 'Calzoni',
        description: 'Calzoni ripieni',
        icon: '🥟',
        order: 4
    },
    {
        id: 'bevande',
        name: 'Bevande',
        description: 'Bibite e bevande',
        icon: '🥤',
        order: 5
    },
    {
        id: 'birre',
        name: 'Birre',
        description: 'Selezione di birre',
        icon: '🍺',
        order: 6
    }
];
