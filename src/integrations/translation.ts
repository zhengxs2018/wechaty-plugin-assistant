import { ok } from 'node:assert';

import LanguageDetect from 'languagedetect';

export abstract class Translation {
  protected lang = new LanguageDetect();

  protected languagesToCodes = new Map([
    ['bulgarian', 'bg'],
    ['czech', 'cs'],
    ['danish', 'da'],
    ['dutch', 'nl'],
    ['english', 'en'],
    ['hawaiian', 'en'],
    ['estonian', 'et'],
    ['finnish', 'fi'],
    ['french', 'fr'],
    ['german', 'de'],
    ['hungarian', 'hu'],
    ['italian', 'it'],
    ['latvian', 'lv'],
    ['lithuanian', 'lt'],
    ['polish', 'pl'],
    ['portuguese', 'pt'],
    ['romanian', 'ro'],
    ['russian', 'ru'],
    ['slovak', 'sk'],
    ['slovene', 'sl'],
    ['spanish', 'es'],
    ['swedish', 'sv'],
  ]);

  supportedLanguages = new Map([
    ['auto', '自动检测'],
    ['zh', '中文 🇨🇳'],
    ['en', '英语 🇬🇧'],
    ['de', '德语 🇩🇪'],
    ['es', '西班牙语 🇪🇸'],
    ['fr', '法语 🇫🇷'],
    ['it', '意大利语 🇮🇹'],
    ['ja', '日语 🇯🇵'],
    ['ko', '韩语 🇰🇷'],
    ['nl', '荷兰语 🇳🇱'],
    ['pl', '波兰语 🇵🇱'],
    ['pt', '葡萄牙语 🇵🇹'],
    ['ru', '俄语 🇷🇺'],
    ['bg', '保加利亚语 🇧🇬'],
    ['cs', '捷克语 🇨🇿'],
    ['da', '丹麦语 🇩🇰'],
    ['el', '希腊语 🇬🇷'],
    ['et', '爱沙尼亚语 🇪🇪'],
    ['fi', '芬兰语 🇫🇮'],
    ['hu', '匈牙利语 🇭🇺'],
    ['lt', '立陶宛 🇱🇹'],
    ['lv', '拉脱维亚语 🇱🇻'],
    ['ro', '罗马尼亚语 🇷🇴'],
    ['sk', '斯洛伐克语 🇸🇰'],
    ['sl', '斯洛文尼亚语 🇸🇮'],
    ['sv', '瑞典 🇸🇪'],
  ]);

  translate(
    text: string,
    options: TranslationOptions = {},
  ): Promise<TranslationResult> {
    const from = options.from ?? this.getCanonicalLocale(text);
    const to = options.to ?? (from === 'zh' ? 'en' : 'zh');

    ok(this.isSupported(from), `Unsupported language: ${from}`);
    ok(this.isSupported(to), `Unsupported language: ${to}`);

    return this.request(text, from, to);
  }

  protected getCanonicalLocale(text: string): string {
    const languages = this.detectedLanguages(text);

    for (const [lang] of languages) {
      const code = this.languagesToCodes.get(lang);
      if (code) return code;
    }

    // Note: languagedetect 不支持中文检测
    // 所以这里如果检测不到语言，就默认为中文
    // 这会导致一些特殊语言的翻译出现问题
    return 'zh';
  }

  protected isSupported(tag: string): boolean {
    return this.supportedLanguages.has(tag.toLowerCase());
  }

  /**
   * @param text - 要检测的文本
   * @param limit - 最大匹配数
   * @returns 返回匹配的语言列表
   */
  protected detectedLanguages(text: string, limit = 5) {
    return this.lang.detect(text, limit);
  }

  protected abstract request(
    text: string,
    from: string,
    to: string,
  ): Promise<TranslationResult>;
}

export type TranslationOptions = {
  from?: string;
  to?: string;
};

export type TranslationResult = {
  lang: string;
  result: string;
  alternatives: string[];
};
