import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer style={{
            width: '100%',
            padding: '1rem 0',
            textAlign: 'center',
            background: '#f5f5f5',
            color: 'gray',
            fontSize: '0.95rem',
            boxShadow: '0 -1px 5px rgba(0, 0, 0, 0.1)',
        }}>
            © {new Date().getFullYear()} Softfkilla. Todos los derechos reservados.
        </footer>
    );
};

export default Footer;