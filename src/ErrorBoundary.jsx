// ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('组件渲染错误:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    margin: '20px',
                    textAlign: 'center',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>
                        页面加载出现问题
                    </h2>
                    <p style={{ color: '#666', marginBottom: '16px' }}>
                        抱歉，页面渲染时遇到错误。请尝试刷新页面。
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        刷新页面
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// 确保正确导出组件
export default ErrorBoundary;