import * as vscode from 'vscode';
import { checkHasLocales } from './utils';
import config from './utils/config'
import hoverProvider from './provider/hoverProvider';
import definitionProvider from './provider/definitionProvider';

const { configPath, suffix } = config;

let registerHoverProvider: vscode.Disposable;
let registerDefinitionProvider: vscode.Disposable;

export const activate = async (context: vscode.ExtensionContext) => {
  const result = await checkHasLocales();

  // 如果没有查询到国际化配置语言，不进行后面的注册事件
  if (!result) {
    return;
  }

  // 注册Hover后的提示事件
  registerHoverProvider = vscode.languages.registerHoverProvider(['javascript', 'javascriptreact', 'typescript', 'typescriptreact'], hoverProvider);

  // 监听国际化配置文件变化
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(`**/${configPath}/**/*${suffix}`);
  fileSystemWatcher.onDidChange(async () => {
    await checkHasLocales();
  });

  // 注册点击跳转事件
  registerDefinitionProvider = vscode.languages.registerDefinitionProvider(['javascript', 'javascriptreact', 'typescript', 'typescriptreact'], definitionProvider);
}

export const deactivate = () => {
  registerHoverProvider?.dispose();
  // registerDefinitionProvider?.dispose();
}