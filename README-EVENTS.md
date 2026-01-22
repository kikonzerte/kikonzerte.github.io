# Event Management Guide

## Quick Start: Adding a New Event

### 1. Open `events.json`

### 2. Copy this template:

```json
{
  "title": "Your Event Title",
  "dateDisplay": "So, 29.03.26, 17:00",
  "image": "assets/img/upcoming/26-03-29.jpg",
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
| `image` | Full image path | `"assets/img/upcoming/26-03-29.jpg"` |
| `artists` | Performing artists | `"Elena Schneider - Mezzosopran"` |
| `description` | Event description | `"Description text..."` |
| `footer` | Pricing & registration info | `"Eintritt frei – Kollekte..."` |

### Auto-Generated Fields (Never Need to Specify)

| Field | Description | Generated From |
|-------|-------------|----------------|
| `id` | Unique identifier | Auto-generated from title |
| `date` | ISO date string | Auto-parsed from `dateDisplay` |

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

### Custom Image Names
Simply provide the full path:
```json
{
  "title": "Special Event",
  "dateDisplay": "So, 29.03.26, 17:00",
  "image": "assets/img/upcoming/special-poster.jpg",
  ...
}
```

---


