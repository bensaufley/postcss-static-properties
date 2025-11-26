import type { PluginCreator } from 'postcss';

import { invalidKeys, invalidMessage, invalidValues, standardize } from './validation.js';

export interface Opts {
  variables?: Record<string, string>;
}

const plugin = (({ variables = {} } = {}) => {
  const standardVars: Record<string, string> = standardize(variables);
  const varNames = Object.keys(standardVars);

  const invalidVarNames = invalidKeys(standardVars);
  if (invalidVarNames.length > 0) throw new Error(invalidMessage('key', invalidVarNames));

  const invalidVals = invalidValues(standardVars);
  if (invalidVals.length > 0) throw new Error(invalidMessage('value', invalidVals));

  return {
    postcssPlugin: 'postcss-static-properties',

    Declaration(decl, postcss) {
      if (!decl.value.includes('var(')) return;
      if (!varNames.some((name) => decl.value.includes(name))) return;

      decl.value = decl.value.replace(
        /var\([\s\n]*(--[^,)\s\n]+)(?:,[\s\n]*(.+))?,?[\s\n]*\)/gim,
        (match: string, varName: string, fallback: string | undefined) => {
          if (!(varName in standardVars)) return match;

          const val = standardVars[varName];
          if (typeof fallback === 'string') {
            decl.warn(
              postcss.result,
              `Using fallback value "${fallback}" for variable "${varName}" is not supported. Using the assigned value "${val}" from variables.`,
              { node: decl }
            );
          }

          return val;
        }
      );
    },
  };
}) as PluginCreator<Opts>;

plugin.postcss = true;

export default plugin;
