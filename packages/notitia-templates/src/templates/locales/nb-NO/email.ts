import type { TemplateRegistry } from '../../../types';
import { buildOrderShippedTemplate } from '../../utils/orderShippedBuilder';
import { buildOrderStatusTemplate } from '../../utils/orderStatusBuilder';

/**
 * Norwegian Bokmål email templates
 */
export const emailTemplatesNbNO: TemplateRegistry = {
  'email:welcome': {
    subject: 'Velkommen til {{organizationName}}',
    content: `Hei {{name}},

Velkommen til {{organizationName}}! Vi er glade for at du blir med i vårt fellesskap.

{{#if loginUrl}}
Du kan logge inn på kontoen din her: {{loginUrl}}
{{/if}}

Beste hilsen,
{{organizationName}}-teamet`,
    description: 'Velkomst-e-post for nye brukere (nb-NO)',
  },

  'email:registration-confirmation': {
    subject: 'Påmelding bekreftet - {{eventTitle}}',
    content: `Hei {{name}},

Din påmelding til {{eventTitle}} er bekreftet!

Arrangement detaljer:
- Dato: {{eventDate}}
- Sted: {{eventLocation}}
{{#if eventDescription}}
- Beskrivelse: {{eventDescription}}
{{/if}}

{{#if registrationId}}
Påmeldings-ID: {{registrationId}}
{{/if}}

Vi gleder oss til å se deg der!

Beste hilsen,
{{organizationName}}-teamet`,
    description: 'Bekreftelse på arrangementspåmelding (nb-NO)',
  },

  'email:event-reminder': {
    subject: 'Påminnelse: {{eventTitle}} nærmer seg!',
    content: `Hei {{name}},

Dette er en påminnelse om at {{eventTitle}} nærmer seg!

Arrangement detaljer:
- Dato: {{eventDate}}
- Sted: {{eventLocation}}
{{#if eventUrl}}
- Mer informasjon: {{eventUrl}}
{{/if}}

Vi gleder oss til å se deg der!

Beste hilsen,
{{organizationName}}-teamet`,
    description: 'Påminnelse om arrangement (nb-NO)',
  },

  'email:payment-confirmation': {
    subject: 'Betalingsbekreftelse - Ordre #{{orderId}}',
    content: `Hei {{name}},

Takk for din betaling!

Betalingsdetaljer:
- Ordre-ID: {{orderId}}
- Beløp: {{amount}} {{currency}}
- Betalingsmåte: {{paymentMethod}}
{{#if transactionId}}
- Transaksjons-ID: {{transactionId}}
{{/if}}

{{#if receiptUrl}}
Du kan se kvitteringen din her: {{receiptUrl}}
{{/if}}

Beste hilsen,
{{organizationName}}-teamet`,
    description: 'Bekreftelse på betaling (nb-NO)',
  },

  'email:password-reset': {
    subject: 'Forespørsel om tilbakestilling av passord',
    content: `Hei {{name}},

Vi har mottatt en forespørsel om å tilbakestille passordet ditt.

{{#if resetUrl}}
For å tilbakestille passordet ditt, klikk på følgende lenke:
{{resetUrl}}

Denne lenken utløper om {{expirationHours}} timer.
{{/if}}

Hvis du ikke har bedt om tilbakestilling av passord, kan du ignorere denne e-posten.

Beste hilsen,
{{organizationName}}-teamet`,
    description: 'E-post for tilbakestilling av passord (nb-NO)',
  },

  'email:order-received': {
    subject: 'Bestilling mottatt - #{{orderId}}',
    content: buildOrderStatusTemplate({
      copyBanner: 'KOPI - Intern kopi av kundebekreftelse',
      headerTitle: 'Bestilling mottatt',
      greeting: 'Hei {{name}}! 👋',
      thankYouMessage:
        'Takk for din bestilling! Vi har mottatt ordren din og vil behandle den så snart som mulig.',
      orderDetailsTitle: 'Ordredetaljer',
      orderNumberLabel: 'Ordrenummer',
      orderDateLabel: 'Ordredato',
      customerEmailLabel: 'Kunde e-post',
      customerPhoneLabel: 'Telefon',
      orderedProductsTitle: 'Bestilte produkter',
      productColumn: 'Produkt',
      quantityColumn: 'Antall',
      priceColumn: 'Pris',
      sumColumn: 'Sum',
      totalLabel: 'Totalt (inkl. mva)',
      totalLabelTaxExempt: 'Totalt (MVA-fritatt)',
      taxExemptLabel: 'MVA-fritatt',
      taxExemptReasonLabel: 'Årsak',
      shippingAddressTitle: 'Leveringsadresse',
      trackingNumberLabel: 'Sporingsnummer',
      shippingNotification:
        'Vi vil sende deg en e-post når ordren din er bekreftet og klar for behandling.',
      footerClosing: 'Med vennlig hilsen',
    }),
    description: 'Bekreftelse på mottatt bestilling (nb-NO)',
  },

  'email:order-confirmation': {
    subject: 'Ordrebekreftelse - #{{orderId}}',
    content: buildOrderStatusTemplate({
      copyBanner: 'KOPI - Intern kopi av kundebekreftelse',
      headerTitle: 'Ordrebekreftelse',
      greeting: 'Hei {{name}}! 👋',
      thankYouMessage:
        'Din betaling er nå bekreftet og ordren din er under behandling. Vi begynner å pakke varene dine snarest.',
      orderDetailsTitle: 'Ordredetaljer',
      orderNumberLabel: 'Ordrenummer',
      orderDateLabel: 'Ordredato',
      customerEmailLabel: 'Kunde e-post',
      customerPhoneLabel: 'Telefon',
      orderedProductsTitle: 'Bestilte produkter',
      productColumn: 'Produkt',
      quantityColumn: 'Antall',
      priceColumn: 'Pris',
      sumColumn: 'Sum',
      totalLabel: 'Totalt (inkl. mva)',
      totalLabelTaxExempt: 'Totalt (MVA-fritatt)',
      taxExemptLabel: 'MVA-fritatt',
      taxExemptReasonLabel: 'Årsak',
      shippingAddressTitle: 'Leveringsadresse',
      trackingNumberLabel: 'Sporingsnummer',
      shippingNotification: 'Vi vil sende deg en e-post når ordren din er sendt.',
      footerClosing: 'Med vennlig hilsen',
    }),
    description: 'Bekreftelse på bestilling etter betaling (nb-NO)',
  },

  'email:order-shipped': {
    subject: 'Din ordre er sendt - #{{orderId}}',
    content: buildOrderShippedTemplate({
      headerTitle: 'Ordren din er sendt! 🎉',
      greeting: 'Hei {{name}}! 👋',
      shippedMessage:
        'Gode nyheter! Din ordre har blitt sendt og er nå på vei til deg. Du kan følge med på leveringen med informasjonen nedenfor.',
      shipmentDetailsTitle: 'Sendingsdetaljer',
      orderNumberLabel: 'Ordrenummer',
      trackingNumberLabel: 'Sporingsnummer',
      trackingUrlLabel: 'Spor pakken din',
      estimatedDeliveryLabel: 'Estimert levering',
      shippedProductsTitle: 'Sendte produkter',
      productColumn: 'Produkt',
      quantityColumn: 'Antall',
      shippingAddressTitle: 'Leveringsadresse',
      supportMessage: '💬 Spørsmål om din levering? Svar på denne e-posten så hjelper vi deg.',
      footerClosing: 'Med vennlig hilsen',
    }),
    description: 'Varsel om sending av ordre (nb-NO)',
  },

  'email:otp-login': {
    subject: '{{appName}} - Din innloggingskode',
    content: `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Din innloggingskode</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">{{appName}} - Innloggingskode</h1>
    </div>
    <div style="padding: 40px 32px; text-align: center;">
      <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
        Din engangs innloggingskode er:
      </p>
      <div style="background-color: #f7fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 32px 0;">
        <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2d3748; font-family: 'Courier New', monospace;">
          {{code}}
        </div>
        <p style="color: #718096; font-size: 14px; margin-top: 16px;">
          Denne koden utløper om {{expiresInMinutes}} minutter.
        </p>
      </div>
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; text-align: left;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          Hvis du ikke ba om denne koden, kan du trygt ignorere denne e-posten.
        </p>
      </div>
    </div>
    <div style="background-color: #f7fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #a0aec0; font-size: 12px;">
        Dette er en automatisk melding, vennligst ikke svar.
      </p>
      <p style="margin: 8px 0 0 0; color: #a0aec0; font-size: 12px;">
        &copy; {{year}} {{appName}}
      </p>
    </div>
  </div>
</body>
</html>`,
    description: 'OTP innloggingskode e-post (nb-NO)',
  },
};
