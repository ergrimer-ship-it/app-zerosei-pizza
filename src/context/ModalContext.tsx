import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ModalType = 'alert' | 'confirm';

interface ModalState {
    open: boolean;
    type: ModalType;
    title?: string;
    message: string;
    resolve?: (value: boolean) => void;
}

interface ModalContextValue {
    showAlert: (message: string, title?: string) => Promise<void>;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalState>({ open: false, type: 'alert', message: '' });

    const close = useCallback((result: boolean) => {
        setModal(prev => {
            prev.resolve?.(result);
            return { ...prev, open: false };
        });
    }, []);

    const showAlert = useCallback((message: string, title?: string): Promise<void> => {
        return new Promise(resolve => {
            setModal({ open: true, type: 'alert', message, title, resolve: () => resolve() as unknown as (v: boolean) => void });
        });
    }, []);

    const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
        return new Promise(resolve => {
            setModal({ open: true, type: 'confirm', message, title, resolve });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {modal.open && (
                <div className="modal-overlay" onClick={() => close(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        {modal.title && <h3 className="modal-title">{modal.title}</h3>}
                        <p className="modal-message">{modal.message}</p>
                        <div className="modal-actions">
                            {modal.type === 'confirm' && (
                                <button className="modal-btn modal-btn-cancel" onClick={() => close(false)}>
                                    Annulla
                                </button>
                            )}
                            <button className="modal-btn modal-btn-confirm" onClick={() => close(true)}>
                                Ok
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal(): ModalContextValue {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error('useModal must be used inside ModalProvider');
    return ctx;
}
