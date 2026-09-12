# Flyer Generator

Automated A5 flyer generator for the next 3 upcoming events.

## Usage

```bash
npm run generate-flyer
```

**Output:**
- `generated/flyer-latest.pdf` - 2-page PDF (page 1: flyer-front.jpg, page 2: generated flyer)
- `generated/flyer-latest.jpg` - Generated flyer only (for web/social)

## Editing

### Event Titles & Descriptions
Edit `flyer-events.json` to customize titles and descriptions for the flyer
(descriptions max ~25 words). Both maps are keyed by the **full title from
`events.json`** and fall back to it if not defined:

```json
{
  "event-titles": {
    "Lauter Luisen – Katertage": "Lauter Luisen"
  },
  "event-descriptions": {
    "Event Title": "Short description with artist names."
  }
}
```

Use `event-titles` when a title is too long for one flyer line — typically by
dropping the programme name after the dash.

### Design (CSS)
1. Open `flyer-preview.html` in browser
2. Edit `flyer-styles.css`
3. Refresh browser to see changes
4. Run `npm run generate-flyer` to export

## Files

- `flyer-events.json` - Event descriptions
- `flyer-styles.css` - Design/layout
- `flyer-preview.html` - Browser preview
- `flyerbottom.png` - Static footer
- `generated/flyer-front.jpg` - Front page (PDF page 1)
- `generated/flyer-latest.pdf` - 2-page PDF output
- `generated/flyer-latest.jpg` - Flyer JPG output
