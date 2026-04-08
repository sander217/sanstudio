# Figma Export JSON Schema v0.2

Use this schema when generating the Figma export JSON in Gate 3 Step 13.

## Schema

```jsonc
{
  "schema_version": "0.2.0",
  "source": "design-agent-studio",
  "flow_name": "[name]",
  "flow_structure": "[linear|branching|state-based|multi-entry]",
  "viewport": "[mobile|desktop|both]",
  "export_scope": "[full|partial]",
  "partial_note": "[pending screens, if partial]",
  
  "design_system": {
    "name": "[name or ad-hoc]",
    "colors": {
      "primary": "#...",
      "secondary": "#...",
      "neutrals": ["#..."],
      "semantic": { "success": "#...", "warning": "#...", "error": "#...", "info": "#..." }
    },
    "typography": {
      "display": { "family": "...", "weight": 700, "size": 32, "lineHeight": 40 },
      "heading": { "family": "...", "weight": 600, "size": 24, "lineHeight": 32 },
      "body": { "family": "...", "weight": 400, "size": 16, "lineHeight": 24 },
      "caption": { "family": "...", "weight": 400, "size": 12, "lineHeight": 16 }
    },
    "spacing_base": 8,
    "radius": { "sm": 4, "md": 8, "lg": 12, "full": 9999 },
    "shadows": {
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.07)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)"
    }
  },

  "screens": [
    {
      "name": "[ScreenName]",
      "description": "[one-line]",
      "state": "[default|empty|error|loading]",
      "theme": "[light|dark]",
      "canvas": { "width": 375, "height": 812 },
      "nodes": [
        {
          "id": "node-id",
          "type": "FRAME|TEXT|RECTANGLE|ELLIPSE|IMAGE",
          "parentId": "parent-id or null",
          "name": "[FigmaLayerName]",
          "component_role": "[screen|header|card|button-primary|etc.]",
          "props": {
            "layoutSizingHorizontal": "FIXED|FILL|HUG",
            "layoutSizingVertical": "FIXED|FILL|HUG",
            "width": 200,
            "height": 44,
            "layoutMode": "HORIZONTAL|VERTICAL",
            "primaryAxisAlignItems": "MIN|CENTER|MAX|SPACE_BETWEEN",
            "counterAxisAlignItems": "MIN|CENTER|MAX",
            "paddingTop": 0, "paddingBottom": 0,
            "paddingLeft": 0, "paddingRight": 0,
            "itemSpacing": 0,
            "fills": [{ "type": "SOLID", "color": "#FFFFFF" }],
            "strokes": [{ "type": "SOLID", "color": "#E5E7EB" }],
            "strokeWeight": 1,
            "strokeAlign": "INSIDE|OUTSIDE|CENTER|BOTTOM",
            "cornerRadius": 8,
            "characters": "Text content",
            "fontSize": 16,
            "fontWeight": 400,
            "fontFamily": "Inter",
            "textAlignHorizontal": "LEFT|CENTER|RIGHT",
            "lineHeight": { "value": 24, "unit": "PIXELS" }
          }
        }
      ],
      "metadata": {
        "direction_name": "[from Gate 2 or evaluation]",
        "direction_type": "[MVP|IDEAL|CREATIVE|HYBRID|ITERATE|CRITIQUE_FIX]",
        "version": "v5",
        "technique_clusters": [
          {
            "name": "[cluster name from design-techniques-db]",
            "keywords": ["[matched keyword]"],
            "reason": "[why selected for this screen]"
          }
        ],
        "decisions_applied": [
          { "decision": "[what]", "gate": "G2", "status": "LOCKED" }
        ],
        "overrides": [
          { "original": "[locked decision]", "new": "[change]", "reason": "[why]" }
        ]
      }
    }
  ],

  "transitions": [
    {
      "from_screen": "[name]",
      "to_screen": "[name]",
      "trigger": "[action or event]",
      "animation": "[slide-left|fade|modal-rise|instant]",
      "duration_ms": 300,
      "data_carried": "[state transfers]"
    }
  ]
}
```

## Sizing Values

```
"layoutSizingHorizontal": "FIXED" | "FILL" | "HUG"
"layoutSizingVertical": "FIXED" | "FILL" | "HUG"

FIXED: explicit pixel value in width/height
FILL: stretch to fill parent container
HUG: shrink to fit contents
```
