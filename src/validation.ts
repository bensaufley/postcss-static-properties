import postcss, { type Declaration } from 'postcss';

export const standardize = (variables: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(variables).map(([key, value]) => [key.startsWith('--') ? key : `--${key}`, (value ?? '').toString()])
  );

export const invalidValues = (variables: Record<string, string>): string[] =>
  Object.values(variables).filter((value) => {
    try {
      const parsed = postcss.parse(`--testValue: ${value};`, {
        from: undefined,
      });
      const decl = parsed.nodes[0] as postcss.Declaration;
      const parsedValue = decl.value;
      if (parsedValue.trim() !== value.trim()) {
        console.log({ parsedValue, value });
        return true;
      }
      return false;
    } catch (ex) {
      return true;
    }
  });

const varNameRegex = /^--[A-Za-z0-9-_]+$/;

export const invalidKeys = (variables: Record<string, string>): string[] =>
  Object.keys(variables).filter((name) => !varNameRegex.test(name));

export const invalidMessage = (type: string, values: readonly string[]) =>
  `Found the following invalid variable ${type}(s) in options: ${values.slice(0, 5).join(', ')}${
    values.length > 5 ? ', ...' : ''
  }`;
