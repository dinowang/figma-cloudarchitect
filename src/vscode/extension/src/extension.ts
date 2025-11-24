import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

interface Icon {
  id: number;
  name: string;
  source: string;
  category: string;
  file: string;
}

let lastActiveEditor: vscode.TextEditor | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  // Track the active editor
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      // Only track text editors, not the webview panel
      if (editor && editor.document.uri.scheme === 'file') {
        lastActiveEditor = editor;
      }
    })
  );

  // Register webview view provider for sidebar
  const provider = new IconsViewProvider(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'cloudArchitectKits.iconsView',
      provider
    )
  );

  // Keep the command for backward compatibility
  const insertIconCommand = vscode.commands.registerCommand(
    'cloudArchitectKits.insertIcon',
    () => {
      // This command now just focuses the sidebar view
      vscode.commands.executeCommand('cloudArchitectKits.iconsView.focus');
    }
  );

  context.subscriptions.push(insertIconCommand);
}

class IconsViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'webview')
      ]
    };

    webviewView.webview.html = getWebviewContent(this._extensionUri, webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async message => {
      switch (message.command) {
        case 'insertIcon':
          await insertIcon(message.icon);
          break;
      }
    });
  }
}

function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
  const webviewUri = vscode.Uri.joinPath(extensionUri, 'webview');
  
  const htmlPath = vscode.Uri.joinPath(webviewUri, 'ui-base.html').fsPath;
  const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'ui-base.css'));
  const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'ui-base.js'));
  const iconsDataUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'icons-data.js'));

  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Replace PLATFORM_HEAD_PLACEHOLDER
  html = html.replace(
    '<!-- PLATFORM_HEAD_PLACEHOLDER -->',
    `<link rel="stylesheet" href="${cssUri}">
    <style>
      :root {
        --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        --primary-color: #007acc;
        --header-bg: #e8f4fd;
        --hover-bg: #e8f4fd;
      }
      body {
        padding: 12px;
      }
    </style>`
  );

  // Replace SIZE_UNIT_PLACEHOLDER
  html = html.replace('<!-- SIZE_UNIT_PLACEHOLDER -->', 'px');

  // Replace PLATFORM_SCRIPTS_PLACEHOLDER
  html = html.replace(
    '<!-- PLATFORM_SCRIPTS_PLACEHOLDER -->',
    `<script src="${iconsDataUri}"></script>
    <script src="${jsUri}"></script>
    <script>
      const vscode = acquireVsCodeApi();
      
      function handleIconClick(icon) {
        const size = document.getElementById('icon-size').value;
        vscode.postMessage({
          command: 'insertIcon',
          icon: icon,
          size: parseInt(size) || 64
        });
      }
      
      window.addEventListener('DOMContentLoaded', () => {
        initializeIcons();
        setupEventListeners();
      });
    </script>`
  );

  return html;
}

async function insertIcon(iconData: any) {
  // Try to use the active editor first, fallback to last active editor
  let editor = vscode.window.activeTextEditor;
  
  // If current active is the webview, use the last tracked editor
  if (!editor || editor.document.uri.scheme !== 'file') {
    editor = lastActiveEditor;
  }

  if (!editor) {
    vscode.window.showErrorMessage('No text editor found. Please open a file first.');
    return;
  }

  try {
    // The icon SVG is already in base64 format in iconData.svg
    if (!iconData.svg) {
      vscode.window.showErrorMessage(`Icon data not found: ${iconData.file}`);
      return;
    }

    const languageId = editor.document.languageId;
    const position = editor.selection.active;
    let contentToInsert: string;

    // Determine what to insert based on file type
    if (languageId === 'markdown') {
      // Markdown: Insert as <img> tag with base64 data URI
      const size = iconData.size || 64;
      contentToInsert = `<img alt="${iconData.name}" width="${size}" src="data:image/svg+xml;base64,${iconData.svg}" />`;
    } else if (isMarkupLanguage(languageId)) {
      // HTML/XML: Insert raw SVG with size applied
      let svgContent = Buffer.from(iconData.svg, 'base64').toString('utf-8');
      
      // Apply size if specified
      if (iconData.size && iconData.size !== 64) {
        svgContent = svgContent.replace(
          /<svg([^>]*)>/,
          `<svg$1 width="${iconData.size}" height="${iconData.size}">`
        );
      }
      
      contentToInsert = svgContent;
    } else {
      // Other files: Just insert the icon name
      contentToInsert = iconData.name;
    }

    // Show the editor and insert
    await vscode.window.showTextDocument(editor.document, editor.viewColumn);
    
    await editor.edit(editBuilder => {
      editBuilder.insert(position, contentToInsert);
    });

    vscode.window.showInformationMessage(`Inserted ${iconData.name} icon`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to insert icon: ${error}`);
    console.error(error);
  }
}

function isMarkupLanguage(languageId: string): boolean {
  const markupLanguages = [
    'html',
    'xml',
    'xhtml',
    'svg',
    'vue',
    'svelte',
    'jsx',
    'tsx',
    'javascriptreact',
    'typescriptreact'
  ];
  return markupLanguages.includes(languageId);
}

export function deactivate() {
  // Cleanup if needed
}
