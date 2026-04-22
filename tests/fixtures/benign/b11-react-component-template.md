# React Component Template

Reusable component scaffolding conventions.

## File layout

```
src/components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.module.css
    index.ts
```

## Typed props

```tsx
export type ButtonProps = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={variant} onClick={onClick}>
      {label}
    </button>
  );
}
```

The above example wires a label prop and an onClick handler with a default variant.

## For chat or LLM components

If the component renders model output, keep the system prompt template in `src/prompts/chat.md` rather than inline. This separates content from rendering and keeps diffs reviewable.

## Testing

Co-locate `Button.test.tsx` next to the component. Use `@testing-library/react` for interactions:

```tsx
import { render, screen } from '@testing-library/react';

render(<Button label="Click" onClick={() => {}} />);
expect(screen.getByRole('button')).toHaveTextContent('Click');
```
