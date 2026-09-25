import { emailColors } from './emailColors';
/**
 * Locale-specific text for order status email templates
 */
export interface OrderStatusTexts {
  /** BCP 47 language tag for the <html lang> attribute, e.g. "nb" */
  lang: string;
  copyBanner: string;
  headerTitle: string;
  greeting: string;
  thankYouMessage: string;
  orderDetailsTitle: string;
  orderNumberLabel: string;
  orderDateLabel: string;
  customerEmailLabel: string;
  customerPhoneLabel?: string;
  orderedProductsTitle: string;
  productColumn: string;
  quantityColumn: string;
  priceColumn: string;
  sumColumn: string;
  totalLabel: string;
  totalLabelTaxExempt?: string;
  taxExemptLabel?: string;
  taxExemptReasonLabel?: string;
  shippingAddressTitle: string;
  trackingNumberLabel: string;
  shippingNotification: string;
  footerClosing: string;
}

/**
 * Shared CSS styles for order status emails
 */
export const ORDER_STATUS_STYLES = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${emailColors.text}; background-color: ${emailColors.pageBackground}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: ${emailColors.cardBackground}; }
    .copy-banner { background: ${emailColors.warningBackground}; color: ${emailColors.warningText}; padding: 15px 30px; text-align: center; font-weight: 600; font-size: 14px; letter-spacing: 1px; }
    .header { background: ${emailColors.primary}; color: ${emailColors.onPrimary}; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; }
    .message { color: ${emailColors.textMuted}; margin-bottom: 30px; }
    .order-box { background: ${emailColors.panelBackground}; border-left: 4px solid ${emailColors.primary}; padding: 20px; margin: 30px 0; border-radius: 4px; }
    .order-box h2 { margin: 0 0 15px 0; font-size: 20px; color: ${emailColors.text}; }
    .order-details { margin: 0; padding: 0; list-style: none; }
    .order-details li { padding: 8px 0; border-bottom: 1px solid ${emailColors.border}; display: flex; justify-content: space-between; }
    .order-details li:last-child { border-bottom: none; }
    .order-details .label { color: ${emailColors.textMuted}; }
    .order-details .value { color: ${emailColors.text}; font-weight: 500; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table thead { background: ${emailColors.panelBackground}; }
    .items-table th { padding: 12px; text-align: left; font-weight: 600; color: ${emailColors.textMuted}; border-bottom: 2px solid ${emailColors.border}; }
    .items-table td { padding: 12px; border-bottom: 1px solid ${emailColors.border}; }
    .items-table tbody tr:last-child td { border-bottom: none; }
    .items-table .quantity { text-align: center; }
    .items-table .price { text-align: right; }
    .total-row { font-weight: 600; font-size: 18px; color: ${emailColors.primary}; padding-top: 15px !important; }
    .footer { background: ${emailColors.panelBackground}; padding: 30px; text-align: center; color: ${emailColors.textMuted}; font-size: 14px; }
    .footer-message { margin-bottom: 15px; }
    .organization { font-weight: 600; color: ${emailColors.primary}; }
`.trim();

/**
 * Build order status email template with locale-specific text
 */
export function buildOrderStatusTemplate(texts: OrderStatusTexts): string {
  return `<!DOCTYPE html>
<html lang="${texts.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${ORDER_STATUS_STYLES}
  </style>
</head>
<body>
  <div class="container">
    {{#if isCopy}}
    <div class="copy-banner">📋 ${texts.copyBanner}</div>
    {{/if}}
    <div class="header">
      <h1>${texts.headerTitle}</h1>
    </div>
    <div class="content">
      <div class="greeting">${texts.greeting}</div>
      <div class="message">
        ${texts.thankYouMessage}
      </div>

      <div class="order-box">
        <h2>📦 ${texts.orderDetailsTitle}</h2>
        <ul class="order-details">
          <li>
            <span class="label">${texts.orderNumberLabel}:</span>
            <span class="value">#{{orderId}}</span>
          </li>
          <li>
            <span class="label">${texts.orderDateLabel}:</span>
            <span class="value">{{orderDate}}</span>
          </li>
          {{#if userEmail}}
          <li>
            <span class="label">${texts.customerEmailLabel}:</span>
            <span class="value">{{userEmail}}</span>
          </li>
          {{/if}}
          {{#if phone}}
          <li>
            <span class="label">${texts.customerPhoneLabel || 'Phone'}:</span>
            <span class="value">{{phone}}</span>
          </li>
          {{/if}}
          {{#if taxExempt}}
          <li>
            <span class="label">${texts.taxExemptLabel || 'Tax Exempt'}:</span>
            <span class="value" style="color: ${emailColors.primary}; font-weight: 600;">✓</span>
          </li>
          {{#if taxExemptReason}}
          <li>
            <span class="label">${texts.taxExemptReasonLabel || 'Reason'}:</span>
            <span class="value">{{taxExemptReason}}</span>
          </li>
          {{/if}}
          {{/if}}
        </ul>

        {{#if items}}
        <h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 18px; color: ${emailColors.text};">🛒 ${texts.orderedProductsTitle}</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>${texts.productColumn}</th>
              <th class="quantity">${texts.quantityColumn}</th>
              <th class="price">${texts.priceColumn}</th>
              <th class="price">${texts.sumColumn}</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{this.productTitle}}</td>
              <td class="quantity">{{this.quantity}}</td>
              <td class="price">{{this.priceFormatted}} {{this.currency}}</td>
              <td class="price">{{this.lineTotalFormatted}} {{this.currency}}</td>
            </tr>
            {{/each}}
            <tr>
              <td colspan="3" class="total-row" style="text-align: right; padding-right: 12px;">{{#if taxExempt}}${texts.totalLabelTaxExempt || texts.totalLabel}{{else}}${texts.totalLabel}{{/if}}:</td>
              <td class="price total-row">{{totalAmount}} {{currency}}</td>
            </tr>
          </tbody>
        </table>
        {{else}}
        {{#if totalAmount}}
        <ul class="order-details" style="margin-top: 20px;">
          <li>
            <span class="label">{{#if taxExempt}}${texts.totalLabelTaxExempt || texts.totalLabel}{{else}}${texts.totalLabel}{{/if}}:</span>
            <span class="value" style="font-weight: 600; font-size: 18px; color: ${emailColors.primary};">{{totalAmount}} {{currency}}</span>
          </li>
        </ul>
        {{/if}}
        {{/if}}
      </div>

      {{#if shippingAddress}}
      <div class="order-box">
        <h2>📍 ${texts.shippingAddressTitle}</h2>
        <div style="color: ${emailColors.text}; line-height: 1.8;">
          {{#if shippingAddress.addressLine1}}
          {{shippingAddress.addressLine1}}<br>
          {{/if}}
          {{#if shippingAddress.addressLine2}}
          {{shippingAddress.addressLine2}}<br>
          {{/if}}
          {{#if shippingAddress.postalCode}}{{shippingAddress.postalCode}}{{/if}}{{#if shippingAddress.city}} {{shippingAddress.city}}{{/if}}<br>
          {{#if shippingAddress.country}}
          {{shippingAddress.country}}
          {{/if}}
        </div>
      </div>
      {{/if}}

      <div class="message">
        {{#if trackingNumber}}
        <strong>${texts.trackingNumberLabel}:</strong> {{trackingNumber}}<br><br>
        {{else}}
        ${texts.shippingNotification}
        {{/if}}
      </div>
    </div>
    <div class="footer">
      <div class="footer-message">
        ${texts.footerClosing}<br>
        <span class="organization">{{organizationName}}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}
