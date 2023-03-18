import { lstatSync, readFile } from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import * as TabManager from './tabs/TabManager';

export function activate(context: vscode.ExtensionContext) {
	// Close side bar after creating files.
	context.subscriptions.push(vscode.workspace.onDidCreateFiles(evt => {
		for (const file of evt.files) {
			if (lstatSync(file.fsPath).isDirectory()) { return; }
		}
		vscode.commands.executeCommand("workbench.action.closeSidebar");
	}));

	// Tab Manager.
	context.subscriptions.push(TabManager.init());
	context.subscriptions.push(vscode.commands.registerCommand("my-tools.tabManagement.moveTabUp", TabManager.moveTabUp));
	context.subscriptions.push(vscode.commands.registerCommand("my-tools.tabManagement.moveTabDown", TabManager.moveTabDown));
	context.subscriptions.push(vscode.commands.registerCommand("my-tools.tabManagement.focusAtIndex", TabManager.focus));
	context.subscriptions.push(vscode.commands.registerCommand("my-tools.tabManagement.openAtIndex", TabManager.selectTab));
	context.subscriptions.push(vscode.commands.registerCommand("my-tools.tabManagement.closeEditor", TabManager.removeTab));
	context.subscriptions.push(vscode.window.tabGroups.onDidChangeTabs(() => TabManager.update()));
}

export function deactivate() { }
