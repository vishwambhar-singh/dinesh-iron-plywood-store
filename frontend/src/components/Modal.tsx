import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    isSidebar?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = '500px', isSidebar = false }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: isSidebar ? 'flex-start' : 'center',
            justifyContent: isSidebar ? 'flex-end' : 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel" style={{
                width: isSidebar ? '80vw' : '100%',
                maxWidth: isSidebar ? '80vw' : maxWidth,
                height: isSidebar ? '100vh' : 'auto',
                maxHeight: isSidebar ? '100vh' : '90vh',
                padding: '24px',
                position: 'relative',
                borderRadius: isSidebar ? '0' : '16px',
                overflowY: 'auto',
                animation: isSidebar ? 'slideLeft 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'slideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}>

                <style>{`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideLeft {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                    }
                `}</style>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.25rem' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                
                <div style={{ height: isSidebar ? 'calc(100% - 80px)' : 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;


