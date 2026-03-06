import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { UniAppCompletionItemProvider } from "./providers/completionProvider";
import { ColorDecorator } from "./providers/decorator";
import { console } from "inspector";

// 定义支持的文档选择器，添加对uni-app相关文件类型的支持
const baseSelector = [
  { scheme: "file", language: "vue" }, // .vue文件
  { scheme: "file", language: "javascript" }, // .js文件
  { scheme: "file", language: "typescript" }, // .ts文件
  { scheme: "file", language: "html" }, // HTML-like files
  { scheme: "file", language: "vue-html" }, // Vue template sections
  { scheme: "file", language: "css" }, // .css文件
  { scheme: "file", language: "scss" }, // .scss文件
  { scheme: "file", language: "less" }, // .less文件
  { scheme: "file", language: "stylus" }, // .stylus文件
  { scheme: "file", language: "pug" }, // .pug文件
  { scheme: "file", language: "json" }, // pages.json文件
];

// 为特殊扩展名添加文件模式选择器
const filePatternSelector = [
  { pattern: "**/*.nvue" },
  { pattern: "**/*.uvue" },
  { pattern: "**/*.uts" },
];

// 合并选择器
const combinedSelector = [...baseSelector, ...filePatternSelector];

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  console.log("UniApp Extension action checking");
  let isUniappProject = false;
  for (const folder of workspaceFolders) {
    const packageJsonPath = path.join(folder.uri.fsPath, "manifest.json");
    if (fs.existsSync(packageJsonPath)) {
      isUniappProject = true;
      break;
    }
  }
  if (!isUniappProject) {
    console.log("UniApp Extension action stop: no UniApp project");
    return;
  }
  console.log("UniApp Extension action start");
  const completionProvider = new UniAppCompletionItemProvider();
  const provider = vscode.languages.registerCompletionItemProvider(
    combinedSelector,
    completionProvider,
    // 触发字符
    ..."!(|& \t".split(""),
  );
  context.subscriptions.push(provider);

  const decorator = new ColorDecorator();

  // 初始化装饰
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    decorator.updateDecorations(activeEditor);
  }

  // 监听编辑器变化
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        activeEditor = editor;
        decorator.updateDecorations(activeEditor);
      }
    },
    null,
    context.subscriptions,
  );

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        decorator.updateDecorations(activeEditor);
      }
    },
    null,
    context.subscriptions,
  );
}

export function deactivate() {}
