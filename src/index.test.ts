import postcss from 'postcss';
import { equal } from 'node:assert';
import { test } from 'node:test';

import plugin, { type Opts } from './index.js';

async function run(input: string, output: string, opts: Opts = {}, warnings = 0) {
  const result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });

  equal(result.css, output);
  equal(result.warnings().length, warnings);
}

test('applies simple replacement', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: #fff; }', {
    variables: {
      '--blah': '#fff',
    },
  });
});

test('applies multiline replacement', async () => {
  await run(
    `
    a {
      foo: var(
        --blah
      );
      bar: var( --blah, red );
      baz: var(
--blah,
);
    }
  `,
    `
    a {
      foo: #fff;
      bar: #fff;
      baz: #fff;
    }
  `,
    {
      variables: {
        '--blah': '#fff',
      },
    },
    1
  );
});

test('warns for inappropriate fallback', async () => {
  const input = `
    a {
      foo: var(--blah, blue);
    }
  `;
  const output = `
    a {
      foo: #fff;
    }
  `;
  const result = await postcss([
    plugin({
      variables: {
        '--blah': '#fff',
      },
    }),
  ]).process(input, {
    from: undefined,
  });

  equal(result.css, output);
  equal(
    result.warnings().at(0)?.text,
    'Using fallback value "blue" for variable "--blah" is not supported. Using the assigned value "#fff" from variables.'
  );
});

test('does not replace unknown variable', async () => {
  await run('a{ foo: var(--unknown); }', 'a{ foo: var(--unknown); }', {
    variables: {
      '--blah': '#fff',
    },
  });
});

test('does not replace when no variables provided', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: var(--blah); }');
});

test('accepts variables without -- prefix', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: rgb(128 128 255 / 50%); }', {
    variables: {
      blah: 'rgb(128 128 255 / 50%)',
    },
  });
});

test('handles null/undefined variable values', async () => {
  await run('a{ foo: var(--null); bar: var(--undef); }', 'a{ foo: ; bar: ; }', {
    variables: {
      // @ts-expect-error
      null: null,
      // @ts-expect-error
      undef: undefined,
    },
  });
});
