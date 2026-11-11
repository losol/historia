# Payment components

## PaymentStatusSSE

A client component that follows a payment while it settles. It opens a
Server-Sent Events connection to `/api/payment/[reference]/events`, which
polls the transaction, shows the status as it changes and calls
`onStatusChange` for each update. It closes the connection when the payment
reaches a final state, on an error, and when the stream times out, which it
reports as the status `timeout`.

```tsx
import { PaymentStatusSSE } from '@/components/payment/PaymentStatusSSE';

<PaymentStatusSSE reference={reference} onStatusChange={handleStatusChange} />;
```

The page a customer returns to from Vipps uses it:
`src/app/(frontend)/[locale]/checkout/vipps/page.client.tsx`.

## The rest of the checkout

This file used to be the plan for a `VippsExpressButton` in this directory.
There is no such component; the checkout lives in these places:

- Starting a payment: `createVippsPayment` in
  `src/app/(frontend)/[locale]/checkout/actions.ts`.
- The return page and creating the order:
  `src/app/(frontend)/[locale]/checkout/vipps/`.
- The webhook: `src/app/api/webhooks/vipps/route.ts`.

## Documentation

- [Vipps integration](../../../docs/VIPPS.md): the test environment and
  Express checkout.
- [Payment status with SSE](../../../docs/SSE_PAYMENT_STATUS.md).
- [Recovery when the webhook and the customer race](../../../docs/VIPPS_WEBHOOK_SSE_RECOVERY.md).
- [Vipps commerce for administrators](../../../docs/administrator/vipps-commerce.md).
