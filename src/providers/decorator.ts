import * as vscode from "vscode";
import { PLATFORM_CONSTANTS } from "./completionProvider";

const backgroundColorDo = vscode.workspace
  .getConfiguration()
  .get<string>("uniapp-complier-tools.highlightColorDo");

const backgroundColorNotDo = vscode.workspace
  .getConfiguration()
  .get<string>("uniapp-complier-tools.highlightColorNotDo");

const contentIconPath = vscode.Uri.parse('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAElBMVEUrmDoslzgrmTkAAAArmjkrmTnx5ZSuAAAABXRSTlOfQN8Av9ciMl0AAAAnSURBVAjXYwgFgiAwGcoQyhTqACQFQhmxksLGhkBSSUk1lEEVpAsAiV4Me28ejM4AAAAASUVORK5CYII=');

const boforeIcon: vscode.ThemableDecorationAttachmentRenderOptions = {
  contentIconPath,
  margin: "0 5px 0 0",
  textDecoration: "underline",
};

// 创建装饰器类型
const ifdefDecorator = vscode.window.createTextEditorDecorationType({
  backgroundColor: backgroundColorDo,
  before: boforeIcon,
  borderRadius: "3px",
});

const ifndefDecorator = vscode.window.createTextEditorDecorationType({
  backgroundColor: backgroundColorNotDo,
  before: boforeIcon,
  borderRadius: "3px",
});

const endifDecorator = vscode.window.createTextEditorDecorationType({
  backgroundColor: backgroundColorDo,
  before: boforeIcon,
  borderRadius: "3px",
});

const matchItem = PLATFORM_CONSTANTS.join("|");

function generateStartRegex(
  refBefore: string,
  refAfter: string,
  target: "ifdef" | "ifndef" | "(ifdef|ifndef)" = "(ifdef|ifndef)",
) {
  return new RegExp(
    [
      refBefore,
      `#${target}`,
      `\\s+(\\(|\\))*((!?(${matchItem}))|(uniVersion\\s*(<|>|==|<=|>=)\\s*(\\d\\.?)+))(\\(|\\))*`,
      `(\\s*(\\|\\||&&)\\s*(\\(|\\))*((!?(${matchItem}))|(uniVersion\\s*(<|>|==|<=|>=)\\s*(\\d\\.?)+))(\\(|\\))*)*`,
      refAfter,
    ].join(""),
    "g",
  );
}
function generateEndRegex(refBefore: string, refAfter: string) {
  return new RegExp(`${refBefore}#endif${refAfter}`, "g");
}
// 根据文件类型确定正确的注释语法
function getCommentRegex(
  isBlockComment: boolean,
  isHtmlComment: boolean = false,
) {
  if (isHtmlComment) {
    // HTML注释: <!-- #ifdef ... --> (使用更精确的空白匹配)
    return {
      ifdef: generateStartRegex("<\!--\\s+", "\\s+-->", "ifdef"),
      ifndef: generateStartRegex("<\!--\\s+", "\\s+-->", "ifndef"),
      endif: generateEndRegex("<\!--\\s+", "\\s+-->"),
    };
  } else if (isBlockComment) {
    // 块注释: /* #ifdef ... */ (使用更精确的空白匹配)
    return {
      ifdef: generateStartRegex("\/\\*\\s+", "\\s+\\*\/", "ifdef"),
      ifndef: generateStartRegex("\/\\*\\s+", "\\s+\\*\/", "ifndef"),
      endif: generateEndRegex("\/\\*\\s+", "\\s+\\*\/"),
    };
  } else {
    // 行注释: // #ifdef ... (严格匹配单行，确保行尾)
    return {
      ifdef: generateStartRegex("\/\/\\s+", "", "ifdef"),
      ifndef: generateStartRegex("\/\/\\s+", "", "ifndef"),
      endif: generateEndRegex("\/\/\\s+", ""),
    };
  }
}

export class ColorDecorator {
  // 更新装饰的函数
  updateDecorations(editor: vscode.TextEditor) {
    if (!editor) {
      return;
    }

    const text = editor.document.getText();
    const fileName = editor.document.fileName.toLowerCase();

    // 判断文件类型
    const isStyleFile = [
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".styl",
      ".stylus",
    ].some((ext) => fileName.endsWith(ext));
    const isScriptFile = [".js", ".ts", ".uts"].some((ext) =>
      fileName.endsWith(ext),
    );
    const isJsonFile = fileName.endsWith(".json");
    const isVueFile = [".vue", ".nvue", ".uvue"].some((ext) =>
      fileName.endsWith(ext),
    );

    // 创建装饰选项数组
    const ifdefDecorations: vscode.DecorationOptions[] = [];
    const ifndefDecorations: vscode.DecorationOptions[] = [];
    const endifDecorations: vscode.DecorationOptions[] = [];

    if (isVueFile) {
      // 对于Vue文件，需要分别处理template、script、style三个部分
      this.processVueFile(
        text,
        editor,
        ifdefDecorations,
        ifndefDecorations,
        endifDecorations,
      );
    } else {
      // 其他文件类型
      let regexes;
      if (isStyleFile) {
        // 样式文件使用块注释
        regexes = getCommentRegex(true);
      } else if (isScriptFile || isJsonFile) {
        // 脚本文件和JSON文件使用行注释
        regexes = getCommentRegex(false);
      } else {
        // 其他文件默认使用行注释
        regexes = getCommentRegex(false);
      }

      // 匹配并添加装饰
      let match;

      // 匹配 #ifdef
      while ((match = regexes.ifdef.exec(text))) {
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(
          match.index + match[0].length,
        );
        ifdefDecorations.push({
          range: new vscode.Range(startPos, endPos),
          hoverMessage: "条件编译标签: 指定常量编译",
        });
      }

      // 匹配 #ifndef
      if (regexes.ifndef && regexes.ifndef instanceof RegExp) {
        regexes.ifndef.lastIndex = 0; // 重置正则表达式索引
        while ((match = regexes.ifndef.exec(text))) {
          const startPos = editor.document.positionAt(match.index);
          const endPos = editor.document.positionAt(
            match.index + match[0].length,
          );
          ifndefDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: "条件编译标签: 指定常量不编译",
          });
        }
      }

