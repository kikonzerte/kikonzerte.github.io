# Konzertarchiv Data Management

This directory contains JSON files for the concert archive system.

## File Structure

- `archive-seasons.json` - Master file listing all available seasons
- `archive-XX-XX.json` - Individual season files (e.g., `archive-25-26.json`)
- `archive-template.json` - Template for creating new season files

## Adding a New Season

1. **Create the season JSON file:**
   - Copy `archive-template.json`
   - Rename to `archive-XX-XX.json` (e.g., `archive-26-27.json`)
   - Update the season, displayName, and add concerts

2. **Update archive-seasons.json:**
   - Add new season to the `seasons` array at the TOP (newest first)
   - Update `currentSeason` field to the new season ID

3. **Add images:**
   - Create directory: `assets/img/archive/XX-XX/`
   - Add concert images with naming format: `YY-MM-DD.jpg`

4. **Deploy:**
   - The page will automatically load the new season.

## JSON Structure

### Regular Concert
```json
{
  "date": "30.11.2025",
  "title": "Artist Name",
  "image": "assets/img/archive/25-26/25-11-30.jpg"
}
```

### Concert with Subtitle
```json
{
  "date": "26.11.2023",
  "title": "Abschlusskonzert",
  "subtitle": "Trio Varga",
  "image": "assets/img/archive/23-24/23-11-26.jpg"
}
```

### Special Event Section (e.g., Festival)
```json
{
  "title": "JUBILÄUMS-FESTIVAL",
  "concerts": [
    {
      "date": "26.11.2023",
      "title": "Concert 1",
      "image": "path/to/image.jpg"
    },
    {
      "date": "25.11.2023",
      "title": "Concert 2",
      "image": "path/to/image.jpg"
    }
  ]
}
```

## Notes

- For multi-day events, use format: `DD./DD.MM.YYYY` (e.g., `28./29.10.2023`)
- Images should be organized by season in subdirectories
- Special events appear with dark grey background (#333) and orange borders
- Concerts are displayed newest first (reverse chronological order)
- The subtitle field is optional and appears in italics below the title
