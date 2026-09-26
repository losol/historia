---
"@eventuras/historia": minor
---

The public site is styled by ratio-ui throughout. Tailwind was never actually compiled for it, so many elements rendered unstyled; they now use ratio-ui components:

- Form fields (text, email, number, textarea, select, country, state, checkbox) and the submit button.
- Rich text: lists have bullets and numbers, and links are visibly links.
- The instruction and resources blocks, the pending-payment notice at checkout, the cart's loading spinner, the payment status indicator and the hero lead.
- The cart button shows the item count as a badge, and its label names the count for screen readers.

The skip link now appears on keyboard focus and moves focus to the main content. Tailwind, the shadcn components, Radix and other unused dependencies are removed. Requires `@eventuras/ratio-ui` 2.25.
