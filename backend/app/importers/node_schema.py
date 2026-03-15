"""
Semantischer Node-Baum: Schema-Definition.
Bildet HTML-Strukturen auf abstrakte, tag-basierte Node-Typen ab.
Der Node-Baum ist transient (nie in DB, nie in API-Response).
"""
from enum import Enum
from typing import Any

from pydantic import BaseModel, model_validator


class NodeType(str, Enum):
    PAGE = "page"
    SECTION = "section"
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    LIST = "list"
    IMAGE = "image"
    FIGURE = "figure"
    VIDEO = "video"
    IFRAME = "iframe"
    LINK = "link"
    BUTTON = "button"
    FORM = "form"
    INPUT = "input"
    DETAILS = "details"
    TABLE = "table"
    TABLE_ROW = "table_row"
    TABLE_CELL = "table_cell"
    GROUP = "group"
    GRID = "grid"


# Erlaubte Kinder-Typen pro NodeType
VALID_CHILDREN: dict[NodeType, set[NodeType] | None] = {
    NodeType.PAGE: {NodeType.SECTION, NodeType.GROUP, NodeType.HEADING, NodeType.GRID},
    NodeType.SECTION: None,  # None = alle erlaubt
    NodeType.HEADING: set(),  # Leaf
    NodeType.PARAGRAPH: {NodeType.LINK, NodeType.IMAGE},
    NodeType.LIST: {NodeType.PARAGRAPH, NodeType.LINK},
    NodeType.IMAGE: set(),
    NodeType.FIGURE: {NodeType.IMAGE, NodeType.PARAGRAPH},
    NodeType.VIDEO: set(),
    NodeType.IFRAME: set(),
    NodeType.LINK: {NodeType.IMAGE, NodeType.PARAGRAPH},
    NodeType.BUTTON: set(),
    NodeType.FORM: {NodeType.INPUT, NodeType.BUTTON, NodeType.PARAGRAPH, NodeType.GROUP},
    NodeType.INPUT: set(),
    NodeType.DETAILS: {NodeType.HEADING, NodeType.PARAGRAPH, NodeType.LIST, NodeType.GROUP},
    NodeType.TABLE: {NodeType.TABLE_ROW},
    NodeType.TABLE_ROW: {NodeType.TABLE_CELL},
    NodeType.TABLE_CELL: {NodeType.PARAGRAPH, NodeType.LINK, NodeType.IMAGE},
    NodeType.GROUP: None,
    NodeType.GRID: None,
}


class Node(BaseModel):
    type: NodeType
    children: list["Node"] = []
    props: dict[str, Any] = {}

    @model_validator(mode="after")
    def validate_children(self) -> "Node":
        allowed = VALID_CHILDREN.get(self.type)
        if allowed is None:
            return self
        for child in self.children:
            if child.type not in allowed:
                raise ValueError(
                    f"{self.type.value} darf kein Kind vom Typ "
                    f"{child.type.value} haben"
                )
        return self

    def find_all(self, node_type: NodeType) -> list["Node"]:
        """Alle Nachkommen eines bestimmten Typs finden."""
        result: list[Node] = []
        for child in self.children:
            if child.type == node_type:
                result.append(child)
            result.extend(child.find_all(node_type))
        return result

    def has_child_type(self, node_type: NodeType) -> bool:
        """Prüft ob ein direktes Kind des Typs existiert."""
        return any(c.type == node_type for c in self.children)

    def count_children(self, node_type: NodeType) -> int:
        """Zählt direkte Kinder eines Typs."""
        return sum(1 for c in self.children if c.type == node_type)
