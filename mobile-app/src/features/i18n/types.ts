export type LocaleInfo = {
  code: string;
  name: string;
  nativeName: string;
  currencyCode: string;
  dateFormat: string;
  rtl: boolean;
};

export type Translations = Record<string, string>;
