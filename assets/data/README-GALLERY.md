# Gallery Management Guide

## Adding or Removing Gallery Images

### 1. Add/Remove Images
Place images in the `assets/img/gallery/` folder. Supported formats: `.webp`, `.jpg`, `.jpeg`, `.png`

### 2. Update gallery-images.json
After adding or removing images, regenerate the JSON file:

**From the project root directory, run:**

```bash
ls assets/img/gallery/*.webp | sort -V | sed 's|assets/img/gallery/||' | jq -R -s 'split("\n") | map(select(length > 0))' > gallery-images.json
```

**Or for all image formats:**

```bash
ls assets/img/gallery/*.{jpg,jpeg,png,webp} 2>/dev/null | sort -V | sed 's|assets/img/gallery/||' | jq -R -s 'split("\n") | map(select(length > 0))' > gallery-images.json
```

### 3. Refresh the Website
The gallery will automatically load the new images from `gallery-images.json`.

---

## How It Works

- **gallery-images.json** contains an alphabetically sorted list of all gallery image filenames
- The gallery JavaScript automatically loads this JSON and displays images in order
- Images are sorted naturally (gallery1, gallery2, ..., gallery10, etc.)
- No need to number sequentially - any filenames work as long as they're listed in the JSON

---

## Image Guidelines

- **Recommended format:** WebP (best compression and quality)
- **Aspect ratios:** Gallery handles varying aspect ratios automatically
- **File size:** Optimize images before uploading (recommended < 500KB per image)
- **Naming:** Use descriptive names or sequential numbers (gallery1.webp, gallery2.webp, etc.)

---

## Example Workflow

```bash
# 1. Add new image
cp new-concert-photo.webp assets/img/gallery/gallery19.webp

# 2. Regenerate JSON
ls assets/img/gallery/*.webp | sort -V | sed 's|assets/img/gallery/||' | jq -R -s 'split("\n") | map(select(length > 0))' > gallery-images.json

# 3. Commit changes
git add assets/img/gallery/gallery19.webp gallery-images.json
git commit -m "Add new gallery image"
```

---

## Troubleshooting

**Gallery not showing images?**
- Check that `gallery-images.json` exists and is valid JSON
- Verify image paths are correct (they should just be filenames, not full paths)
- Check browser console for errors

**Images in wrong order?**
- Make sure you used `sort -V` (natural sort) instead of regular `sort`
- Verify the JSON file has images in the desired order

**Need to remove an image?**
- Delete the image file from `assets/img/gallery/`
- Regenerate `gallery-images.json` using the command above
