from pydantic import BaseModel, Field


class HeroData(BaseModel):
    h1: str = ""
    subline: str = ""
    imageId: int | None = None
    ctaPrimary: dict | None = None
    ctaSecondary: dict | None = None


class RichTextData(BaseModel):
    title: str = ""
    content: str = ""


class ImageData(BaseModel):
    imageId: int | None = None
    alt: str = ""
    caption: str = ""
    link: str = ""


class GalleryData(BaseModel):
    title: str = ""
    images: list[dict] = Field(default_factory=list)
    layout: str = "grid"


class CardsData(BaseModel):
    title: str = ""
    items: list[dict] = Field(default_factory=list)


class CtaData(BaseModel):
    title: str = ""
    text: str = ""
    buttonLabel: str = ""
    buttonHref: str = ""
    variant: str = "primary"


class FaqData(BaseModel):
    title: str = ""
    items: list[dict] = Field(default_factory=list)


class NewsletterData(BaseModel):
    title: str = ""
    subtitle: str = ""


# === L24: Universelle Block-Typen ===


class VideoData(BaseModel):
    url: str = ""
    title: str = ""
    autoplay: bool = False
    muted: bool = False
    aspectRatio: str = "16:9"
    poster: str = ""


class EmbedData(BaseModel):
    html: str = ""
    url: str = ""
    maxWidth: str = "100%"
    aspectRatio: str = ""


class MapData(BaseModel):
    lat: float = 0
    lng: float = 0
    zoom: int = 14
    height: str = "400px"
    provider: str = "osm"
    address: str = ""
    markerLabel: str = ""


class FormData(BaseModel):
    title: str = ""
    fields: list[dict] = Field(default_factory=list)
    submitLabel: str = "Absenden"
    successMessage: str = "Vielen Dank für Ihre Nachricht!"
    recipientEmail: str = ""
    subject: str = "Kontaktanfrage"


class SpacerData(BaseModel):
    height: str = "48px"
    showDivider: bool = False
    dividerStyle: str = "solid"
    dividerColor: str = "#e5e7eb"
    dividerWidth: str = "100%"


class TabsData(BaseModel):
    title: str = ""
    tabs: list[dict] = Field(default_factory=list)
    defaultTab: int = 0
    variant: str = "default"


class TableData(BaseModel):
    title: str = ""
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)
    striped: bool = True
    responsive: bool = True
    caption: str = ""


class TestimonialsData(BaseModel):
    title: str = ""
    items: list[dict] = Field(default_factory=list)
    layout: str = "grid"
    columns: int = 3


class TeamData(BaseModel):
    title: str = ""
    members: list[dict] = Field(default_factory=list)
    columns: int = 4
    showBio: bool = False


class LogoSliderData(BaseModel):
    title: str = ""
    logos: list[dict] = Field(default_factory=list)
    autoplay: bool = True
    speed: int = 3000
    grayscale: bool = True


class CounterData(BaseModel):
    title: str = ""
    items: list[dict] = Field(default_factory=list)
    animated: bool = True
    columns: int = 4


class SocialLinksData(BaseModel):
    title: str = ""
    links: list[dict] = Field(default_factory=list)
    variant: str = "icons"
    size: str = "md"
    alignment: str = "center"


BLOCK_TYPE_REGISTRY = {
    "hero": {"label": "Hero Banner", "schema": HeroData},
    "richText": {"label": "Rich Text", "schema": RichTextData},
    "image": {"label": "Bild", "schema": ImageData},
    "gallery": {"label": "Galerie", "schema": GalleryData},
    "cards": {"label": "Karten", "schema": CardsData},
    "cta": {"label": "Call to Action", "schema": CtaData},
    "faq": {"label": "FAQ", "schema": FaqData},
    "newsletter": {"label": "Newsletter", "schema": NewsletterData},
    # L24: Universelle Block-Typen
    "video": {"label": "Video", "schema": VideoData},
    "embed": {"label": "Embed", "schema": EmbedData},
    "map": {"label": "Karte", "schema": MapData},
    "form": {"label": "Formular", "schema": FormData},
    "spacer": {"label": "Abstand/Trennlinie", "schema": SpacerData},
    "tabs": {"label": "Tabs", "schema": TabsData},
    "table": {"label": "Tabelle", "schema": TableData},
    "testimonials": {"label": "Kundenstimmen", "schema": TestimonialsData},
    "team": {"label": "Team", "schema": TeamData},
    "logoSlider": {"label": "Logo-Slider", "schema": LogoSliderData},
    "counter": {"label": "Zähler/Statistiken", "schema": CounterData},
    "socialLinks": {"label": "Social Links", "schema": SocialLinksData},
}
