import * as vscode from 'vscode';

const configuration = vscode.workspace.getConfiguration();
const workspaceFolders = vscode.workspace.workspaceFolders;
const defaultConfigPath = 'src/locale';

const getRelativeConfigPath = () => {
    if (!workspaceFolders?.length) return defaultConfigPath;
    
    // 获取当前打开文件的路径
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const filePath = activeEditor.document.uri.fsPath;
        const parts = filePath.split(/[\\/]/);
        
        // 查找是否是monorepo子项目
        const pluginsIndex = parts.indexOf('plugins');
        if (pluginsIndex > -1 && parts.length > pluginsIndex + 1) {
            const projectName = parts[pluginsIndex + 1];
            return `plugins/${projectName}/${defaultConfigPath}`;
        }
    }
    
    return defaultConfigPath;
};

const config = {
    suffix: configuration.get('react-intl-helper.suffix', '.json'),
    getRelativeConfigPath
};

export default config;