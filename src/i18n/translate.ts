import { ENGINE_CLINICAL_EN } from './engineClinical';
import { ENGINE_CORE_EN } from './engineCore';
import { UI_EN } from './ui';

export type Lang = 'es' | 'en';

export const EN: Record<string, string> = {
  ...ENGINE_CORE_EN,
  ...ENGINE_CLINICAL_EN,
  ...UI_EN,
};

const NUMBER_RE = /-?\d+(?:[.,]\d+)?/g;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface Pattern {
  regex: RegExp;
  english: string;
}

const PATTERNS: Pattern[] = Object.entries(EN)
  .filter(([key]) => key.includes('#'))
  .map(([key, english]) => {
    let first = true;
    const source = escapeRegExp(key).replace(/#/g, () => {
      if (first) {
        first = false;
        return '(.*)';
      }
      return '(.*?)';
    });
    return { regex: new RegExp(`^${source}$`), english };
  });

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

function translateWithSource(text: string): string | null {
  let parenIndex = text.lastIndexOf(' (');
  while (parenIndex > 0) {
    const prefixEn = EN[text.slice(0, parenIndex)];
    if (prefixEn !== undefined) return prefixEn + text.slice(parenIndex);
    parenIndex = text.lastIndexOf(' (', parenIndex - 1);
  }
  return null;
}

function translateFragment(fragment: string): string {
  const exact = EN[fragment];
  if (exact !== undefined) return exact;
  return translateWithSource(fragment) ?? fragment;
}

export function translateText(text: string, lang: Lang): string {
  if (lang === 'es' || !text) return text;

  const exact = EN[text];
  if (exact !== undefined) return exact;

  for (const pattern of PATTERNS) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    let index = 1;
    return pattern.english.replace(/#/g, () => translateFragment(match[index++] ?? ''));
  }

  const sourced = translateWithSource(text);
  if (sourced !== null) return sourced;

  const numbers: string[] = [];
  const shape = text.replace(NUMBER_RE, (match) => {
    numbers.push(match);
    return '#';
  });

  if (shape !== text) {
    const template = EN[shape];
    if (template !== undefined) {
      let index = 0;
      return template.replace(/#/g, () => numbers[index++] ?? '#');
    }
  }

  return text;
}
