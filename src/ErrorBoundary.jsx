import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 max-w-xl mx-auto mt-8 bg-red-50 rounded-lg border border-red-200">
                    <h2 className="text-xl font-semibold text-red-700 mb-4">应用程序出现错误</h2>
                    <div className="text-red-600 mb-4">
                        {this.state.error && this.state.error.toString()}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        重新加载页面
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;