import { create } from '../design-lab/i18n';

// UI translations are shared with the prototype. Stored notes, names and tag
// identifiers stay unchanged; only developer-authored interface text uses tr.
export const appLocale = create();
export const tr = appLocale.text;
export const getLocale = () => appLocale.locale;
export const countRecords = (value: number) => appLocale.count(value, 'records');
