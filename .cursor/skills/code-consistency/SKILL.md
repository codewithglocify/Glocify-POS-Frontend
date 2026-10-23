---
name: code-consistency
description: >-
  Enforces Core POS Admin code consistency: Prettier, 120-char lines, React
  namespace hooks (React.useState), no explicit any / as never, types-at-top,
  default function components, no render helpers, avoid sync useEffect, SOLID
  where fit, ESLint and TypeScript clean. Use when writing, editing, reviewing,
  or refactoring TypeScript/React code in this repository.
---

# Code Consistency

Apply these rules to every TypeScript/React change in this project. After
modifications, verify with Prettier, ESLint, and TypeScript before finishing.

## Formatting

- Code should strictly adhere to the prettier configuration, once all changes
  are done run prettier on all files where prettier is applicable.
- Code should not exceed 120 characters in a single line.
- Run `npx prettier --write <changed-files>` (or `npm run format` when
  appropriate) on every touched Prettier-applicable file before finishing.

## React imports and hooks

- react hooks like useEffect, useState, etc. should never be imported directly,
  instead just import the global React namespace and use hooks and components as
  `React.useState`, `React.Fragment`, `React.Activity`, `React.useEffect`.

```tsx
import * as React from 'react';

// ✅ React.useState / React.useEffect / React.Fragment
// ❌ import { useState, useEffect, Fragment } from 'react'
```

## TypeScript

- Once modifications are done there should be no typescript discrepancies, fix
  those error recursively.
- Strictly adhere to no-explicit-any, and do not use hacks like `as never`.
- All types for a module should appear at the top, always.
- Run `npx tsc --noEmit` (or the project equivalent) and resolve every error
  introduced by the change before finishing.

## Function components

Function components should follow the following format:

```tsx
type TopbarProps = {
  ... /*props*/
};

/*Rest of your types*/

export default function Topbar({ ... /*props*/ }: TopbarProps) {
  return <>...</>;
}
```

It should not be one of:

```tsx
const Topbar = ({ ...props }: { ... /*Prop Types*/ }) => {
  ...
};

export default Topbar;
```

or,

```tsx
function Topbar({ ...props }: { ... /*Prop Types*/ }) {
  ...
}

export default Topbar;
```

or,

```tsx
function Topbar({ ...props }: TopbarProps) {
  ...
}

export default Topbar;
```

The first mentioned format is valid.

## No render helper functions

Do not use render helper functions as follows:

```tsx
// bad
export default function Topbar({ ... /*props*/ }: TopbarProps) {
  const renderHelper = React.useCallback((...args) => <>Some Component</>, [
    dependencies,
  ]);

  return <>{renderHelper(...args)}</>;
}
```

Extract renderHelper into a react component and use that component directly.

## Effects and design

- Try not to use `useEffect`(s) to synchronize state unless there is no other
  option.
- Follow solid where ever possible but do not shoehorn it into situations where
  it might not be the best approach.

## ESLint

- Conform to eslint rules. Always (unless eslint itself ignores those files, or
  the files are not particularly relevant to the code).
- Run `npx eslint <changed-files>` (or `npm run lint`) on changed code and fix
  violations before finishing.

## Finish checklist

Before considering the task done:

1. Types for the module are at the top; component is `export default function`.
2. No direct named hook imports from `react`; use `React.*`.
3. No `any`, no `as never`.
4. No inline render helpers; extracted components instead.
5. Prettier applied to all applicable changed files (≤120 cols).
6. ESLint clean on changed files.
7. TypeScript clean (`tsc --noEmit`); fix errors recursively until none remain.
