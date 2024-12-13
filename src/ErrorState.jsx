const ErrorState = ({ error, onRetry }) => (
    <div style={{
        padding: '32px',
        margin: '20px',
        background: '#fee2e2',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        textAlign: 'center'
    }}>
        <div style={{ 
            color: '#dc2626',
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 'bold'
        }}>
            {error || '加载失败'}
        </div>
        <button
            onClick={onRetry}
            style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
            }}
        >
            重试
        </button>
    </div>
);