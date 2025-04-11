import * as vscode from 'vscode';

const configuration = vscode.workspace.getConfiguration();
const config = {
    configPath: configuration.get('react-intl-helper.configPath', 'src/locale'),
    suffix: configuration.get('react-intl-helper.suffix', '.json')
};

export default config;