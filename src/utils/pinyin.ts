import { pinyin } from 'pinyin-pro';
import { pinyinToFlypy } from '../data/flypy';

export interface PinyinChar {
  char: string;
  pinyin: string; // 全拼（无声调）
  pinyinWithTone: string; // 带声调拼音
  flypyCode: string; // 小鹤双拼编码
  isChineseChar: boolean; // 是否为汉字
}

// 判断是否为汉字
export function isChinese(char: string): boolean {
  return /[\u4e00-\u9fff]/.test(char);
}

// 判断是否为常见中英文标点
export function isPunctuation(char: string): boolean {
  return /[，。！？；：、“”‘’（）《》【】—…,.!?;:'"()<>[\]{}-]/.test(char);
}

// 获取单个汉字的拼音信息
export function getCharPinyin(char: string): PinyinChar {
  if (!isChinese(char)) {
    return {
      char,
      pinyin: char,
      pinyinWithTone: char,
      flypyCode: char,
      isChineseChar: false,
    };
  }

  const pinyinWithTone = pinyin(char, { toneType: 'symbol', type: 'array' })[0] || '';
  const pinyinNoTone = pinyin(char, { toneType: 'none', type: 'array' })[0] || '';
  const code = pinyinToFlypy[pinyinNoTone] || pinyinNoTone;

  return {
    char,
    pinyin: pinyinNoTone,
    pinyinWithTone,
    flypyCode: code,
    isChineseChar: true,
  };
}

// 将文本转换为 PinyinChar 数组（保留汉字和标点）
export function textToPinyinChars(text: string): PinyinChar[] {
  const chars: PinyinChar[] = [];
  for (const char of text) {
    if (isChinese(char) || isPunctuation(char)) {
      chars.push(getCharPinyin(char));
    }
    // 跳过其他字符（空格、换行等）
  }
  return chars;
}

// 检查输入是否匹配双拼编码
export function checkFlypyInput(input: string, expectedCode: string): 'correct' | 'partial' | 'wrong' {
  if (input.length === 0) return 'partial';
  if (input.length > expectedCode.length) return 'wrong';

  const inputLower = input.toLowerCase();
  const codeLower = expectedCode.toLowerCase();

  if (inputLower === codeLower) return 'correct';
  if (codeLower.startsWith(inputLower)) return 'partial';
  return 'wrong';
}
