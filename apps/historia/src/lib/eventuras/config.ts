/**
 * Where the Eventuras event API and site are, from the environment. The block
 * that lists events is on only when both are set, so a site without Eventuras
 * never shows it.
 */
export function getEventurasEnv() {
  const apiUrl = process.env.EVENTURAS_API_URL ?? '';
  const siteUrl = process.env.EVENTURAS_SITE_URL ?? '';
  const organizationId = Number(process.env.EVENTURAS_ORGANIZATION_ID);

  return {
    enabled: apiUrl !== '' && siteUrl !== '',
    apiUrl,
    siteUrl,
    organizationId:
      Number.isInteger(organizationId) && organizationId > 0 ? organizationId : undefined,
  };
}
