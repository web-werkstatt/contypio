import type { Block } from '@/types/cms';
import HeroBlockEditor from './editors/HeroBlockEditor';
import RichTextBlockEditor from './editors/RichTextBlockEditor';
import ImageBlockEditor from './editors/ImageBlockEditor';
import GalleryBlockEditor from './editors/GalleryBlockEditor';
import CardsBlockEditor from './editors/CardsBlockEditor';
import CtaBlockEditor from './editors/CtaBlockEditor';
import FaqBlockEditor from './editors/FaqBlockEditor';
import NewsletterBlockEditor from './editors/NewsletterBlockEditor';
import FeaturedTripsEditor from './editors/FeaturedTripsEditor';
import TripListingEditor from './editors/TripListingEditor';
import DestinationTilesEditor from './editors/DestinationTilesEditor';
import InspirationTilesEditor from './editors/InspirationTilesEditor';
import TrustStripEditor from './editors/TrustStripEditor';
import HeroSliderEditor from './editors/HeroSliderEditor';
import MagazineTeaserEditor from './editors/MagazineTeaserEditor';
import VideoBlockEditor from './editors/VideoBlockEditor';
import EmbedBlockEditor from './editors/EmbedBlockEditor';
import SpacerBlockEditor from './editors/SpacerBlockEditor';
import MapBlockEditor from './editors/MapBlockEditor';
import CounterBlockEditor from './editors/CounterBlockEditor';
import SocialLinksBlockEditor from './editors/SocialLinksBlockEditor';
import TestimonialsBlockEditor from './editors/TestimonialsBlockEditor';
import TeamBlockEditor from './editors/TeamBlockEditor';
import LogoSliderBlockEditor from './editors/LogoSliderBlockEditor';
import TabsBlockEditor from './editors/TabsBlockEditor';
import TableBlockEditor from './editors/TableBlockEditor';
import FormBlockEditor from './editors/FormBlockEditor';
import GenericBlockEditor from './editors/GenericBlockEditor';

interface Props {
  block: Block;
  onChange(data: Record<string, unknown>): void;
}

const EDITORS: Record<string, React.ComponentType<{ data: Record<string, unknown>; onChange: (data: Record<string, unknown>) => void }>> = {
  hero: HeroBlockEditor,
  richText: RichTextBlockEditor,
  image: ImageBlockEditor,
  gallery: GalleryBlockEditor,
  cards: CardsBlockEditor,
  cta: CtaBlockEditor,
  faq: FaqBlockEditor,
  newsletter: NewsletterBlockEditor,
  featuredTrips: FeaturedTripsEditor,
  tripListing: TripListingEditor,
  destinationTiles: DestinationTilesEditor,
  inspirationTiles: InspirationTilesEditor,
  trustStrip: TrustStripEditor,
  heroSlider: HeroSliderEditor,
  magazineTeaser: MagazineTeaserEditor,
  video: VideoBlockEditor,
  embed: EmbedBlockEditor,
  spacer: SpacerBlockEditor,
  map: MapBlockEditor,
  counter: CounterBlockEditor,
  socialLinks: SocialLinksBlockEditor,
  testimonials: TestimonialsBlockEditor,
  team: TeamBlockEditor,
  logoSlider: LogoSliderBlockEditor,
  tabs: TabsBlockEditor,
  table: TableBlockEditor,
  form: FormBlockEditor,
};

export default function BlockEditor({ block, onChange }: Props) {
  const Editor = EDITORS[block.blockType];
  if (!Editor) {
    // Fallback: Generischer JSON-Editor fuer neue Block-Typen (L24)
    return <GenericBlockEditor data={block.data} onChange={onChange} blockType={block.blockType} />;
  }
  return <Editor data={block.data} onChange={onChange} />;
}
