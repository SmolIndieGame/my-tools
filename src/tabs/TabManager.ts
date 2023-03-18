import * as vscode from 'vscode';
import delay from '../utils/delay';
import queue from '../utils/queue';

var view: vscode.TreeView<number>;
var prov: Provider;
const moveQueue: queue<{ up: boolean, index: number }> = new queue();
var suspendSelect: boolean = false;
var keepViewAfterSelect: boolean = false;
var moving: boolean = false;
var deleting: boolean = false;

class Provider implements vscode.TreeDataProvider<number> {
    private indices: number[] = [];
    private data: vscode.Tab[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<number | undefined | null | void>
        = new vscode.EventEmitter<number | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<number | void | number[] | null | undefined> | undefined
        = this._onDidChangeTreeData.event;

    getTreeItem(element: number): vscode.TreeItem | Thenable<vscode.TreeItem> {
        const index = element <= this.data.length ? element - 1 : 0;
        const item = new vscode.TreeItem(this.data[index].label);
        if (index < 9) { item.description = `alt + ${index + 1}`; }
        if (index === this.data.length - 1) { item.description = "alt + 0"; }
        return item;
    }
    getChildren(element?: number | undefined): vscode.ProviderResult<number[]> {
        if (element !== undefined) { return []; }
        return this.indices;
    }
    getParent(element: number): vscode.ProviderResult<number> {
        return undefined;
    }
    setData(data: readonly vscode.Tab[]) {
        this.indices = data.map((_, i) => i + 1);
        this.data = data.map(x => x);
        this._onDidChangeTreeData.fire();
    }
    getDataSize() {
        return this.data.length;
    }
}

export function init() {
    prov = new Provider();
    view = vscode.window.createTreeView('tabManagement', { treeDataProvider: prov });
    view.onDidChangeVisibility(e => update(e.visible));
    view.onDidChangeSelection(async e => {
        if (e.selection.length === 0) { return; }
        if (suspendSelect) { return; }
        await vscode.commands.executeCommand("workbench.action.openEditorAtIndex", e.selection[0] - 1);
        if (keepViewAfterSelect) { keepViewAfterSelect = false; return; }
        await vscode.commands.executeCommand("workbench.action.closeSidebar");
    });

    return view;
}

async function moveTab() {
    moving = true;
    while (moveQueue.size > 0) {
        const request = moveQueue.dequeue();
        if (request === undefined) { continue; }
        keepViewAfterSelect = true;
        await vscode.commands.executeCommand("list.select");

        const newSelection = view.selection.length >= 1 ? view.selection[0] : -1;
        if (newSelection < 0) { continue; }
        if (request.up && newSelection === 1) { continue; }
        if (!request.up && newSelection === prov.getDataSize()) { continue; }
        suspendSelect = true;
        await vscode.commands.executeCommand(`workbench.action.moveEditor${request.up ? "Left" : "Right"}InGroup`);

        const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
        if (activeTabGroup.activeTab === undefined) { suspendSelect = false; continue; }
        await view.reveal(activeTabGroup.tabs.indexOf(activeTabGroup.activeTab) + 1, { focus: true });
        suspendSelect = false;
    }
    moving = false;
}

function registerTabMove(up: boolean) {
    moveQueue.enqueue({ up, index: 0 });
    if (!moving) { moveTab(); }
}

export function moveTabUp() { registerTabMove(true); }

export function moveTabDown() { registerTabMove(false); }

export async function removeTab() {
    if (deleting) { return; }
    deleting = true;
    try {
        keepViewAfterSelect = true;
        await vscode.commands.executeCommand("list.select");
        suspendSelect = true;
        await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
        // await delay(100);
        const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
        if (activeTabGroup.activeTab === undefined) { suspendSelect = false; return; }
        await view.reveal(activeTabGroup.tabs.indexOf(activeTabGroup.activeTab) + 1, { select: true, focus: true });
        suspendSelect = false;
    } finally {
        deleting = false;
    }
}

export async function selectTab(num: number) {
    if (num === 0) {
        await vscode.commands.executeCommand("workbench.action.lastEditorInGroup");
    } else {
        await vscode.commands.executeCommand("workbench.action.openEditorAtIndex", num - 1);
    }

    await vscode.commands.executeCommand("workbench.action.closeSidebar");
}

export function update(e?: boolean) {
    if (e === undefined && !view.visible) { return; }
    if (e !== undefined && e === false) { return; }
    prov.setData(vscode.window.tabGroups.activeTabGroup.tabs);
}

export function focus(num: number) {
    if (!view || !view.visible) { return; }
    if (num === 0) {
        view.reveal(prov.getDataSize(), { select: false, focus: true });
    } else {
        view.reveal(num, { select: false, focus: true });
    }
}
