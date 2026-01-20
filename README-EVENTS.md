# Event Management Guide

## Quick Start: Adding a New Event

### 1. Open `events.json`

### 2. Copy this template:

```json
{
  "title": "Your Event Title",
  "dateDisplay": "So, 29.03.26, 17:00",
  "artists": "Artist Name - Instrument",
  "description": "Event description.\n\nUse \\n\\n for paragraph breaks.",
  "footer": "Eintritt frei – Kollekte.\n\nAnmeldung empfohlen. Erstbesucher:innen für die Wegbeschreibung unbedingt anmelden!"
}
```

### 3. Paste into the `"upcoming"` array

### 4. Fill in your event details

### 5. Save the file

---

## Field Reference

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Event title | `"UN:VERBUNDEN"` |
| `dateDisplay` | Date in German format | `"So, 29.03.26, 17:00"` |
| `artists` | Performing artists | `"Elena Schneider - Mezzosopran"` |
| `description` | Event description | `"Description text..."` |
| `footer` | Pricing & registration info | `"Eintritt frei – Kollekte..."` |

### Optional Fields

| Field | Description | When to Use |
|-------|-------------|-------------|
| `image` | Image filename | Only if you want to override auto-lookup. Just provide filename: `"26-03-29.jpg"` |
| `id` | Unique identifier | Never needed - auto-generated from title |
| `date` | ISO date string | Never needed - auto-parsed from `dateDisplay` |

---

## Auto-Generated Fields

The system automatically generates these fields for you:

### 1. **ID** (from title)
- Converts title to lowercase
- Removes special characters
- Replaces spaces with hyphens
- Example: `"UN:VERBUNDEN"` → `"unverbunden"`

### 2. **Date** (from dateDisplay)
- Parses German date format: `"So, 29.03.26, 17:00"`
- Converts to ISO format: `"2026-03-29T17:00:00"`
- Used for calendar downloads

### 3. **Image** (from dateDisplay)
- Extracts date: `"So, 29.03.26, 17:00"` → `29.03.26`
- Formats as: `YY-MM-DD.jpg` → `26-03-29.jpg`
- Looks in: `assets/img/upcoming/26-03-29.jpg`
- **Image Naming Convention**: Name your images as `YY-MM-DD.jpg` (e.g., `26-03-29.jpg`)

---

## Date Display Format

### Standard Format
```
DayName, DD.MM.YY, HH:MM
```

**Examples:**
- `"So, 29.03.26, 17:00"` (Sunday, March 29, 2026, 5pm)
- `"Sa, 30.05.26, 19:00"` (Saturday, May 30, 2026, 7pm)

### Multiple Dates
For events on multiple days, list all dates separated by commas:
```
"Sa, 30.05.26, 19:00, So, 31.05.26, 17:00"
```
The system will use the **first date** for calendar and image lookup.

---

## Footer Templates

### Standard Free Entry
```json
"footer": "Eintritt frei – Kollekte.\n\nAnmeldung empfohlen. Erstbesucher:innen für die Wegbeschreibung unbedingt anmelden!"
```

### Paid Entry
```json
"footer": "Eintritt 50 | 30 CHF inkl. Finger Food und Getränke.\n\nAnmeldung obligatorisch, bitte Datum wählen."
```

### Custom Footer
```json
"footer": "Your custom text here.\n\nSecond paragraph."
```

**Note:** Use `\n\n` for line breaks between paragraphs.

---

## Step-by-Step: Adding an Event

### Example: Adding a new concert

**1. Open `events.json`**

**2. Find the `"upcoming"` array:**
```json
{
  "upcoming": [
    // Existing events here...
  ],
  "archive": []
}
```

**3. Add a comma after the last event, then paste new event:**
```json
{
  "upcoming": [
    {
      "title": "Existing Event",
      ...
    },  ← Don't forget this comma!
    {
      "title": "New Event",
      "dateDisplay": "So, 15.06.26, 18:00",
      "artists": "New Artist - Piano",
      "description": "New description here.",
      "footer": "Eintritt frei – Kollekte.\n\nAnmeldung empfohlen."
    }
  ],
  "archive": []
}
```

