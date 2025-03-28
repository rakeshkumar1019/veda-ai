import * as React from 'react';
import { createRoot } from 'react-dom/client';

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

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const App: React.FC = () => {
    const [prompt, setPrompt] = React.useState('');
    const [conversation, setConversation] = React.useState<Message[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Context selection state for context types (current file, folder, workspace)
    const [context, setContext] = React.useState('current-file');
    const [contextInfo, setContextInfo] = React.useState('');

    // LLM mode select (replacing previous assistant names with LLM model names)
    const [llmMode, setLlmMode] = React.useState('gpt-4');

    // Track focus state for prompt container border styling
    const [isFocused, setIsFocused] = React.useState(false);

    // Simulate dynamic loading of context info (replace with real VS Code API calls)
    React.useEffect(() => {
        if (context === 'current-file') {
            setContextInfo('main.txt');
        } else if (context === 'folder') {
            setContextInfo('src');
        } else if (context === 'workspace') {
            setContextInfo('MyWorkspace');
        }
    }, [context]);

    React.useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'response') {
                setConversation((prev) => [
                    ...prev,
                    { role: 'assistant', content: message.content },
                ]);
                setLoading(false);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    const handleSubmit = () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setConversation((prev) => [
            ...prev,
            { role: 'user', content: prompt },
        ]);
        vscode.postMessage({
            command: 'sendPrompt',
            text: prompt,
            context,
            contextInfo,
            llmMode,
        });
        setPrompt('');
    };

    return (
        <div style={styles.app}>
            {/* Conversation Area */}
            <div style={styles.conversation}>
                {conversation.map((msg, idx) => (
                    <div
                        key={idx}
                        style={
                            msg.role === 'user'
                                ? { ...styles.messageBubble, ...styles.userBubble }
                                : { ...styles.messageBubble, ...styles.assistantBubble }
                        }
                    >
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ ...styles.messageBubble, ...styles.assistantBubble }}>
                        <em>Thinking...</em>
                    </div>
                )}
            </div>

            {/* Prompt Container with dynamic border */}
            <div
                style={{
                    ...styles.promptContainer,
                    borderColor: isFocused ? 'var(--vscode-button-background)' : 'var(--vscode-panel-border)',
                }}
            >
                {/* Top Row: Context select and dynamic context info */}
                <div style={styles.contextRow}>
                    <select
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        style={styles.roundedSelect}
                        title="Select Context"
                    >
                        <option value="current-file">Current File</option>
                        <option value="folder">Folder</option>
                        <option value="workspace">Workspace</option>
                    </select>
                    <div style={styles.contextDisplay}>
                        {contextInfo && <span>{contextInfo}</span>}
                    </div>
                </div>

                {/* Textarea for prompt */}
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a question..."
                    style={styles.textarea}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />

                {/* Bottom Row: LLM mode select and small send button on the right */}
                <div style={styles.actionRow}>
                    <div style={styles.rightActions}>
                        <select
                            value={llmMode}
                            onChange={(e) => setLlmMode(e.target.value)}
                            style={styles.roundedSelect}
                            title="Select LLM Model"
                        >
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5">GPT-3.5</option>
                            <option value="gpt-4.5-preview-2025-02-28">gpt-4.5-preview-2025-02-28</option>
                            <option value="gpt-4.5-preview-2025-02-27">gpt-4.5-preview-2025-02-27</option>
                        </select>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={loading ? styles.smallSendButtonDisabled : styles.smallSendButton}
                            title="Send"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    app: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column' as React.CSSProperties['flexDirection'],
        backgroundColor: 'var(--vscode-editor-background)',
        color: 'var(--vscode-editor-foreground)',
        fontFamily: 'var(--vscode-font-family)',
    },
    conversation: {
        flex: 1,
        overflowY: 'auto' as React.CSSProperties['overflowY'],
        display: 'flex',
        flexDirection: 'column' as React.CSSProperties['flexDirection'],
        gap: '0.5rem',
    },
    messageBubble: {
        maxWidth: '60%',
        // padding: '0.1rem 0.75rem',
        borderRadius: '0.5rem',
        whiteSpace: 'pre-wrap' as React.CSSProperties['whiteSpace'],
        wordWrap: 'break-word' as React.CSSProperties['wordWrap'],
        fontSize: '0.85rem',
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: 'var(--vscode-editor-background)',
        border: '1px solid var(--vscode-input-border)',
    },
    assistantBubble: {
        alignSelf: 'flex-start',
        backgroundColor: 'var(--vscode-panel-background)',
        border: '1px solid var(--vscode-widget-border)',
    },
    promptContainer: {
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: '4px',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column' as React.CSSProperties['flexDirection'],
        gap: '0.5rem',
        width: '99%',
    },
    contextRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    roundedSelect: {
        padding: '0.1rem 0.5rem',
        fontSize: '0.65rem',
        backgroundColor: 'var(--vscode-dropdown-background)',
        color: 'var(--vscode-dropdown-foreground)',
        border: '1px solid var(--vscode-dropdown-border)',
        borderRadius: '9999px', // pill-shaped select
    },
    contextDisplay: {
        fontSize: '0.75rem',
        color: 'var(--vscode-editor-foreground)',
    },
    textarea: {
        width: '97%',
        resize: 'vertical' as React.CSSProperties['resize'],
        backgroundColor: 'transparent',
        color: 'var(--vscode-input-foreground)',
        border: '1px solid var(--vscode-input-border)',
        padding: '0.5rem',
        fontFamily: 'var(--vscode-editor-font-family)',
        fontSize: '0.85rem',
        borderRadius: '4px',
        outline: 'none', // remove native focus outline
    },
    actionRow: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    rightActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    smallSendButton: {
        padding: '0.1rem 0.5rem',
        fontSize: '0.65rem',
        backgroundColor: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    smallSendButtonDisabled: {
        padding: '0.1rem 0.5rem',
        fontSize: '0.75rem',
        backgroundColor: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
        border: 'none',
        borderRadius: '4px',
        opacity: 0.5,
        cursor: 'not-allowed',
    },
};

try {
    const root = createRoot(document.getElementById('root')!);
    root.render(<App />);
} catch (error) {
    console.error('Error rendering app:', error);
}
