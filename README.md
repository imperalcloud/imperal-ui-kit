# @imperal/ui-kit

Canonical, responsive React renderer for Imperal declarative `UINode` payloads.

The package is host-portable: SDK payloads render without panel-only imports. The UI root owns the `.imperal-ui` CSS boundary, locale, direction, theme, action/confirmation adapters, error reporting and optional application-icon adapter.

## Local development

Canonical design tokens live in the sibling `@imperal/design-tokens` repository. Local builds compile them into `dist/styles.css`; consumers do not need the sibling checkout.

```bash
npm install
npm run check
```

The check gate runs ESLint/a11y rules, TypeScript, SDK contract validation, coverage thresholds, production/package builds, CSS isolation, bundle budgets, strict SSR rendering, dependency audit and a clean packed-consumer build.

## Consumer usage

```tsx
import { DeclarativeRenderer, type UINode } from '@imperal/ui-kit';
import '@imperal/ui-kit/styles.css';

const node: UINode = {
  id: 'status',
  type: 'Alert',
  props: { message: 'Ready', type: 'success' },
};

export function Preview() {
  return (
    <DeclarativeRenderer
      node={node}
      theme="system"
      locale="en"
      onAction={async action => {
        // Route the grounded action through the host application.
      }}
      onError={(error, context) => reportError(error, context)}
    />
  );
}
```

`DeclarativeRenderer` creates the scoped root by default. For several renderers under one boundary, use `ImperalUIRoot` from `@imperal/ui-kit/provider` and pass `root={false}` to nested renderers.

### Stable refreshes

Use `node.id` (or `node.key`) as stable identity. Increment `node.revision` when local UI state must reset deliberately. Controls reconcile refreshed values while equivalent rerenders preserve in-progress edits.

### Responsive sizing

The kit uses semantic tokens, `rem`, `clamp()` and bounded viewport units. Avoid raw unbounded `vw` for text or controls: it harms zoom, ultrawide and small-screen accessibility. Dialogs/slideover panels use dynamic viewport units and mobile-first layouts; tables and visualisations provide overflow or accessible data fallbacks.

### Focus and asynchronous actions

Dialogs and slideovers trap focus, restore it on close, close on Escape and lock background scrolling. Menu follows menu-button keyboard semantics. Buttons and forms expose pending/error state and suppress duplicate asynchronous submissions.

### Accessibility and content safety

Interactive controls preserve keyboard and visible-focus behavior, use accessible names and maintain practical touch targets. Charts and graphs expose textual/data fallbacks. Rich HTML is sanitized during SSR and in the browser; sandboxed content remains isolated. Automated axe, keyboard, SSR, CSS-isolation and security regressions run in the release gate.

## Public subpaths

- `@imperal/ui-kit` — renderer and complete component API.
- `@imperal/ui-kit/provider` — lightweight root/provider and UI primitives.
- `@imperal/ui-kit/lazy` — opt-in deferred renderer boundary for hosts that prioritise a small initial JavaScript payload.
- `@imperal/ui-kit/types` — type-only contract entry.
- `@imperal/ui-kit/styles.css` — canonical scoped stylesheet.

```tsx
import { ImperalUIRoot, Skeleton } from '@imperal/ui-kit/provider';
import { LazyDeclarativeRenderer } from '@imperal/ui-kit/lazy';
import type { UINode } from '@imperal/ui-kit/types';

export function DeferredPreview({ node }: { node: UINode }) {
  return (
    <ImperalUIRoot>
      <LazyDeclarativeRenderer
        root={false}
        node={node}
        fallback={<Skeleton className="min-h-32" />}
      />
    </ImperalUIRoot>
  );
}
```

The lazy entrypoint defers the complete canonical renderer while preserving provider, registry, action and error-boundary semantics. Package metadata marks only the stylesheet as side-effectful, so JavaScript exports remain tree-shakeable.

## Contract and tokens

- `contracts/imperal-sdk-ui.json` records tested SDK visual types, nested-only types, aliases and renderer extensions.
- `scripts/check-contract.mjs` rejects missing SDK visual types and undocumented renderer-only types.
- `src/styles.css` consumes canonical `@imperal/design-tokens`; token payloads are not duplicated here.
- Hard-coded Tailwind palette classes are rejected by lint; component styling uses semantic utilities.

## Publishing

Validate with `npm run check`, then tag a reviewed commit. Registry publication and production-panel migration are separate release operations; production should consume an exact packed artifact/version and retain a tested rollback.
