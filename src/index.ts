import type { Helpers, PluginCreator } from 'postcss';

import { invalidKeys, invalidMessage, invalidValues, standardize } from './validation.js';
import type Declaration_ from 'postcss/lib/declaration';

export type PropertyValue = string | number;

export interface Namespace {
  [k: string]: Namespace | PropertyValue | null | undefined;
}

export interface Opts {
  /** @default '--'' */
  namespaceSeparator?: string;
  variables?: Namespace;
}

const matcher = /(var\([\s\n]*)(--[^,)\s\n]+)(,[\s\n]*.+)?(,?[\s\n]*\))/gim;

const plugin = (({ namespaceSeparator = '--', variables = {} } = {}) => {
  const standardVars: Record<string, PropertyValue> = standardize(variables, namespaceSeparator);
  const varNames = Object.keys(standardVars);

  const invalidVarNames = invalidKeys(standardVars);
  if (invalidVarNames.length > 0) throw new Error(invalidMessage('key', invalidVarNames));

  const invalidVals = invalidValues(standardVars);
  if (invalidVals.length > 0) throw new Error(invalidMessage('value', invalidVals));

  const replacer =
    (decl: Declaration_, postcss: Helpers) =>
    (match: string, opening: string, varName: string, fallback: string | undefined, closing: string) => {
      if (!(varName in standardVars)) {
        if (fallback) {
          return `${opening}${varName}${fallback.replace(matcher, replacer(decl, postcss))}${closing}`;
        }
        return match;
      }

      const val = standardVars[varName];
      if (typeof fallback === 'string') {
        decl.warn(
          postcss.result,
          `Using fallback value "${fallback.replace(
            /^,[\s\n]*/,
            ''
          )}" for variable "${varName}" is not supported. Using the assigned value "${val}" from variables.`,
          { node: decl }
        );
      }

      return val.toString();
    };

  return {
    postcssPlugin: 'postcss-static-properties',

    Declaration(decl, postcss) {
      if (!decl.value.includes('var(')) return;
      if (!varNames.some((name) => decl.value.includes(name))) return;

      decl.value = decl.value.replace(matcher, replacer(decl, postcss));
    },
  };
}) as PluginCreator<Opts>;

plugin.postcss = true;

export default plugin;
