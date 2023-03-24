import { lstatSync } from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import * as TabManager from './tabs/TabManager';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        // Close side bar after creating files.
        vscode.workspace.onDidCreateFiles(evt => {
            for (const file of evt.files) {
                if (lstatSync(file.fsPath).isDirectory()) { return; }
            }
            vscode.commands.executeCommand("workbench.action.closeSidebar");
        }),
        // Tab Manager.
        TabManager.init(),
        vscode.commands.registerCommand("my-tools.tabManagement.openView", TabManager.open),
        vscode.commands.registerCommand("my-tools.tabManagement.moveTabUp", TabManager.registerMoveTabUp),
        vscode.commands.registerCommand("my-tools.tabManagement.moveTabDown", TabManager.registerMoveTabDown),
        vscode.commands.registerCommand("my-tools.tabManagement.focusAtIndex", TabManager.registerFocusTab),
        vscode.commands.registerCommand("my-tools.tabManagement.openAtIndex", TabManager.registerSelectTab),
        vscode.commands.registerCommand("my-tools.tabManagement.closeEditor", TabManager.registerRemoveTab),
        vscode.commands.registerCommand("my-tools.tabManagement.listSelectAndClose", TabManager.registerSelectList),
        vscode.window.tabGroups.onDidChangeTabs(() => TabManager.update()),
        vscode.window.tabGroups.onDidChangeTabGroups(() => TabManager.update())
    );
}

export function deactivate() { }
