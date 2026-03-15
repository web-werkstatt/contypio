import type { CollectionSchema, CollectionItem } from '@/types/cms';
import DynamicForm from '@/components/collections/DynamicForm';

interface Props {
  schema: CollectionSchema;
  item: CollectionItem | null;
  collectionKey: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function CollectionFormModal({ schema, item, collectionKey, onClose, onSaved }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-auto p-5">
        <DynamicForm
          schema={schema}
          item={item}
          collectionKey={collectionKey}
          onSaved={() => { onSaved(); onClose(); }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
