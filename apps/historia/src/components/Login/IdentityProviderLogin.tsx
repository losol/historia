import type React from 'react';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { PayloadLogo } from '@payloadcms/ui/shared';
import { redirect } from 'next/navigation';
import type { AdminViewServerProps } from 'payload';
import { getSafeRedirect } from 'payload/shared';

/**
 * Payload's login view without the email and password form: the logo and the
 * beforeLogin and afterLogin components, which is where the identity provider
 * buttons are. No "forgot password" link, since that goes with the form.
 */
export const IdentityProviderLogin: React.FC<AdminViewServerProps> = ({
  initPageResult,
  params,
  searchParams,
}) => {
  const { locale, permissions, req } = initPageResult;
  const { i18n, payload, user } = req;
  const { admin, routes } = payload.config;

  if (user) {
    redirect(
      getSafeRedirect({ fallbackTo: routes.admin, redirectTo: searchParams?.redirect ?? '' }),
    );
  }

  const serverProps = { i18n, locale, params, payload, permissions, searchParams, user };
  const { importMap } = payload;

  return (
    <>
      <div className="login__brand">
        {RenderServerComponent({
          Component: admin.components?.graphics?.Logo,
          Fallback: PayloadLogo,
          importMap,
          serverProps,
        })}
      </div>
      {RenderServerComponent({ Component: admin.components?.beforeLogin, importMap, serverProps })}
      {RenderServerComponent({ Component: admin.components?.afterLogin, importMap, serverProps })}
    </>
  );
};
