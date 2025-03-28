import * as React from 'react';
import { createRoot } from 'react-dom/client';

class SidebarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(webviewView: vscode.WebviewView): void {
        const scriptUri = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );
        const styleUri = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'styles.css')
        );

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist')
            ]
        };

        webviewView.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webviewView.webview.cspSource}; script-src ${webviewView.webview.cspSource};">
                <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div id="root"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
            setState: (state: any) => void;
            getState: () => any;
        };
    }
}

const vscode = window.acquireVsCodeApi();

const App: React.FC = () => {
    const [prompt, setPrompt] = React.useState('');
    const [response, setResponse] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [mode, setMode] = React.useState('Assistant');
    const [context, setContext] = React.useState('current-file');

    React.useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'response') {
                setResponse(message.content);
                setLoading(false);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        setLoading(true);
        vscode.postMessage({ command: 'sendPrompt', text: prompt });
    };

    return (
        <div className="app">
            <div className="controlsRow">
                <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)}
                    className="select"
                >
                    <option value="Assistant">Assistant</option>
                    <option value="Code Generator">Code Generator</option>
                    <option value="Translator">Translator</option>
                </select>
                <select 
                    value={context} 
                    onChange={(e) => setContext(e.target.value)}
                    className="select"
                >
                    <option value="current-file">Current File</option>
                    <option value="folder">Folder</option>
                    <option value="editor">Editor</option>
                </select>
            </div>

            <div className="responseArea">
                {response && <pre>{response}</pre>}
            </div>

            <div className="bottomSection">
                <div className="inputSection">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ask a question..."
                        className="promptInput"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="submitButton"
                    >
                        {loading ? '...' : '→'}
                    </button>
                </div>
            </div>
        </div>
    );
};

try {
    const root = createRoot(document.getElementById('root')!);
    root.render(<App />);
} catch (error) {
    console.error('Error rendering app:', error);
}
