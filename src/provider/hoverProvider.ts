import * as vscode from 'vscode';
import { getI18nKey, getTips, localsData, checkLocalsPath, checkHasLocales } from '../utils';

const hoverProvider = {
    provideHover: async (document: vscode.TextDocument, position: vscode.Position) => {
        const { character } = position;
        // 获取当前行内容
        let lineWord = document.lineAt(position).text;
        const { value } = getI18nKey(lineWord, character) || {};

        if (!value) {
            return;
        }
        let tips;
        if (checkLocalsPath()) {
            tips = getTips(value, localsData);
        } else {
            const newLocalsData = await checkHasLocales();
            tips = getTips(value, newLocalsData);
        }

        if (tips) {
            return new vscode.Hover(tips);
        }
    }
}


export default hoverProvider;