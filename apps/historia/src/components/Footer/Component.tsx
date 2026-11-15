import { Footer as FooterUI } from '@eventuras/ratio-ui/core/Footer';
import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { accentuate } from '@/lib/displayTitle';
import { getAppearance } from '@/lib/site-settings/appearance';
import { getCurrentWebsiteId } from '@/lib/website';
import { FooterClient } from './Component.client';
import styles from './Footer.module.css';

// Force dynamic rendering to ensure headers are available
export const dynamic = 'force-dynamic';

export async function Footer() {
  const websiteId = await getCurrentWebsiteId();

  if (!websiteId) {
    return null;
  }

  const payload = await getPayload({ config: configPromise });
  const website = await payload.findByID({
    collection: 'websites',
    id: websiteId,
    depth: 2,
  });

  if (!website) {
    return null;
  }

  // Prepare publisher data
  const publisher =
    website.publisher && typeof website.publisher === 'object'
      ? {
          name: website.publisher.name,
          organizationNumber: website.publisher.organizationNumber || undefined,
          address: website.publisher.address?.addressLine1 || website.publisher.address?.city || '',
          phone: website.publisher.phone || '',
          email: website.publisher.email || '',
        }
      : undefined;

  if (getAppearance(website).footer === 'display') {
    return (
      <FooterUI surface="dark">
        {website.title && <FooterUI.Brand display name={accentuate(website.title)} />}
        <div className={styles.columns}>
          {publisher && <FooterUI.Publisher publisher={publisher} />}
          <FooterClient navigation={website.siteSettings?.footer?.navigation} />
        </div>
      </FooterUI>
    );
  }

  return (
    <FooterUI.Classic siteTitle={website.title} publisher={publisher}>
      <FooterClient navigation={website.siteSettings?.footer?.navigation} />
    </FooterUI.Classic>
  );
}
