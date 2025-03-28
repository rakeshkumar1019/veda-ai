import * as vscode from 'vscode';
import { join } from 'path';

export function activate(context: vscode.ExtensionContext) {
    const provider = new SidebarProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("veda-ai.mainView", provider)
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('veda-ai.history', () => {
            createFormPanel('History', 'View your conversation history');
        }),
        vscode.commands.registerCommand('veda-ai.puls', () => {
            createFormPanel('Puls', 'Configure your Puls settings');
        }),
        vscode.commands.registerCommand('veda-ai.settings', () => {
            createFormPanel('Settings', 'Adjust your preferences');
        })
    );
}

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
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'resources')
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

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendPrompt':
                    // Handle prompt submission
                    const response = await this.getAIResponse(message.text);
                    webviewView.webview.postMessage({ 
                        type: 'response', 
                        content: response 
                    });
                    break;
            }
        });
    }

    private async getAIResponse(prompt: string): Promise<string> {
        // Simulate AI response - replace with actual AI integration
        return `Response to: ${prompt}`;
    }
}

function createFormPanel(title: string, contentText: string) {
    const panel = vscode.window.createWebviewPanel(
        'vedaAiForm',
        title,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    padding: 20px; 
                    font-family: var(--vscode-font-family);
                }
                .close-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 8px 16px;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                .content {
                    margin-top: 40px;
                }
                textarea {
                    width: 100%;
                    height: 150px;
                    margin: 10px 0;
                    padding: 8px;
                }
            </style>
        </head>
        <body>
            <button class="close-btn" onclick="vscode.postMessage({command: 'close'})">Close</button>
            <div class="content">
                <h2>${title}</h2>
                <p>${contentText}</p>
                <textarea placeholder="Enter your text here..."></textarea>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.querySelector('.close-btn').addEventListener('click', () => {
                    vscode.postMessage({ command: 'close' });
                });
            </script>
        </body>
        </html>
    `;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'close':
                    panel.dispose();
                    return;
            }
        },
        undefined,
        []
    );
}

export function deactivate() {}
