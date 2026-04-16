import path from "path";
import fs from "fs";
import * as vscode from "vscode";

// 定义支持的平台常量
export const platformConstants = {
  "VUE3-VAPOR": "用于区分是否是 vue3 蒸汽模式，HBuilderX 5.0+",
  VUE3: "uni-app js 引擎版用于区分 vue2 和 3，HBuilderX 3.2.0+",
  VUE2: "uni-app js 引擎版用于区分 vue2 和 3，",
  "UNI-APP-X": "用于区分是否是 uni-app x 项目 HBuilderX 3.9.0+",
  uniVersion: "用于区分编译器的版本	HBuilderX 3.9.0+",
  "APP-PLUS-NVUE": "App nvue 页面，等同于 APP-NVUE",
  "APP-PLUS": "uni-app js 引擎版编译为 App 时",
  "APP-NVUE": "App nvue 页面，等同于 APP-PLUS-NVUE",
  "APP-ANDROID": "App Android 平台",
  "APP-IOS": "App iOS 平台",
  "APP-HARMONY": "App HarmonyOS Next 平台",
  APP: "App",
  H5: "H5（推荐使用 WEB）",
  WEB: "web（同H5），HBuilderX 3.6.3+",
  "MP-WEIXIN": "微信小程序",
  "MP-ALIPAY": "支付宝小程序",
  "MP-BAIDU": "百度小程序",
  "MP-TOUTIAO": "抖音小程序",
  "MP-LARK": "飞书小程序",
  "MP-QQ": "QQ 小程序",
  "MP-KUAISHOU": "快手小程序",
  "MP-JD": "京东小程序",
  "MP-360": "360 小程序",
  "MP-HARMONY": "鸿蒙元服务，HBuilderX 4.34+",
  "MP-XHS": "小红书小程序",
  MP: "微信小程序/支付宝小程序/百度小程序/抖音小程序/飞书小程序/QQ 小程序/360 小程序/鸿蒙元服务/小红书小程序/京东小程序/快手小程序",
  "QUICKAPP-WEBVIEW-UNION": "快应用联盟",
  "QUICKAPP-WEBVIEW-HUAWEI": "快应用华为",
  "QUICKAPP-WEBVIEW": "快应用通用(包含联盟、华为)",
};

/**
 * 从项目的 package.json 中读取用户自定义的平台常量，并合并到平台常量列表中
 */
let platformConstantsCustom = {};

/**
 * 合并内置平台常量和用户自定义平台常量，生成最终的常量列表供补全使用
 */
let platformConstantsAll = { ...platformConstants, ...platformConstantsCustom };

// 合并所有常量
let allConstantKeys = Object.keys(platformConstantsAll).sort(
    (a, b) => b.length - a.length,
  );

export const getConstantKeys = () => allConstantKeys;

const fillCustomConstants = () => {
  const constantsTemp: typeof platformConstantsCustom & {
    [key: string]: string;
  } = {};
  const workspaceFolders = vscode.workspace.workspaceFolders;
  for (const folder of workspaceFolders!) {
    const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );
        if (packageJson?.["uni-app"]?.scripts) {
          console.log(
            "发现用户自定义平台常量，正在加载...",
            packageJson["uni-app"].scripts,
          );
          for (const key of Object.keys(packageJson["uni-app"].scripts)) {
            const scriptDef = packageJson["uni-app"].scripts[key];
            const uniPlatforms = scriptDef?.define;
            if (uniPlatforms) {
              for (const platform in uniPlatforms) {
                constantsTemp[platform] =
                  `自定义平台: ${scriptDef?.title || platform}`;
              }
            }
          }
        }
      } catch (error) {
        console.error("解析 package.json 失败：", error);
      }
    }
  }
  platformConstantsCustom = constantsTemp;
  platformConstantsAll = { ...platformConstants, ...platformConstantsCustom };

  allConstantKeys = Object.keys(platformConstantsAll).sort(
    (a, b) => b.length - a.length,
  );
  console.log("已加载平台常量：", allConstantKeys);
};
fillCustomConstants();

export class UniAppCompletionItemProvider
  implements vscode.CompletionItemProvider
{
  constructor(private context: vscode.ExtensionContext) {
    const disposable = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (event.document.fileName.endsWith("package.json")) {
          fillCustomConstants();
        }
      },
      null,
      context.subscriptions,
    );
    context.subscriptions.push(disposable);
  }
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    // 获取当前行
    const lineText = document.lineAt(position.line).text;
    // 获取当前行内容
    const lineContent = lineText.substring(0, position.character);

    // 检查是否在条件编译标签后面
    const ifdefMatchPlatform = lineContent.match(
      /^\s*(\/\/|\/\*|\<\!\-\-)(\s*#ifdef\s+|\s*#ifndef\s+)([A-Z0-9_:*\s|&!()-]*)$/,
    );

    if (!ifdefMatchPlatform) {
      const ifdefMatch = lineContent.match(/^\s*(\/\/|\/\*|\<\!\-\-)(\s*)$/);
      if (ifdefMatch) {
        return this._getPreprocessorCompletions().map((item) => {
          const startPos = position.translate(0, -ifdefMatch[2].length);
          const replaceRange = new vscode.Range(startPos, position);
          item.range = replaceRange;

          return item;
        });
      }
      return [];
    }
    if (!/(\|\||&&|ifdef|ifndef)$/.test(ifdefMatchPlatform[0].trim())) {
      return [];
    }
    const whitespaceEndLength = lineContent.match(/\s+$/)?.[0].length || 0;
    // 创建补全项
    return this._getPlatformCompletions().map((item) => {
      if (whitespaceEndLength) {
        const startPos = position.translate(0, -whitespaceEndLength);
        const replaceRange = new vscode.Range(startPos, position);
        item.range = replaceRange;
      }

      return item;
    });
  }

  private _getPlatformCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    allConstantKeys.forEach((platform) => {
      const item = new vscode.CompletionItem(
        platform,
        vscode.CompletionItemKind.Constant,
      );
      item.insertText = ` ${platform}`;
      item.detail = this._getPlatformDescription(platform);
      completions.push(item);
    });

    return completions;
  }

  private _getPlatformDescription(platform: string): string {
    return (
      platformConstantsAll[platform as keyof typeof platformConstantsAll] ||
      `UniApp平台:${platform}`
    );
  }

  private _getPreprocessorCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // #ifdef
    const ifdefItem = new vscode.CompletionItem(
      "#ifdef",
      vscode.CompletionItemKind.Keyword,
    );
    ifdefItem.insertText = " #ifdef";
    ifdefItem.detail = "仅在指定平台存在";
    ifdefItem.documentation = "条件编译：仅在指定平台编译此代码块";
    completions.push(ifdefItem);

    // #ifndef
    const ifndefItem = new vscode.CompletionItem(
      "#ifndef",
      vscode.CompletionItemKind.Keyword,
    );
    ifndefItem.insertText = " #ifndef";
    ifndefItem.detail = "除了指定平台都存在";
    ifndefItem.documentation = "条件编译：除了指定平台，其他平台都编译此代码块";
    completions.push(ifndefItem);

    // #endif
    const endifItem = new vscode.CompletionItem(
      "#endif",
      vscode.CompletionItemKind.Keyword,
    );
    endifItem.insertText = " #endif";
    endifItem.detail = "条件编译结束";
    endifItem.documentation = "结束条件编译块";
    completions.push(endifItem);

    return completions;
  }
}
