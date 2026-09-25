import { emailColors } from './emailColors';
/**
 * Locale-specific text for order shipped email template
 */
export interface OrderShippedTexts {
  /** BCP 47 language tag for the <html lang> attribute, e.g. "nb" */
  lang: string;
  headerTitle: string;
  greeting: string;
  shippedMessage: string;
  shipmentDetailsTitle: string;
  orderNumberLabel: string;
  trackingNumberLabel: string;
  trackingUrlLabel: string;
  estimatedDeliveryLabel: string;
  shippedProductsTitle: string;
  productColumn: string;
  quantityColumn: string;
  shippingAddressTitle: string;
  supportMessage: string;
  footerClosing: string;
}

/**
 * Shared CSS styles for order shipped email (reusing order confirmation styles with shipping-specific colors)
 */
export const ORDER_SHIPPED_STYLES = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${emailColors.text}; background-color: ${emailColors.pageBackground}; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: ${emailColors.cardBackground}; }
    .header { background: ${emailColors.success}; color: ${emailColors.onPrimary}; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header .icon { font-size: 48px; margin-bottom: 15px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; margin-bottom: 20px; }
    .message { color: ${emailColors.textMuted}; margin-bottom: 30px; line-height: 1.8; }
    .shipment-box { background: ${emailColors.successBackground}; border-left: 4px solid ${emailColors.success}; padding: 20px; margin: 30px 0; border-radius: 4px; }
    .shipment-box h2 { margin: 0 0 15px 0; font-size: 20px; color: ${emailColors.text}; }
    .shipment-details { margin: 0; padding: 0; list-style: none; }
    .shipment-details li { padding: 12px 0; border-bottom: 1px solid ${emailColors.border}; display: flex; justify-content: space-between; align-items: center; }
    .shipment-details li:last-child { border-bottom: none; }
    .shipment-details .label { color: ${emailColors.textMuted}; font-weight: 500; }
    .shipment-details .value { color: ${emailColors.text}; font-weight: 600; }
    .tracking-link { display: inline-block; margin-top: 5px; padding: 10px 20px; background: ${emailColors.success}; color: ${emailColors.onPrimary} !important; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .tracking-link:hover { background: ${emailColors.successStrong}; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table thead { background: ${emailColors.panelBackground}; }
    .items-table th { padding: 12px; text-align: left; font-weight: 600; color: ${emailColors.textMuted}; border-bottom: 2px solid ${emailColors.border}; }
    .items-table td { padding: 12px; border-bottom: 1px solid ${emailColors.border}; }
    .items-table tbody tr:last-child td { border-bottom: none; }
    .items-table .quantity { text-align: center; }
    .address-box { background: ${emailColors.panelBackground}; border-left: 4px solid ${emailColors.primary}; padding: 20px; margin: 30px 0; border-radius: 4px; }
    .address-box h2 { margin: 0 0 15px 0; font-size: 20px; color: ${emailColors.text}; }
    .address-content { color: ${emailColors.text}; line-height: 1.8; }
    .support-box { background: ${emailColors.warningBackground}; border-left: 4px solid ${emailColors.warning}; padding: 20px; margin: 30px 0; border-radius: 4px; }
    .support-box p { margin: 0; color: ${emailColors.warningText}; }
    .footer { background: ${emailColors.panelBackground}; padding: 30px; text-align: center; color: ${emailColors.textMuted}; font-size: 14px; }
    .footer-message { margin-bottom: 15px; }
    .organization { font-weight: 600; color: ${emailColors.success}; }
`.trim();

/**
 * Build order shipped email template with locale-specific text
 */
export function buildOrderShippedTemplate(texts: OrderShippedTexts): string {
  return `<!DOCTYPE html>
<html lang="${texts.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${ORDER_SHIPPED_STYLES}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">📦</div>
      <h1>${texts.headerTitle}</h1>
    </div>
    <div class="content">
      <div class="greeting">${texts.greeting}</div>
      <div class="message">
        ${texts.shippedMessage}
      </div>

      <div class="shipment-box">
        <h2>🚚 ${texts.shipmentDetailsTitle}</h2>
        <ul class="shipment-details">
          <li>
            <span class="label">${texts.orderNumberLabel}:</span>
            <span class="value">#{{orderId}}</span>
          </li>
          {{#if trackingNumber}}
          <li>
            <span class="label">${texts.trackingNumberLabel}:</span>
            <span class="value">{{trackingNumber}}</span>
          </li>
          {{/if}}
          {{#if estimatedDelivery}}
          <li>
            <span class="label">${texts.estimatedDeliveryLabel}:</span>
            <span class="value">{{estimatedDelivery}}</span>
          </li>
          {{/if}}
        </ul>
        {{#if trackingUrl}}
        <div style="text-align: center; margin-top: 20px;">
          <a href="{{trackingUrl}}" class="tracking-link">${texts.trackingUrlLabel} →</a>
        </div>
        {{/if}}
      </div>

      {{#if items}}
      <div class="shipment-box">
        <h2>📋 ${texts.shippedProductsTitle}</h2>
        <table class="items-table">
          <thead>
            <tr>
              <th>${texts.productColumn}</th>
              <th class="quantity">${texts.quantityColumn}</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{this.name}}</td>
              <td class="quantity">{{this.quantity}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>
      {{/if}}

      {{#if shippingAddress}}
      <div class="address-box">
        <h2>📍 ${texts.shippingAddressTitle}</h2>
        <div class="address-content">
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

      <div class="support-box">
        <p>${texts.supportMessage}</p>
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
