import { pinyin } from 'pinyin-pro';
import { pinyinToFlypy } from '../data/flypy';

export interface PinyinChar {
  char: string;
  pinyin: string; // 全拼（无声调）
  pinyinWithTone: string; // 带声调拼音
  flypyCode: string; // 小鹤双拼编码
  isChineseChar: boolean; // 是否为汉字
}

// 常见多音字在打字练习里的优先读音（偏向现代书面语常用读法）
const commonPolyphonicOverrides: Record<string, string> = {
  '了': 'le',
  '着': 'zhe',
  '得': 'de',
  '地': 'de',
  '的': 'de',
};

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

  const override = commonPolyphonicOverrides[char];
  const pinyinNoTone = override || pinyin(char, { toneType: 'none', type: 'array' })[0] || '';
  const pinyinWithTone = override
    ? pinyin(override, { toneType: 'symbol', type: 'array' })[0] || override
    : pinyin(char, { toneType: 'symbol', type: 'array' })[0] || '';
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
  const chineseChars = [...text].filter((ch) => isChinese(ch));
  const chineseText = chineseChars.join('');
  const contextNone = chineseText
    ? pinyin(chineseText, { toneType: 'none', type: 'array' })
    : [];
  const contextTone = chineseText
    ? pinyin(chineseText, { toneType: 'symbol', type: 'array' })
    : [];

  const chars: PinyinChar[] = [];
  let zhIndex = 0;
  for (const char of text) {
    if (isChinese(char)) {
      const pinyinNoTone = contextNone[zhIndex];
      const pinyinWithTone = contextTone[zhIndex];
      zhIndex++;
      if (pinyinNoTone && pinyinWithTone) {
        chars.push({
          char,
          pinyin: pinyinNoTone,
          pinyinWithTone,
          flypyCode: pinyinToFlypy[pinyinNoTone] || pinyinNoTone,
          isChineseChar: true,
        });
      } else {
        chars.push(getCharPinyin(char));
      }
      continue;
    }
    if (isPunctuation(char)) {
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