**4. Save the file** - Changes appear immediately on the website!

---

## Removing an Event

### Option 1: Delete Completely
Simply delete the entire event object (including curly braces).

**Before:**
```json
{
  "upcoming": [
    {
      "title": "Event 1",
      ...
    },
    {
      "title": "Event to Delete",  ← Remove this whole block
      ...
    },
    {
      "title": "Event 3",
      ...
    }
  ]
}
```

**After:**
```json
{
  "upcoming": [
    {
      "title": "Event 1",
      ...
    },
    {
      "title": "Event 3",
      ...
    }
  ]
}
```

**Important:** Watch out for commas! Make sure there's a comma between events, but NOT after the last event.

### Option 2: Move to Archive
Cut the event from `"upcoming"` and paste into `"archive"`:

```json
{
  "upcoming": [
    // Current events
  ],
  "archive": [
    {
      "title": "Past Event",
      "dateDisplay": "So, 15.01.26, 17:00",
      ...
    }
  ]
}
```

---

## Image Management

### Naming Convention
Name images using the date pattern: `YY-MM-DD` with file extension

**Examples:**
- `26-03-29.jpg` (March 29, 2026)
- `26-04-26.png` (April 26, 2026)
- `26-05-31.jpeg` (May 31, 2026)

### Supported Formats
- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

### Upload Location
Place images in: `assets/img/upcoming/`

### Manual Override
If you need a different image name, specify it:
```json
{
  "title": "Special Event",
  "dateDisplay": "So, 29.03.26, 17:00",
  "image": "special-poster.jpg",
  ...
}
```

---

## Common Mistakes & Fixes

### ❌ Missing Comma
```json
{
  "upcoming": [
    {
      "title": "Event 1"
    }  ← Missing comma here!
    {
      "title": "Event 2"
    }
  ]
}
```

### ✅ Correct
```json
{
  "upcoming": [
    {
      "title": "Event 1"
    },  ← Comma added
    {
      "title": "Event 2"
    }
  ]
}
```

### ❌ Extra Comma
```json
{
  "upcoming": [
    {
      "title": "Last Event"
    },  ← Remove this comma!
  ]
}
```

### ✅ Correct
```json
{
  "upcoming": [
    {
      "title": "Last Event"
    }  ← No comma on last item
  ]
}
```

### ❌ Wrong Quote Type
```json
"title": "Event"  ← Wrong: curly quotes
```

### ✅ Correct
```json
"title": "Event"  ← Right: straight quotes
```

---

## Validation

After editing `events.json`, you can validate it:

1. **Online Validator:** https://jsonlint.com
2. **Visual Studio Code:** Install JSON extension for real-time validation
3. **Test on Website:** Refresh your site and check browser console for errors

---

## Tips & Best Practices

✅ **Always backup** `events.json` before major edits  
✅ **Use a code editor** like VS Code, Sublime Text, or Notepad++ (not Word!)  
✅ **Test after changes** - Refresh website to see if events load  
✅ **Keep description concise** - Very long text may not fit in cards  
✅ **Consistent formatting** - Follow the existing style  
✅ **Standard footer** - Copy/paste from existing events for consistency

---

## Need Help?

- Check browser console (F12) for error messages
- Validate JSON at https://jsonlint.com
- Compare your event to working examples
- See `events-template.json` for a clean template

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│  MINIMAL EVENT (Auto-generates id, date, image) │
└─────────────────────────────────────────────────┘

{
  "title": "Concert Title",
  "dateDisplay": "So, 29.03.26, 17:00",
  "artists": "Artist - Instrument",
  "description": "Description text.",
  "footer": "Eintritt frei – Kollekte."
}

┌─────────────────────────────────────────────────┐
│  FULL EVENT (All fields specified)              │
└─────────────────────────────────────────────────┘

{
  "title": "Concert Title",
  "dateDisplay": "So, 29.03.26, 17:00",
  "image": "custom-image.jpg",
  "artists": "Artist - Instrument",
  "description": "Description text.",
  "footer": "Eintritt frei – Kollekte."
}
```
