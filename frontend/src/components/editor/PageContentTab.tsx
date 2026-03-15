import type { UseSectionEditorReturn } from '@/hooks/useSectionEditor';
import SectionList from '@/components/sections/SectionList';

interface PageContentTabProps {
  editor: UseSectionEditorReturn;
  previewOpen: boolean;
  selectedBlockId: string | undefined;
  onSelectBlock: (sectionId: string, columnId: string, blockId: string) => void;
}

export default function PageContentTab({
  editor,
  previewOpen,
  selectedBlockId,
  onSelectBlock,
}: PageContentTabProps) {
  return (
    <div className={previewOpen ? '' : 'w-full'}>
      <SectionList
        editor={editor}
        mode="content"
        selectedBlockId={selectedBlockId}
        onSelectBlock={onSelectBlock}
      />
    </div>
  );
}
