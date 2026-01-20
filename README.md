# Krienser Industrie Konzerte (KiK) Website

Official website for Krienser Industrie Konzerte - an intimate concert venue in Kriens, Switzerland.

## About

The Krienser Industrie Konzerte were founded in 2021 by Sharon Mazzoletti and Florian Meier. The venue provides a low-barrier performance opportunity for musicians and artists in an industrial building converted into a small concert hall with lounge seating for about 40 people.

## Technology

- Pure HTML/CSS/JavaScript (no framework dependencies)
- Static site for maximum compatibility and performance
- Responsive design for all devices

## Design

- **Headings**: QuarryDigger font
- **Body text**: Courier New
- **Colors**:
  - White: #FFFFFF
  - Light gray: #DEDEDE
  - Orange: #FF8600
  - Dark blue: #002060
  - Dark gray: #212020

## Structure

```
/
├── index.html              # Main page (single-page application)
├── konzertarchiv.html      # Concert archive
├── newsletter.html         # Newsletter signup
├── vielen-dank.html        # Thank you page
├── vielen-dank2.html       # Thank you page (alternative)
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── img/               # Images
│       ├── gallery/       # Gallery photos
│       ├── archive/       # Archive images
│       └── icons/         # Icon assets
└── fonts/                 # Custom fonts
```

## Development

This is a static website that can be opened directly in a browser or served with any web server.

For local development with live reload:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

## Contact

- Email: info@kikonzerte.ch
- Location: Werkstrasse 1, 6010 Kriens, Switzerland
- Website: https://kikonzerte.ch

## License

© 2021-2026 Krienser Industrie Konzerte