      // 匹配 #endif
      if (regexes.endif && regexes.endif instanceof RegExp) {
        regexes.endif.lastIndex = 0; // 重置正则表达式索引
        while ((match = regexes.endif.exec(text))) {
          const startPos = editor.document.positionAt(match.index);
          const endPos = editor.document.positionAt(
            match.index + match[0].length,
          );
          endifDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: "条件编译标签: 结束条件编译块",
          });
        }
      }
    }

    // 应用装饰
    editor.setDecorations(ifdefDecorator, ifdefDecorations);
    editor.setDecorations(ifndefDecorator, ifndefDecorations);
    editor.setDecorations(endifDecorator, [...endifDecorations]);
  }

  // 处理Vue文件的特殊逻辑
  processVueFile(
    text: string,
    editor: vscode.TextEditor,
    ifdefDecorations: vscode.DecorationOptions[],
    ifndefDecorations: vscode.DecorationOptions[],
    endifDecorations: vscode.DecorationOptions[],
  ) {
    // 查找script标签的位置
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const templateRegex = /<template[^>]*>([\s\S]*?)<\/template>/gi;

    let match;
    const processedRanges: Array<{
      start: number;
      end: number;
      type: "script" | "style" | "template";
    }> = [];

    // 找到所有script部分
    while ((match = scriptRegex.exec(text))) {
      processedRanges.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "script",
      });
    }

    // 找到所有style部分
    while ((match = styleRegex.exec(text))) {
      processedRanges.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "style",
      });
    }

    // 找到所有template部分
    while ((match = templateRegex.exec(text))) {
      processedRanges.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "template",
      });
    }

    // 按位置排序
    processedRanges.sort((a, b) => a.start - b.start);

    // 处理每个部分
    for (const range of processedRanges) {
      const sectionText = text.substring(range.start, range.end);
      const sectionType = range.type;

      let regexes;
      if (sectionType === "template") {
        // 模板部分：同时支持HTML注释和块注释
        const htmlRegexes = getCommentRegex(false, true);
        const blockRegexes = getCommentRegex(true);
        regexes = {
          ifdef: new RegExp(
            `(${htmlRegexes.ifdef.source}|${blockRegexes.ifdef.source})`,
            "g",
          ),
          ifndef: new RegExp(
            `(${htmlRegexes.ifndef.source}|${blockRegexes.ifndef.source})`,
            "g",
          ),
          endif: new RegExp(
            `(${htmlRegexes.endif.source}|${blockRegexes.endif.source})`,
            "g",
          ),
        };
      } else if (sectionType === "style") {
        // 样式部分：使用块注释
        regexes = getCommentRegex(true);
      } else if (sectionType === "script") {
        // 脚本部分：使用行注释
        regexes = getCommentRegex(false);
      } else {
        // 默认使用行注释
        regexes = getCommentRegex(false);
      }

      // 在当前部分内搜索条件编译标签
      let localMatch;

      // 匹配 #ifdef
      while ((localMatch = regexes.ifdef.exec(sectionText))) {
        const globalStart = range.start + localMatch.index;
        const globalEnd = globalStart + localMatch[0].length;
        const startPos = editor.document.positionAt(globalStart);
        const endPos = editor.document.positionAt(globalEnd);
        ifdefDecorations.push({
          range: new vscode.Range(startPos, endPos),
          hoverMessage: "条件编译标签: 指定常量编译",
        });
      }

      // 匹配 #ifndef
      if (regexes.ifndef && regexes.ifndef instanceof RegExp) {
        regexes.ifndef.lastIndex = 0; // 重置正则表达式索引
        while ((localMatch = regexes.ifndef.exec(sectionText))) {
          const globalStart = range.start + localMatch.index;
          const globalEnd = globalStart + localMatch[0].length;
          const startPos = editor.document.positionAt(globalStart);
          const endPos = editor.document.positionAt(globalEnd);
          ifndefDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: "条件编译标签: 指定常量不编译",
          });
        }
      }

      // 匹配 #endif
      if (regexes.endif && regexes.endif instanceof RegExp) {
        regexes.endif.lastIndex = 0; // 重置正则表达式索引
        while ((localMatch = regexes.endif.exec(sectionText))) {
          const globalStart = range.start + localMatch.index;
          const globalEnd = globalStart + localMatch[0].length;
          const startPos = editor.document.positionAt(globalStart);
          const endPos = editor.document.positionAt(globalEnd);
          endifDecorations.push({
            range: new vscode.Range(startPos, endPos),
            hoverMessage: "条件编译标签: 结束条件编译块",
          });
        }
      }
    }
  }
}
