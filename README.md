# UniApp 条件编译插件

这个 VS Code 插件为 UniApp 开发者提供条件编译支持，帮助开发者更高效地处理多端差异。

> 项目识别，通过识别项目根目录 `/` 或者 `/src `是否存在文件 `manifest.json`
>
> 自动提取 `package.json` 自定义平台
>
> 注意：读取文件仅用只读的方式，只做识别，具体可以查看源码

![](https://origin.picgo.net/2026/03/06/example59633676d6d100d0.png)

## 功能特性

### 1. 一级自动填充

在注释中输入空格，自动弹出 `#ifdef`、`#ifndef`、`#endif` 选择。

### 2. 二级自动填充

在一级自动填充完成后（如 `#ifdef`），输入空格后会弹出所有 UniApp 平台标识供选择。

### 3. 语法高亮

- 条件编译关键字（`#ifdef`、`#ifndef`、`#endif`）高亮
- 支持自定义高亮颜色

## 支持的文件类型

- JavaScript (.js)
- TypeScript (.ts)
- Vue (.vue)
- CSS (.css)
- SCSS (.scss)
- Less (.less)
- Stylus (.stylus)
- JSON (.json)
- HTML (.html)

## 支持的平台标识

### 框架版本

- `VUE3` - uni-app Vue3 版本
- `VUE3-VAPOR` - uni-app Vue3 蒸汽模式
- `VUE2` - uni-app Vue2 版本
- `UNI-APP-X` - uni-app x 项目

### App 平台

- `APP` - App 平台
- `APP-PLUS` - uni-app js 引擎版 App
- `APP-ANDROID` - App Android 平台
- `APP-IOS` - App iOS 平台
- `APP-HARMONY` - App HarmonyOS Next 平台

### Web 平台

- `H5` - H5 平台
- `WEB` - Web 平台

### 小程序平台

- `MP-WEIXIN` - 微信小程序
- `MP-ALIPAY` - 支付宝小程序
- `MP-BAIDU` - 百度小程序
- `MP-TOUTIAO` - 抖音小程序
- `MP-LARK` - 飞书小程序
- `MP-QQ` - QQ 小程序
- `MP-KUAISHOU` - 快手小程序
- `MP-JD` - 京东小程序
- `MP-360` - 360 小程序
- `MP-HARMONY` - 鸿蒙元服务
- `MP-XHS` - 小红书小程序
- `MP` - 所有小程序平台

### 快应用平台

- `QUICKAPP-WEBVIEW` - 快应用通用
- `QUICKAPP-WEBVIEW-UNION` - 快应用联盟
- `QUICKAPP-WEBVIEW-HUAWEI` - 快应用华为

## 使用示例

### JavaScript/TypeScript

```javascript
// #ifdef MP-WEIXIN
import wxApi from './wx-api';
// #endif

// #ifndef H5
import nativeApi from './native-api';
// #endif

// #ifdef APP || MP-WEIXIN
const platformSpecificCode = 'app or weixin';
// #endif
```

### Vue 模板

```html
<template>
  <view>
    <!-- #ifdef MP-WEIXIN -->
    <official-account></official-account>
    <!-- #endif -->
  
    <!-- #ifndef H5 -->
    <view>Native only component</view>
    <!-- #endif -->
  </view>
</template>
```

### CSS

```css
/* #ifdef H5 */
.page {
  background-color: #f0f0f0;
}
/* #endif */

/* #ifndef MP-WEIXIN */
.container {
  padding: 20px;
}
/* #endif */
```

## 配置选项

- `uniapp-complier-tools.highlightColorDo`: 条件编译标识 ifdef（默认: `rgba(74, 141, 218, 0.1)`）
- `uniapp-complier-tools.highlightColorNotDo`: 条件编译标识 ifndef 的高亮颜色（默认: `rgba(74, 141, 218, 0.1)`）

## 注意事项

1. 条件编译必须使用正确的注释格式：

   - JavaScript/TypeScript: `// #ifdef ...`
   - CSS/SCSS/Less/Stylus: `/* #ifdef ... */`
   - Vue/HTML: `<!-- #ifdef ... -->`
   - JSON: `// #ifdef ...` (需要确保JSON语法正确)
2. 确保条件编译块的语法正确，无论条件是否生效都应该能通过语法校验。

## 参考文档

- [UniApp 官方条件编译文档](https://uniapp.dcloud.net.cn/tutorial/platform.html)

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个插件！

作者 vscode 还制作了“护眼主题”欢迎来试试，拓展点击搜索输入 “护眼主题”或者 “eye-screen”！
