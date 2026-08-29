import { beforeEach, describe, expect, it } from 'vitest';
import { createNotitiaTemplates, type NotitiaTemplates } from '../NotitiaTemplates';

describe('NotitiaTemplates - Order Confirmation Examples', () => {
  let templates: NotitiaTemplates;

  beforeEach(() => {
    templates = createNotitiaTemplates();
  });

  it('should render detailed order confirmation with items', () => {
    templates.registerTemplate('email', 'order-confirmation-detailed', {
      subject: 'Order Confirmation - #{{orderId}}',
      content: `Hello {{name}},

Thank you for your order!

─────────────────────────────
ORDER #{{orderId}}
Order Date: {{orderDate}}
─────────────────────────────

{{#each items}}
📦 {{this.name}}
   Quantity: {{this.quantity}} × {{this.price}} {{../currency}}
   Subtotal: {{this.subtotal}} {{../currency}}
{{#unless @last}}

{{/unless}}
{{/each}}

─────────────────────────────
Subtotal:    {{subtotal}} {{currency}}
Shipping:    {{shipping}} {{currency}}
Tax:         {{tax}} {{currency}}
─────────────────────────────
TOTAL:       {{total}} {{currency}}
─────────────────────────────

{{#if shippingAddress}}
📍 Shipping Address:
{{shippingAddress.street}}
{{shippingAddress.postalCode}} {{shippingAddress.city}}
{{shippingAddress.country}}
{{/if}}

{{#if trackingNumber}}
🚚 Tracking: {{trackingNumber}}
{{/if}}

Questions? Reply to this email or visit our support page.

Best regards,
{{organizationName}}`,
      description: 'Detailed order confirmation with line items',
    });

    const result = templates.render('email', 'order-confirmation-detailed', {
      name: 'Alice Johnson',
      orderId: 'ORD-98765',
      orderDate: '2025-06-15',
      organizationName: 'Nordic Shop',
      currency: 'NOK',
      items: [
        {
          name: 'Wireless Headphones',
          quantity: 2,
          price: '599.00',
          subtotal: '1198.00',
        },
        {
          name: 'USB-C Cable',
          quantity: 3,
          price: '99.00',
          subtotal: '297.00',
        },
      ],
      subtotal: '1495.00',
      shipping: '99.00',
      tax: '398.50',
      total: '1992.50',
      shippingAddress: {
        street: 'Storgata 15',
        postalCode: '0155',
        city: 'Oslo',
        country: 'Norway',
      },
      trackingNumber: 'NO-TRACK-2025-001',
    });

    expect(result.subject).toBe('Order Confirmation - #ORD-98765');
    expect(result.content).toContain('Alice Johnson');
    expect(result.content).toContain('ORD-98765');
    expect(result.content).toContain('Wireless Headphones');
    expect(result.content).toContain('USB-C Cable');
    expect(result.content).toContain('1992.50 NOK');
    expect(result.content).toContain('Storgata 15');
    expect(result.content).toContain('NO-TRACK-2025-001');
  });

  it('should render minimal order confirmation', () => {
    templates.registerTemplate('email', 'order-minimal', {
      subject: '✓ Order {{orderId}} Confirmed',
      content: `Hi {{name}}! 👋

Your order is confirmed and will ship soon.

{{#each items}}
• {{this.quantity}}× {{this.name}} — {{this.subtotal}} {{../currency}}
{{/each}}

Total: {{total}} {{currency}}

We'll email you when it ships.

— {{organizationName}}`,
      description: 'Minimal order confirmation',
    });

    const result = templates.render('email', 'order-minimal', {
      name: 'Bob',
      orderId: 'ORD-555',
      organizationName: 'Quick Shop',
      currency: 'NOK',
      items: [
        { name: 'Book', quantity: 1, subtotal: '299.00' },
        { name: 'Pen', quantity: 2, subtotal: '50.00' },
      ],
      total: '349.00',
    });

    expect(result.subject).toBe('✓ Order ORD-555 Confirmed');
    expect(result.content).toContain('Hi Bob! 👋');
    expect(result.content).toContain('• 1× Book — 299.00 NOK');
    expect(result.content).toContain('• 2× Pen — 50.00 NOK');
    expect(result.content).toContain('Total: 349.00 NOK');
  });
});
