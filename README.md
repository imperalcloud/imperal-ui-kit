# @imperal/ui-kit

Canonical React renderer for Imperal declarative `UINode` payloads.

The kit is host-portable: it renders the SDK wire contract without importing panel-only components. Hosts can provide integrations such as application icons through the public configuration API.

## Local development

Canonical design tokens live in the sibling `@imperal/design-tokens` repository. Local builds resolve them through a development-only `file:../imperal-design-tokens` dependency and compile them into `dist/styles.css`; package consumers do not need the sibling checkout.

```bash
npm install
npm run check
```

`npm run check` validates types, SDK↔renderer compatibility, component behavior/accessibility/security, production builds, strict SSR rendering, dependencies, and a clean packed consumer.

## Consumer usage

```tsx
import { DeclarativeRenderer, type UINode } from '@imperal/ui-kit';
import '@imperal/ui-kit/styles.css';

const node: UINode = {
  type: 'Alert',
  props: { message: 'Ready', type: 'success' },
};

export function Preview() {
  return <DeclarativeRenderer node={node} onAction={async action => {
    // Route the grounded action through the host application.
  }} />;
}
```

Wrap the host region in `.imperal-ui`; the distributed stylesheet is scoped to that boundary.

## Contract and tokens

- `contracts/imperal-sdk-ui.json` records tested SDK visual types, nested-only types, host envelopes, aliases, and renderer extensions.
- `scripts/check-contract.mjs` rejects missing SDK visual types and undocumented renderer-only types.
- `src/styles.css` consumes canonical sources from `@imperal/design-tokens`; token payloads are not duplicated here.

## Publishing

The workflow is local/workspace-first. Validate the packed tarball with `npm run check:packed` before tagging or publishing. Registry publication and production-panel migration are separate release operations.
