import type { Field } from 'payload';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The event in another system that this happening is about, so the two can be
 * matched: for now the Eventuras event by its uuid. Unset for happenings that
 * only live here.
 */
export const externalEvent: Field = {
  name: 'externalEvent',
  type: 'group',
  admin: {
    description: 'The same event in another system, such as Eventuras.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'system',
          type: 'select',
          options: [{ label: 'Eventuras', value: 'eventuras' }],
          admin: { width: '40%' },
        },
        {
          name: 'uuid',
          type: 'text',
          index: true,
          admin: { width: '60%', placeholder: 'e.g. 2f1c4c8e-6a7b-4e2c-9d3f-1a2b3c4d5e6f' },
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData: unknown },
          ) => {
            const system = (siblingData as { system?: string | null } | undefined)?.system;
            if (!value) return system ? 'Enter the uuid of the event in the chosen system.' : true;
            if (!UUID.test(value))
              return 'Enter a uuid, such as 2f1c4c8e-6a7b-4e2c-9d3f-1a2b3c4d5e6f.';
            if (!system) return 'Choose which system the uuid belongs to.';
            return true;
          },
        },
      ],
    },
  ],
};
