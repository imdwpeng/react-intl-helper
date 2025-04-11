import * as vscode from 'vscode';
import { getI18nKey, localsData, getWordLocation } from '../utils';
import config from '../utils/config';

const { } = config;

const definitionProvider = {
    provideDefinition: async (document: vscode.TextDocument, position: vscode.Position) => {
        const { character } = position;
        // 获取当前行内容
        let lineWord = document.lineAt(position).text;
        const {value} = getI18nKey(lineWord, character);

        if (!value) {
            return;
        }

        const location = await getWordLocation(value);

        return location;
    }
}

export default definitionProvider;