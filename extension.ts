import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('veda-ai.history', () => {
            createFormPanel('History Form', 'This is the history form content.');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('veda-ai.puls', () => {
            createFormPanel('Puls Form', 'This is the puls form content.');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('veda-ai.settings', () => {
            createFormPanel('Settings Form', 'This is the settings form content.');
        })
    );
}

function createFormPanel(title: string, contentText: string) {
    const panel = vscode.window.createWebviewPanel(
        'vedaAiForm', // internal identifier
        title,        // panel title
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    panel.webview.html = getWebviewContent(title, contentText);
}

function getWebviewContent(title: string, contentText: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 20px; position: relative; }
    .close { position: absolute; top: 10px; right: 10px; cursor: pointer; background: #ddd; padding: 5px 10px; }
  </style>
</head>
<body>
  <div class="close" onclick="window.close()">Cancel</div>
  <h1>${title}</h1>
  <p>${contentText}</p>
</body>
</html>`;
}