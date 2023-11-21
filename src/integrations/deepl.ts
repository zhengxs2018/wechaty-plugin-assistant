import { Translation, type TranslationResult } from './translation';

export type DeepLTranslationOptions = {
  from?: string;
  to?: string;
};

export class DeepL extends Translation {
  protected async request(
    text: string,
    from: string,
    to: string,
  ): Promise<TranslationResult> {
    const id = this.random();

    const parameters: DeepL.TranslationRequest = {
      id: id,
      jsonrpc: '2.0',
      method: 'LMT_handle_texts',
      params: {
        texts: [
          {
            text: text,
            requestAlternatives: 3,
          },
        ],
        splitting: 'newlines',
        lang: {
          source_lang_user_selected: from,
          target_lang: to,
        },
        timestamp: this.timestamp(text),
      },
    };

    let body = JSON.stringify(parameters);
    if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
      body = body.replace('"method":"', '"method" : "');
    } else {
      body = body.replace('"method":"', '"method": "');
    }

    const response = await fetch('https://www2.deepl.com/jsonrpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    }).then<DeepL.TranslationResponse>(async res => {
      if (res.ok) return res.json();

      const message = await res.text().catch(() => res.statusText);

      throw new Error(`Fetch error: ${message} (${res.status})`);
    });

    const { lang, texts } = response.result;
    const [partial] = texts;

    return {
      lang: lang,
      result: partial.text,
      alternatives: partial.alternatives.map(a => a.text),
    };
  }

  random() {
    return (Math.floor(Math.random() * 99999) + 100000) * 1000;
  }

  timestamp(text: string) {
    let iCount = text.split('i').length - 1;

    const ts = Date.now();
    if (iCount === 0) return ts;

    iCount = iCount + 1;

    return ts - (ts % iCount) + iCount;
  }
}

export namespace DeepL {
  export type TranslationPartialText = {
    text: string;
    requestAlternatives: number;
  };

  export type TranslationParameters = {
    texts: TranslationPartialText[];
    splitting: string;
    lang: {
      source_lang_user_selected: string;
      target_lang: string;
    };
    timestamp: number;
  };

  export type TranslationRequest = {
    id: number;
    jsonrpc: string;
    method: string;
    params: TranslationParameters;
  };

  export type ResultAlternativeText = {
    text: string;
  };

  export type ResultText = {
    text: string;
    alternatives: ResultAlternativeText[];
  };

  export type TranslationResult = {
    texts: ResultText[];
    lang: string;
    lang_is_confident: boolean;
    detectedLanguages: Record<string, number>;
  };

  export type TranslationResponse = {
    id: number;
    jsonrpc: string;
    result: TranslationResult;
  };
}

export default DeepL;
