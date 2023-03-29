import { commands, ConfigurationChangeEvent, workspace } from 'vscode';

export async function update(evt: ConfigurationChangeEvent) {
    const a = workspace.getConfiguration("my-tools");
    if (!workspace.getConfiguration("my-tools").get("zenMode.autoShowStatusBar")) {
        return;
    }
    if (!evt.affectsConfiguration("workbench.colorCustomizations")) {
        return;
    }

    const colorConfig = workspace.getConfiguration("vim.statusBarColors");
    const statusConfig = workspace.getConfiguration("workbench.colorCustomizations");
    const statusBackground = statusConfig["statusBar.background"];
    if (colorConfig.get("commandlineinprogress") === statusBackground
        || colorConfig.get("searchinprogressmode") === statusBackground) {
        await workspace.getConfiguration("zenMode").update("hideStatusBar", false, true);
        await commands.executeCommand("workbench.action.toggleZenMode");
        await commands.executeCommand("workbench.action.toggleZenMode");
    }
    else {
        await workspace.getConfiguration("zenMode").update("hideStatusBar", true, true);
        await commands.executeCommand("workbench.action.toggleZenMode");
        await commands.executeCommand("workbench.action.toggleZenMode");
    }
}