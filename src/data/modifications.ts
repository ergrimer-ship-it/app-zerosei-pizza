import { PizzaModification } from '../types';

export const AVAILABLE_MODIFICATIONS: PizzaModification[] = [
    { id: 'm1', name: 'Mozzarella di Bufala', price: 2.00, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm2', name: 'Prosciutto Crudo', price: 2.00, type: 'add', available: true, category: 'Salumi' },
    { id: 'm3', name: 'Speck', price: 1.50, type: 'add', available: true, category: 'Salumi' },
    { id: 'm4', name: 'Salame Piccante', price: 1.00, type: 'add', available: true, category: 'Salumi' },
    { id: 'm5', name: 'Funghi Porcini', price: 2.00, type: 'add', available: true, category: 'Verdure' },
    { id: 'm6', name: 'Rucola', price: 0.50, type: 'add', available: true, category: 'Verdure' },
    { id: 'm7', name: 'Scaglie di Grana', price: 1.00, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm8', name: 'Doppia Mozzarella', price: 1.50, type: 'add', available: true, category: 'Formaggi' },
    { id: 'm9', name: 'Patatine Fritte', price: 1.50, type: 'add', available: true, category: 'Altro' },
    { id: 'm10', name: 'Uovo', price: 1.00, type: 'add', available: true, category: 'Altro' }
];
