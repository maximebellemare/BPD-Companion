import { i18n } from './index';
import { normalizeLanguageTag } from './languageStorage';

export function localizedText(english: string, spanish: string): string {
  return normalizeLanguageTag(i18n.language) === 'es' ? spanish : english;
}

export function localizedArray(english: string[], spanish: string[]): string[] {
  return normalizeLanguageTag(i18n.language) === 'es' ? spanish : english;
}

export function localizedArrayProxy(english: string[], spanish: string[]): string[] {
  return new Proxy(english, {
    get(_target, prop, receiver) {
      const source = normalizeLanguageTag(i18n.language) === 'es' ? spanish : english;
      const value = Reflect.get(source, prop, receiver);
      return typeof value === 'function' ? value.bind(source) : value;
    },
    ownKeys() {
      return Reflect.ownKeys(normalizeLanguageTag(i18n.language) === 'es' ? spanish : english);
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(
        normalizeLanguageTag(i18n.language) === 'es' ? spanish : english,
        prop,
      );
    },
  }) as string[];
}

export function localizedField<T extends object>(
  item: T,
  field: string,
  english: string,
  spanish: string,
): T {
  return Object.defineProperty(item, field, {
    enumerable: true,
    configurable: true,
    get: () => localizedText(english, spanish),
  });
}

export function localizedFields<T extends object>(
  item: T,
  fields: Record<string, { en: string; es: string }>,
): T {
  for (const [field, copy] of Object.entries(fields)) {
    localizedField(item, field, copy.en, copy.es);
  }
  return item;
}
