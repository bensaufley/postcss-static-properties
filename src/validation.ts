import postcss from 'postcss';

import type { Namespace, PropertyValue } from 'index.js';

const nest = (obj: Namespace, separator: string, prefix: string = ''): readonly (readonly [string, PropertyValue])[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    if (value && typeof value === 'object') return nest(value, separator, `${prefix}${key}${separator}`);
    return [[`${prefix}${key}`, value ?? '']];
  });

export const standardize = (variables: Namespace, separator: string): Record<string, PropertyValue> =>
  Object.fromEntries(
    nest(variables, separator).map(([key, value]) => [key.startsWith('--') ? key : `--${key}`, value])
  );

export const invalidValues = (variables: Record<string, PropertyValue>): PropertyValue[] =>
  Object.values(variables).filter((value) => {
    try {
      const parsed = postcss.parse(`--testValue: ${value};`, {
        from: undefined,
      });
      const decl = parsed.nodes[0] as postcss.Declaration;
      const parsedValue = decl.value;
      return parsedValue.trim() !== value.toString().trim();
    } catch (ex) {
      return true;
    }
  });

const varNameRegex = /^--[A-Za-z0-9-_]+$/;

export const invalidKeys = (variables: Record<string, PropertyValue>): string[] =>
  Object.keys(variables).filter((name) => !varNameRegex.test(name));

export const invalidMessage = (type: string, values: readonly (string | PropertyValue)[]) =>
  `Found the following invalid variable ${type}(s) in options: ${values.slice(0, 5).join(', ')}${
    values.length > 5 ? ', ...' : ''
  }`;
