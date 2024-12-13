const LoadingState = () => (
    <div style={{
        padding: '40px',
        margin: '20px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.3s ease-in-out'
    }}>
        <div style={{ marginBottom: '16px' }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
            }} />
            正在加载数据...
        </div>
        <div style={{ fontSize: '14px', color: '#888' }}>
            首次加载可能需要几秒钟
        </div>
    </div>
);