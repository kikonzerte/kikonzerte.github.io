# Konzertarchiv Data Management

This directory contains JSON files for the concert archive system.

## Current Status

**Total Seasons:** 5 (21/22 through 25/26)
**Total Concerts:** 46 concerts across all seasons
- Season 25/26: 3 concerts
- Season 24/25: 9 concerts  
- Season 23/24: 16 concerts (10 regular + 6 in Jubiläums-Festival)
- Season 22/23: 11 concerts
- Season 21/22: 7 concerts

## File Structure

- `archive-seasons.json` - Master file listing all available seasons
- `archive-XX-XX.json` - Individual season files (e.g., `archive-25-26.json`)
- `archive-template.json` - Template for creating new season files
- `README.md` - This file

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
   - Add concert images with naming format: `YY-MM-DD.jpg` (e.g., `26-10-15.jpg`)

4. **Deploy:**
   - That's it! The page will automatically load the new season.

## Image Naming Convention

Images should be named using the date format: `YY-MM-DD.jpg`

Examples:
- `25-11-30.jpg` → Concert on November 30, 2025
- `24-09-29.jpg` → Concert on September 29, 2024
- `23-11-25-2.jpg` → Second concert on November 25, 2023 (use suffixes for multiple events on same day)

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

- Dates should be in format: `DD.MM.YYYY`
- For multi-day events, use format: `DD./DD.MM.YYYY` (e.g., `28./29.10.2023`)
- Images should be organized by season in subdirectories
- Special events appear with dark grey background (#333) and orange borders
- Concerts are displayed newest first (reverse chronological order)
- The subtitle field is optional and appears in italics below the title

## Maintenance Tips

- Keep image file sizes reasonable (< 500KB recommended)
- Use consistent image dimensions where possible
- JPG format is preferred for photos
- PNG is acceptable for images with transparency or text
- Always validate JSON syntax after editing (use a JSON validator)
