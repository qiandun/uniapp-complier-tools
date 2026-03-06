import * as vscode from "vscode";

// 定义支持的平台常量
export const PLATFORM_CONSTANTS = [
  "VUE3-VAPOR", // 用于区分是否是 vue3 蒸汽模式，HBuilderX 5.0+
  "VUE3", // uni-app js 引擎版用于区分 vue2 和 3，HBuilderX 3.2.0+
  "VUE2", // uni-app js 引擎版用于区分 vue2 和 3，
  "UNI-APP-X", // 用于区分是否是 uni-app x 项目 HBuilderX 3.9.0+
  "APP-PLUS-NVUE", // App nvue 页面，等同于 APP-NVUE
  "APP-PLUS", // uni-app js 引擎版编译为 App 时
  "APP-NVUE", // App nvue 页面，等同于 APP-PLUS-NVUE
  "APP-ANDROID", // App Android 平台
  "APP-IOS", // App iOS 平台
  "APP-HARMONY", // App HarmonyOS Next 平台
  "APP", // App
  "H5", // H5（推荐使用 WEB）
  "WEB", // web（同H5），HBuilderX 3.6.3+
  "MP-WEIXIN", // 微信小程序
  "MP-ALIPAY", // 支付宝小程序
  "MP-BAIDU", // 百度小程序
  "MP-TOUTIAO", // 抖音小程序
  "MP-LARK", // 飞书小程序
  "MP-QQ", // QQ 小程序
  "MP-KUAISHOU", // 快手小程序
  "MP-JD", // 京东小程序
  "MP-360", // 360 小程序
  "MP-HARMONY", // 鸿蒙元服务，HBuilderX 4.34+
  "MP-XHS", // 小红书小程序
  "MP", // 微信小程序/支付宝小程序/百度小程序/抖音小程序/飞书小程序/QQ 小程序/360 小程序/鸿蒙元服务/小红书小程序/京东小程序/快手小程序
  "QUICKAPP-WEBVIEW-UNION", // 快应用联盟
  "QUICKAPP-WEBVIEW-HUAWEI", // 快应用华为
  "QUICKAPP-WEBVIEW", // 快应用通用(包含联盟、华为)
];

// 定义特殊常量
const SPECIAL_CONSTANTS = <string[]>[
  // "development", // 开发模式
  // "production", // 生产模式
];

// 合并所有常量
const ALL_CONSTANTS = [...PLATFORM_CONSTANTS, ...SPECIAL_CONSTANTS];

export class UniAppCompletionItemProvider
  implements vscode.CompletionItemProvider
{
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
    const ifdefMatch = lineContent.match(
      /^\s*(\/\/|\/\*|\<\!\-\-)(\s*#ifdef\s+|\s*#ifndef\s+)([A-Z0-9_:*\s|&!()-]*)$/,
    );

    if (!ifdefMatch) {
      if (lineContent.match(/^\s*(\/\/|\/\*|\<\!\-\-)\s*\s+$/)) {
        return this._getPreprocessorCompletions();
      }
      return [];
    }
    // 创建补全项
    return this._getPlatformCompletions();
  }

  private _getPlatformCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    ALL_CONSTANTS.forEach((platform) => {
      const item = new vscode.CompletionItem(
        platform,
        vscode.CompletionItemKind.Constant,
      );
      item.insertText = platform;
      item.detail = `UniApp 平台: ${platform}`;
      item.documentation = this._getPlatformDescription(platform);
      completions.push(item);
    });

    return completions;
  }

  private _getPlatformDescription(platform: string): string {
    const descriptions: { [key: string]: string } = {
      VUE3: "uni-app Vue3 版本",
      "VUE3-VAPOR": "uni-app Vue3 蒸汽模式",
      VUE2: "uni-app Vue2 版本",
      "UNI-APP-X": "uni-app x 项目",
      APP: "App 平台",
      "APP-PLUS": "uni-app js 引擎版 App",
      "APP-ANDROID": "App Android 平台",
      "APP-IOS": "App iOS 平台",
      "APP-HARMONY": "App HarmonyOS Next 平台",
      H5: "H5 平台",
      WEB: "Web 平台",
      "MP-WEIXIN": "微信小程序",
      "MP-ALIPAY": "支付宝小程序",
      "MP-BAIDU": "百度小程序",
      "MP-TOUTIAO": "抖音小程序",
      "MP-LARK": "飞书小程序",
      "MP-QQ": "QQ 小程序",
      "MP-KUAISHOU": "快手小程序",
      "MP-JD": "京东小程序",
      "MP-360": "360 小程序",
      "MP-HARMONY": "鸿蒙元服务",
      "MP-XHS": "小红书小程序",
      MP: "所有小程序平台",
      "QUICKAPP-WEBVIEW": "快应用通用",
      "QUICKAPP-WEBVIEW-UNION": "快应用联盟",
      "QUICKAPP-WEBVIEW-HUAWEI": "快应用华为",
    };

    return descriptions[platform] || `UniApp 平台标识: ${platform}`;
  }

  private _getPreprocessorCompletions(): vscode.CompletionItem[] {
    const completions: vscode.CompletionItem[] = [];

    // #ifdef
    const ifdefItem = new vscode.CompletionItem(
      "#ifdef",
      vscode.CompletionItemKind.Keyword,
    );
    ifdefItem.insertText = "#ifdef";
    ifdefItem.detail = "仅在指定平台存在";
    ifdefItem.documentation = "条件编译：仅在指定平台编译此代码块";
    completions.push(ifdefItem);

    // #ifndef
    const ifndefItem = new vscode.CompletionItem(
      "#ifndef",
      vscode.CompletionItemKind.Keyword,
    );
    ifndefItem.insertText = "#ifndef";
    ifndefItem.detail = "除了指定平台都存在";
    ifndefItem.documentation = "条件编译：除了指定平台，其他平台都编译此代码块";
    completions.push(ifndefItem);

    // #endif
    const endifItem = new vscode.CompletionItem(
      "#endif",
      vscode.CompletionItemKind.Keyword,
    );
    endifItem.insertText = "#endif";
    endifItem.detail = "条件编译结束";
    endifItem.documentation = "结束条件编译块";
    completions.push(endifItem);

    return completions;
  }
}
