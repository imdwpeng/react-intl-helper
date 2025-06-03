import * as vscode from "vscode";
import config from "./config";

const { fs } = vscode.workspace;
const { suffix,  getRelativeConfigPath } = config;

let localsData: { [x: string]: any } = {};
let tempLocalesPath: string;

// 获取文件内容
const getContent = async (localesPath: string, directory: any) => {
  if (!directory.length) {
    return;
  }
  const result: { [x: string]: any } = {};
  for (let i = 0; i < directory.length; i++) {
    try {
      const ele = directory[i][0];
      const elePath = `${localesPath}/${ele}`;
      const content = await fs.readFile(vscode.Uri.file(elePath));
      const fileName = ele.split(".")[0];
      const contentStr = content.toString();

      const contentReg = /(['"]?[\w-.]+['"]?:\s?['"].*?['"])/g;
      const valueReg = /^\s{0,}['"](.*?)['"]/;
      // 匹配国际化配置根文件下的配置内容
      const contentArr = contentStr.match(contentReg);
      let obj: { [x: string]: any } = {};
      contentArr?.forEach((item) => {
        const itemArr = item.split(":");
        obj[itemArr[0].replace(/['"]/g, "")] = {
          value: itemArr[1].replace(valueReg, "$1"),
          path: elePath,
        };
      });
      result[fileName] = obj;
    } catch (error) {
      console.error("getContent error: ", error);
    }
  }
  return result;
};

const checkLocalsPath = () => {
  const newLocalesPath = getRelativeConfigPath();
  console.log('newLocalesPath',newLocalesPath,tempLocalesPath)
  return newLocalesPath === tempLocalesPath;
}

// 检查是否包含国际化配置
const checkHasLocales = async () => {
  const { workspaceFolders, fs } = vscode.workspace;
  if (!workspaceFolders?.length) {
    return;
  }
  console.log("init react-intl-helper");
  let result: any;
  for (let i = 0; i < workspaceFolders?.length; i++) {
    const localesPath = `${workspaceFolders[i].uri.fsPath}/${getRelativeConfigPath()}`;
    tempLocalesPath = getRelativeConfigPath();
    console.log("localesPath: ", localesPath);
    let directory = await fs.readDirectory(vscode.Uri.file(localesPath));

    if (!directory) {
      return;
    }
    directory = directory.filter((item) => item[0].endsWith(suffix));
    result = await getContent(localesPath, directory);
  }

  if (result) {
    localsData = result;
  }

  return result;
};

// 获取国际化key值
const getI18nKey = (str: string, character: number) => {
  const result: any[] = [];
  // 匹配以下格式
  // - formatMessage('asd')
  // - formatMessage("asd")
  // - formatMessage({id:'asd'})
  // - formatMessage({id:"asd"})
  // - formatMessage({id: 'asd'})
  // - formatMessage({id: "asd"})
  const reg =
    /formatMessage\(\s*(?:'([^']+)'|"([^"]+)"|\{(?:\s*id\s*:\s*)?(?:'([^']+)'|"([^"]+)")\s*\}\s*)\)/g;

  str.replace(reg, ($0, p1, p2, p3, p4, offset) => {
    // 提取匹配到的值（可能是第1、2、3或4个捕获组）
    const value = p1 || p2 || p3 || p4;
    if (value) {
      result.push({
        value: value,
        startIndex: offset + $0.indexOf(value),
        endIndex: offset + $0.indexOf(value) + value.length - 1,
      });
    }
    return "";
  });

  if (!result.length) {
    return;
  }

  // 鼠标hover到对应翻译key上才显示翻译值
  const newResult = result.filter(({ startIndex, endIndex }) => {
    return character >= startIndex && character <= endIndex;
  });

  if (newResult.length) {
    return newResult[0];
  }

  return undefined;
};

// 获取国际化翻译
const getTips = (key: string, dictionary: { [x: string]: any }) => {
  const markdownString = new vscode.MarkdownString();
  let str = "";

  Object.keys(dictionary).forEach((languageType) => {
    if (dictionary[languageType][key]) {
      str += `${languageType} : ${dictionary[languageType][key].value}\n\n`;
    }
  });

  markdownString.appendMarkdown(str);
  return markdownString;
};

// Uint8Array转字符串
const uint8ArrayToString = (array: Uint8Array) => {
  var out, i, len, c;
  var char2, char3;
  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }
  return out;
};

// 查看当前匹配内容位置
const wordLocation = async (key: string, filePath: vscode.Uri) => {
  const result = {
    filePath: "",
    lineIndex: 0,
    wordIndex: 0,
  };

  try {
    const content = await fs.readFile(filePath);
    const contentArr = uint8ArrayToString(content).split("\n");
    for (let i = 0; i < contentArr.length; i++) {
      const element = contentArr[i];
      const regMatch = element.match(new RegExp(`${key}['"]?\\s*:\\s*['"]?`));
      if (regMatch) {
        result.lineIndex = i;
        result.wordIndex = regMatch[0].length + (regMatch.index || 0);
        result.filePath = filePath.path;
        break;
      }
    }
  } catch (error) {
    console.log("wordLocation error: ", error);
  }

  if (result.filePath) {
    return result;
  }
};

// 获取单词位置
const getWordLocation = async (key: string) => {
  const { workspaceFolders } = vscode.workspace;
  let result = [];

  if (!workspaceFolders?.length || !key) {
    return;
  }

  const hasTranslate = Object.keys(localsData).some(
    (languageType) => localsData[languageType]?.[key]
  );

  if (!hasTranslate) {
    return;
  }

  try {
    const filePathArr = Object.keys(localsData).map(
      (languageType) => localsData[languageType]?.[key]?.path
    );
    for (let i = 0; i < filePathArr.length; i++) {
      const word = await wordLocation(key, vscode.Uri.file(filePathArr[i]));
      if (word) {
        result.push(
          new vscode.Location(
            vscode.Uri.file(word.filePath),
            new vscode.Position(word.lineIndex, word.wordIndex)
          )
        );
      }
    }
  } catch (error) {
    console.error("getWordLocation error: ", error);
  }

  return result;
};

export {
  localsData,
  checkHasLocales,
  checkLocalsPath,
  getContent,
  getI18nKey,
  getTips,
  getWordLocation,
};
