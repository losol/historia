import type React from 'react';
import { List } from '@eventuras/ratio-ui/core/List';
import { Panel } from '@eventuras/ratio-ui/core/Panel';
import RichText from '@/components/RichText';
import type { ResourcesBlock as ResourcesBlockType } from '@/payload-types';

type ResourceItem = NonNullable<ResourcesBlockType['items']>[number];

export const ResourcesBlock: React.FC<ResourcesBlockType> = ({ title, description, items }) => {
  return (
    <Panel surface="card">
      <Panel.Header>
        <Panel.Title as="h3">{title}</Panel.Title>
      </Panel.Header>
      <Panel.Body>
        {description && <RichText data={description} />}
        <List variant="markdown">
          {items?.map((item: ResourceItem, index: number) => {
            const key = item.id ?? `${item.name ?? 'resource'}-${index}`;
            return (
              <List.Item key={key}>
                <strong>{item.name}</strong>
                {item.quantity && <> — {item.quantity}</>}
                {item.unit && <> {item.unit}</>}
                {item.description && <RichText data={item.description} />}
              </List.Item>
            );
          })}
        </List>
      </Panel.Body>
    </Panel>
  );
};
