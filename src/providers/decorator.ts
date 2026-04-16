import * as vscode from "vscode";
import { getConstantKeys } from "./completionProvider";

const backgroundColorDo = vscode.workspace
  .getConfiguration()
  .get<string>("uniapp-complier-tools.highlightColorDo");

const backgroundColorNotDo = vscode.workspace
  .getConfiguration()
  .get<string>("uniapp-complier-tools.highlightColorNotDo");

const contentIconPath = vscode.Uri.parse(
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKBAMAAAB/HNKOAAAAElBMVEUrmDoslzgrmTkAAAArmjkrmTnx5ZSuAAAABXRSTlOfQN8Av9ciMl0AAAAnSURBVAjXYwgFgiAwGcoQyhTqACQFQhmxksLGhkBSSUk1lEEVpAsAiV4Me28ejM4AAAAASUVORK5CYII=",
);

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

function generateStartRegex(
  refBefore: string,
  refAfter: string,
  target: "ifdef" | "ifndef" | "(ifdef|ifndef)" = "(ifdef|ifndef)",
) {
  const matchItem = getConstantKeys().join("|");

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
    // 查找script和style标签的位置，使用栈来处理嵌套
    const tagPatterns = [
      { open: /<script[^>]*>/gi, close: "</script>", type: "script" as const },
      { open: /<style[^>]*>/gi, close: "</style>", type: "style" as const },
    ];

    const processedRanges: Array<{
      start: number;
      end: number;
      type: "script" | "style";
    }> = [];

    for (const pattern of tagPatterns) {
      let match;

      // 找到所有开始标签
      while ((match = pattern.open.exec(text))) {
        const openTagEnd = match.index + match[0].length;
        let depth = 1;
        let searchPos = openTagEnd;

        // 使用栈来找到正确的闭合标签
        while (depth > 0 && searchPos < text.length) {
          const nextOpen = text.indexOf(`<${pattern.type}`, searchPos);
          const nextClose = text.indexOf(pattern.close, searchPos);

          if (nextClose === -1) {
            // 没有找到闭合标签，跳出
            break;
          }

          if (nextOpen !== -1 && nextOpen < nextClose) {
            // 找到嵌套的开始标签
            depth++;
            searchPos = nextOpen + 1;
          } else {
            // 找到闭合标签
            depth--;
            if (depth === 0) {
              processedRanges.push({
                start: match.index,
                end: nextClose + pattern.close.length,
                type: pattern.type,
              });
            }
            searchPos = nextClose + 1;
          }
        }
      }
    }

    // 按位置排序
    processedRanges.sort((a, b) => a.start - b.start);

    // 创建一个数组来标记哪些区域是script或style
    const scriptStyleRanges = processedRanges.map((range) => ({
      start: range.start,
      end: range.end,
      type: range.type,
    }));

    // 现在处理整个文件，区分不同区域
    let currentIndex = 0;

    // 首先处理根级别的HTML注释（在第一个script/style之前）
    if (scriptStyleRanges.length > 0) {
      const firstRange = scriptStyleRanges[0];
      if (firstRange.start > 0) {
        this.processTextSection(
          text.substring(0, firstRange.start),
          editor,
          0,
          ifdefDecorations,
          ifndefDecorations,
          endifDecorations,
          "html",
        );
        currentIndex = firstRange.start;
      }
    } else {
      // 没有script/style标签，整个文件都是HTML
      this.processTextSection(
        text,
        editor,
        0,
        ifdefDecorations,
        ifndefDecorations,
        endifDecorations,
        "html",
      );
      return;
    }

    // 处理每个script/style区域及其之间的HTML区域
    for (let i = 0; i < scriptStyleRanges.length; i++) {
      const range = scriptStyleRanges[i];

      // 处理script/style区域
      this.processTextSection(
        text.substring(range.start, range.end),
        editor,
        range.start,
        ifdefDecorations,
        ifndefDecorations,
        endifDecorations,
        range.type,
      );

      // 处理当前区域和下一个区域之间的HTML区域
      const nextRange = scriptStyleRanges[i + 1];
      if (nextRange) {
        if (range.end < nextRange.start) {
          this.processTextSection(
            text.substring(range.end, nextRange.start),
            editor,
            range.end,
            ifdefDecorations,
            ifndefDecorations,
            endifDecorations,
            "html",
          );
        }
      } else {
        // 处理最后一个区域之后的HTML区域
        if (range.end < text.length) {
          this.processTextSection(
            text.substring(range.end),
            editor,
            range.end,
            ifdefDecorations,
            ifndefDecorations,
            endifDecorations,
            "html",
          );
        }
      }
    }
  }

  // 处理文本区域的辅助方法
  private processTextSection(
    sectionText: string,
    editor: vscode.TextEditor,
    globalOffset: number,
    ifdefDecorations: vscode.DecorationOptions[],
    ifndefDecorations: vscode.DecorationOptions[],
    endifDecorations: vscode.DecorationOptions[],
    sectionType: "script" | "style" | "html",
  ) {
    let regexes;

    if (sectionType === "script") {
      // 脚本部分：使用行注释
      regexes = getCommentRegex(false);
    } else if (sectionType === "style") {
      // 样式部分：使用块注释
      regexes = getCommentRegex(true);
    } else {
      // HTML部分：使用HTML注释
      regexes = getCommentRegex(false, true);
    }

    // 在当前部分内搜索条件编译标签
    let localMatch;

    // 匹配 #ifdef
    while ((localMatch = regexes.ifdef.exec(sectionText))) {
      const globalStart = globalOffset + localMatch.index;
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
        const globalStart = globalOffset + localMatch.index;
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
        const globalStart = globalOffset + localMatch.index;
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
