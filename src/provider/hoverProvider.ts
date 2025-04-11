import * as vscode from 'vscode';
import { getI18nKey, getTips, localsData } from '../utils';

const hoverProvider = {
    provideHover: (document: vscode.TextDocument, position: vscode.Position) => {
        const { character } = position;
        // 获取当前行内容
        let lineWord = document.lineAt(position).text;
        const { value } = getI18nKey(lineWord, character) || {};

        if (!value) {
            return;
        }

        const tips = getTips(value, localsData);

        if (tips) {
            return new vscode.Hover(tips);
        }
    }
}


export default hoverProvider;