export type LanguageCode = 'ru' | 'en' | 'fr' | 'es' | 'de';
export type Language = { code: LanguageCode; name: string; locale: string };
export type Translator = {
  (source: string): string;
  (source: TemplateStringsArray, ...values: unknown[]): string;
};
export type DiaryLocale = {
  text: Translator;
  html: Translator;
  readonly language: LanguageCode;
  readonly locale: string;
  setLanguage(language: LanguageCode): void;
  number(value: number, decimals?: number): string;
  date(value: string | number | Date, options: Intl.DateTimeFormatOptions): string;
  count(value: number, unit: 'records' | 'periods' | 'readings'): string;
};
export const languages: Language[];
export function create(language?: LanguageCode): DiaryLocale;
export function systemLanguage(locale?: string | null): LanguageCode;
export function savedLanguage(raw: string | null): LanguageCode | null;
export function orderedLanguages(current: LanguageCode): Language[];
export function loadLanguage(storage: Pick<Storage, 'getItem'>, key: string, locale?: string | null): LanguageCode;
export function saveLanguage(storage: Pick<Storage, 'setItem'>, key: string, language: LanguageCode): void;
export function normalize(source: string): { text: string; tokens: Map<string, string> };
