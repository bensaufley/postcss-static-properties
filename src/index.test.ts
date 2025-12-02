import postcss from 'postcss';
import { equal } from 'node:assert';
import { test as it } from 'node:test';

import plugin, { type Opts } from './index.js';

async function run(input: string, output: string, opts: Opts = {}, warnings = 0) {
  const result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });

  equal(result.css, output);
  equal(result.warnings().length, warnings);
}

it('applies simple replacement', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: #fff; }', {
    variables: {
      '--blah': '#fff',
    },
  });
});

it('applies multiline replacement', async () => {
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

it('warns for inappropriate fallback', async () => {
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

it('does not replace unknown variable', async () => {
  await run('a{ foo: var(--unknown); }', 'a{ foo: var(--unknown); }', {
    variables: {
      '--blah': '#fff',
    },
  });
});

it('does not replace when no variables provided', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: var(--blah); }');
});

it('accepts variables without -- prefix', async () => {
  await run('a{ foo: var(--blah); }', 'a{ foo: rgb(128 128 255 / 50%); }', {
    variables: {
      blah: 'rgb(128 128 255 / 50%)',
    },
  });
});

it('handles null/undefined variable values', async () => {
  await run('a{ foo: var(--null); bar: var(--undef); }', 'a{ foo: ; bar: ; }', {
    variables: {
      null: null,
      undef: undefined,
    },
  });
});

it('handles numeric values', async () => {
  await run('a{ foo: var(--num); }', 'a{ foo: 42; }', {
    variables: {
      num: 42,
    },
  });
});

it('namespaces variables', async () => {
  await run(
    `
    a {
      foo: var(--ns--color--primary);
      bar: var(--ns--small);
      baz: var(--root);
    }
    `,
    `
    a {
      foo: #333;
      bar: 8px;
      baz: 100%;
    }
    `,
    {
      variables: {
        root: '100%',
        ns: {
          color: {
            primary: '#333',
          },
          small: '8px',
        },
      },
    }
  );
});

it('namespaces variables with a custom divider', async () => {
  await run(
    `
    a {
      blah: var(--ns--color--primary);
      foo: var(--ns__color__primary);
      bar: var(--ns__small);
      baz: var(--root);
    }
    `,
    `
    a {
      blah: var(--ns--color--primary);
      foo: #333;
      bar: 8px;
      baz: 100%;
    }
    `,
    {
      namespaceSeparator: '__',
      variables: {
        root: '100%',
        ns: {
          color: {
            primary: '#333',
          },
          small: '8px',
        },
      },
    }
  );
});

it('works as a fallback for a true custom property', async () => {
  await run(
    `
    a {
      color: var(--customColor, var(--ns--color--primary));
      font-weight: var(
        --customWeight,
        var(--ns--font--weight),
      );
      font-size: var(--fontSize, 1rem);
    }
    `,
    `
    a {
      color: var(--customColor, #333);
      font-weight: var(
        --customWeight,
        700,
      );
      font-size: var(--fontSize, 1rem);
    }
    `,
    {
      variables: {
        ns: {
          color: {
            primary: '#333',
          },
          font: {
            weight: '700',
          },
        },
      },
    }
  );
});
