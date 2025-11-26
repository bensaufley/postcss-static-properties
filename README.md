# postcss-static-properties

A very small [PostCSS] plugin to enable using [CSS Custom Properties] for static
values, which get "baked" down to their simple values in the built CSS.

## Rationale

CSS Custom Properties are great, powerful, and really useful for a lot of
things. They're also an unnecessary addition when their value will never change:

- Custom Properties take up a minimum of 8 characters every time they're
  referenced, so for example using `var(--colorWhite)` for `#fff`[^1] increases
  the size of the (non-gzipped) CSS every time it's used.
- Every variable used like this pollutes the scope, and risks conflicting with
  something else on the page accidentally
- Frankly, not every const needs a publicly-readable name. Sometimes you've got
  a `$blueDarkDarker2` and you just can't get it a better name right now.

For my own use cases, I've ended up using [`postcss-simple-vars`] for those
types of variables; a holdover from the SASS days. But the CSS ecosystem is
increasingly moving toward writing spec-compliant and spec-adjacent CSS, and
leaving behind the entirely-distinct syntaxes of things like SASS and LESS. One
example is that [Stylelint] is built to accept a lot of the things PostCSS
brings to the table—but, notably, not `$dollarVariables`. This plugin aims to
bridge tht gap, allowing

## Options

- **`variables` (Required)**: a key-value mapping of names to replacement
  values. If `--` is not prefixed, it will be added.


[^1]: This is an example for brevity; please do not read into the use of a variable for `#fff`

[postcss]: https://postcss.org/
[css custom properties]: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties
[`postcss-simple-vars`]: https://github.com/postcss/postcss-simple-vars
[stylelint]: https://stylelint.io/
