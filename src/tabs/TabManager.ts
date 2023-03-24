import * as vscode from 'vscode';
import delay from '../utils/delay';
import queue from '../utils/queue';

enum Motion {
    delete,
    moveUp,
    moveDown,
    selectTab,
    focusTab,
    selectList
}

var view: vscode.TreeView<number>;
var prov: Provider;
const motionQueue: queue<{ motion: Motion, tab?: number }> = new queue();
var suspendSelect: boolean = false;
var inMotion: boolean = false;

class Provider implements vscode.TreeDataProvider<number> {
    private indices: number[] = [];
    private data: vscode.Tab[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<number | undefined | null | void>
        = new vscode.EventEmitter<number | undefined | null | void>();

    readonly onDidChangeTreeData?: vscode.Event<number | void | number[] | null | undefined> | undefined
        = this._onDidChangeTreeData.event;

    getTreeItem(element: number): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (this.data.length === 0) { return new vscode.TreeItem(""); }
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

async function moveTab(up: boolean) {
    await vscode.commands.executeCommand("list.select");

    const newSelection = view.selection.length >= 1 ? view.selection[0] : -1;
    if (newSelection < 0) { return; }
    if (up && newSelection === 1) { return; }
    if (!up && newSelection === prov.getDataSize()) { return; }
    suspendSelect = true;
    await vscode.commands.executeCommand(`workbench.action.moveEditor${up ? "Left" : "Right"}InGroup`);
    await delay(50);

    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    if (activeTabGroup.activeTab === undefined) { suspendSelect = false; return; }
    await view.reveal(activeTabGroup.tabs.indexOf(activeTabGroup.activeTab) + 1, { focus: true });
    suspendSelect = false;
}

async function removeTab() {
    await vscode.commands.executeCommand("list.select");
    suspendSelect = true;
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    if (activeTabGroup.activeTab === undefined) { suspendSelect = false; return; }
    await view.reveal(activeTabGroup.tabs.indexOf(activeTabGroup.activeTab) + 1, { select: true, focus: true });
    suspendSelect = false;
}

async function selectListAndClose() {
    if (suspendSelect) { return; }
    await vscode.commands.executeCommand("list.select");
    if (view.selection.length === 0) { return; }
    await vscode.commands.executeCommand("workbench.action.closeSidebar");
}

async function selectTab(num: number) {
    if (num === 0) {
        await vscode.commands.executeCommand("workbench.action.lastEditorInGroup");
    } else {
        await vscode.commands.executeCommand("workbench.action.openEditorAtIndex", num - 1);
    }
    await vscode.commands.executeCommand("workbench.action.closeSidebar");
}

async function focusTab(num: number) {
    if (num === 0) {
        await view.reveal(prov.getDataSize(), { select: false, focus: true });
        return;
    }
    if (num > prov.getDataSize()) { return; }
    await view.reveal(num, { select: false, focus: true });
}

async function executeMotion() {
    if (inMotion) { return; }
    inMotion = true;
    while (motionQueue.size > 0) {
        if (!view || !view.visible) {
            motionQueue.clear();
            break;
        }
        const motion = motionQueue.dequeue();
        if (motion === undefined) { continue; }
        switch (motion.motion) {
            case Motion.delete:
                await removeTab();
                break;
            case Motion.moveDown:
                await moveTab(false);
                break;
            case Motion.moveUp:
                await moveTab(true);
                break;
            case Motion.selectList:
                await selectListAndClose();
                break;
            case Motion.selectTab:
                await selectTab(motion.tab ?? 0);
                break;
            case Motion.focusTab:
                await focusTab(motion.tab ?? 0);
                break;
            default:
                break;
        }
    }
    inMotion = false;
}

export function init() {
    prov = new Provider();
    view = vscode.window.createTreeView('tabManagement', { treeDataProvider: prov });
    view.onDidChangeSelection(async e => {
        if (e.selection.length === 0) { return; }
        if (suspendSelect) { return; }
        await vscode.commands.executeCommand("workbench.action.openEditorAtIndex", e.selection[0] - 1);
    });

    return view;
}

export function registerMoveTabUp() {
    motionQueue.enqueue({ motion: Motion.moveUp });
    executeMotion();
}

export function registerMoveTabDown() {
    motionQueue.enqueue({ motion: Motion.moveDown });
    executeMotion();
}

export function registerRemoveTab() {
    motionQueue.enqueue({ motion: Motion.delete });
    executeMotion();
}

export function registerSelectList() {
    motionQueue.enqueue({ motion: Motion.selectList });
    executeMotion();
}

export function registerSelectTab(tab: number) {
    motionQueue.enqueue({ motion: Motion.selectTab, tab: tab });
    executeMotion();
}

export function registerFocusTab(tab: number) {
    motionQueue.enqueue({ motion: Motion.focusTab, tab: tab });
    executeMotion();
}

export function update(e?: boolean) {
    if (e === undefined && !view.visible) { return; }
    if (e !== undefined && e === false) { return; }
    prov.setData(vscode.window.tabGroups.activeTabGroup.tabs);
}

export async function open() {
    if (!view) { return; }
    suspendSelect = true;
    await view.reveal(0, { select: false });
    const activeTabGroup = vscode.window.tabGroups.activeTabGroup;
    prov.setData(activeTabGroup.tabs);
    const idx = !activeTabGroup.activeTab ? 0 : activeTabGroup.tabs.indexOf(activeTabGroup.activeTab);
    await view.reveal(idx + 1, { select: true, focus: true });
    suspendSelect = false;
}