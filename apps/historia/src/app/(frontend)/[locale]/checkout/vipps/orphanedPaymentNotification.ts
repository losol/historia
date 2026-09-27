'use server';

import {
  actionError,
  actionSuccess,
  type ServerActionResult,
} from '@eventuras/core-nextjs/actions';
import { Logger } from '@eventuras/logger';
import { notitiaTemplates } from '@eventuras/notitia-templates';
import { getPayload } from 'payload';
import { reportCritical } from '@/lib/observability/reportCritical';
import { getCurrentWebsiteId } from '@/lib/website';
import config from '@/payload.config';
import type { Website } from '@/payload-types';

const logger = Logger.create({
  namespace: 'historia:checkout:vipps',
  context: { module: 'orphanedPaymentNotification' },
});

interface OrphanedPaymentDetails {
  websiteId?: string;
  paymentReference: string;
  customerEmail?: string;
  amount: number;
  currency: string;
  paymentState: string;
}

/**
 * Create business event and send email notification for orphaned payment
 *
 * This is called when a payment is authorized in Vipps but the cart is unavailable
 * in the session (e.g., cross-domain session issue). It creates a business event
 * for tracking and sends an email to sales contacts for manual intervention.
 *
 * @param details - Details about the orphaned payment
 * @param details.websiteId - Optional website/tenant ID. If not provided, will attempt to detect from request headers
 * @returns Success or error result
 */
export async function notifyOrphanedPayment(
  details: OrphanedPaymentDetails,
): Promise<ServerActionResult<void>> {
  try {
    const {
      websiteId: providedWebsiteId,
      paymentReference,
      customerEmail,
      amount,
      currency,
      paymentState,
    } = details;

    logger.info(
      { paymentReference, customerEmail, amount },
      'Creating orphaned payment notification',
    );

    const payload = await getPayload({ config });

    // One alert per payment. The return page (on every load), its client fallback and
    // the webhook can all get here for the same payment; staff needs to hear once.
    const alreadyNotified = await payload.find({
      collection: 'business-events',
      where: {
        and: [
          { eventType: { equals: 'payment.orphaned' } },
          { externalReference: { equals: paymentReference } },
        ],
      },
      limit: 1,
      depth: 0,
    });
    if (alreadyNotified.docs.length > 0) {
      logger.info({ paymentReference }, 'Orphaned payment already reported - not notifying again');
      return actionSuccess(undefined);
    }

    // Create business event for tracking
    await payload.create({
      collection: 'business-events',
      data: {
        eventType: 'payment.orphaned',
        source: 'vipps',
        externalReference: paymentReference,
        data: {
          reference: paymentReference,
          customerEmail,
          amount,
          currency,
          paymentState,
          timestamp: new Date().toISOString(),
          reason: 'cart_unavailable_session_mismatch',
          requiresManualIntervention: true,
        },
      },
    });

    logger.info({ paymentReference }, 'Business event created for orphaned payment');

    // The website the payment was made on: as given, else the cart's, else the host's.
    // In the webhook the host is the webhook's, not the shop's.
    let websiteId: string | null = providedWebsiteId ?? null;
    if (!websiteId) {
      const carts = await payload.find({
        collection: 'carts',
        where: { paymentReference: { equals: paymentReference } },
        limit: 1,
        depth: 0,
      });
      const tenant = carts.docs[0]?.tenant;
      websiteId = (typeof tenant === 'object' ? tenant?.id : tenant) ?? null;
    }
    if (!websiteId) {
      websiteId = await getCurrentWebsiteId().catch((error: unknown) => {
        logger.error({ error, paymentReference }, 'Could not resolve website from host');
        return null;
      });
    }

    if (!websiteId) {
      reportCritical(logger, 'Orphaned payment: no website found - sales team not notified', {
        area: 'checkout',
        paymentReference,
        amount,
        currency,
        paymentState,
      });
      return actionError('Cannot determine website/tenant - notification not sent');
    }

    const website = (await payload.findByID({
      collection: 'websites',
      id: websiteId,
      depth: 2, // Populate user relationship in contactPoints
    })) as Website;

    // Get sales contact emails. The Websites afterRead hook strips everything but the
    // names from contact users, so each user is read on its own for the email.
    const salesEmails: string[] = [];
    for (const contact of website.contactPoints ?? []) {
      if (contact.contactType !== 'sales' || !contact.user) continue;
      const userId = typeof contact.user === 'object' ? contact.user.id : contact.user;
      try {
        const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 });
        if (user?.email) salesEmails.push(user.email);
      } catch (error) {
        logger.error({ error, paymentReference, userId }, 'Could not read sales contact user');
      }
    }

    if (salesEmails.length === 0) {
      reportCritical(
        logger,
        'Orphaned payment: website has no sales contact with an email - nobody notified',
        { area: 'checkout', paymentReference, websiteId, amount, currency, paymentState },
      );
      return actionSuccess(undefined);
    }

    // Prepare email template data
    const locale =
      (process.env.NEXT_PUBLIC_CMS_DEFAULT_LOCALE || 'no') === 'no' ? 'nb-NO' : 'en-US';
    const amountFormatted = (amount / 100).toFixed(2);
    const timestamp = new Date().toLocaleString(locale);

    const templateData = {
      paymentReference,
      customerEmail: customerEmail || 'Ikke tilgjengelig',
      amount: amountFormatted,
      currency,
      paymentState,
      timestamp,
      organizationName: website.title || 'Historia',
      actionRequired: 'Opprett ordre manuelt i admin-panel basert på betalingsreferanse',
      vippsApiLink: `Vipps API: epayment/${paymentReference}`,
    };

    // Render email using template
    const emailHtml = notitiaTemplates.render('email', 'orphaned-payment-alert', templateData, {
      locale,
    });

    // Send email to all sales contacts
    let sent = 0;
    for (const email of salesEmails) {
      try {
        await payload.sendEmail({
          to: email,
          subject: `⚠️ KRITISK: Betaling godkjent uten ordre - ${paymentReference}`,
          html: emailHtml,
        });

        sent += 1;
        logger.info(
          { paymentReference, recipient: email },
          'Orphaned payment notification sent to sales contact',
        );
      } catch (emailError) {
        logger.error(
          { paymentReference, recipient: email, error: emailError },
          'Failed to send orphaned payment notification email',
        );
      }
    }

    if (sent === 0) {
      reportCritical(
        logger,
        'Orphaned payment: every notification email failed - nobody notified',
        { area: 'checkout', paymentReference, websiteId, recipientCount: salesEmails.length },
      );
    } else {
      logger.info(
        { paymentReference, sent, recipientCount: salesEmails.length },
        'Orphaned payment notifications sent',
      );
    }

    return actionSuccess(undefined);
  } catch (error) {
    logger.error(
      { paymentReference: details.paymentReference, error },
      'Failed to create orphaned payment notification',
    );

    return actionError(error instanceof Error ? error.message : 'Failed to create notification');
  }
}
