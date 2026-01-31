---
name: web-images
description: Creative and technical patterns for using images in web development. Use when building UIs that incorporate photography.
---

# Image Techniques for Web Development

Don't just slap a stock photo hero on a white background. Images should be **intentional**, **unexpected**, and **integrated** into the design—not decorative afterthoughts.

## Philosophy

- **Avoid the cliché**: Full-bleed hero with centered text over a generic office/laptop photo = instant AI slop. If you've seen it a thousand times, don't do it.
- **Images as design elements**: Crop aggressively. Use clip-paths. Let images bleed off edges. Overlap with other elements. Break the grid.
- **Commit to a treatment**: If you're going grayscale, go ALL grayscale. If you're using duotone, make it bold. Half-measures look accidental.
- **Negative space is powerful**: One striking image with breathing room beats a cluttered gallery.
- **Motion creates life**: Subtle parallax, hover reveals, scroll-triggered animations. Static grids feel dead.

## Layout Patterns

| Pattern | When to Use | Avoid |
|---------|-------------|-------|
| **Bento/Masonry** | Portfolios, galleries, visual storytelling | Perfect uniformity—vary the sizes |
| **Full-bleed hero** | High-impact landing, bold statement | Generic stock + centered white text |
| **Split screen** | Product + description, before/after | 50/50 feels safe—try 60/40 or overlap |
| **Overlapping** | Editorial, modern, dynamic feel | Messy collision—be intentional |
| **Diagonal/clip-path** | Energy, movement, breaking monotony | Overuse—one per page max |

## Visual Effects (CSS)

```css
/* Glassmorphism - text over busy images */
backdrop-filter: blur(12px);
background: rgba(255,255,255,0.1);

/* Duotone/color overlay */
mix-blend-mode: multiply; /* on image over colored bg */

/* Grayscale with color on hover */
filter: grayscale(100%);
transition: filter 0.3s;
&:hover { filter: grayscale(0); }

/* Diagonal crop */
clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);

/* Gradient fade for text readability */
background: linear-gradient(transparent, rgba(0,0,0,0.8));
```

## Technical Essentials

```html
<!-- Always lazy load below-the-fold images -->
<img src="photo.jpg" loading="lazy" alt="Description">

<!-- Responsive images - serve right size -->
<img
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, 800px"
  src="photo-800.jpg"
  alt="Description"
>

<!-- WebP with fallback -->
<picture>
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg" alt="Description">
</picture>
```

```css
/* Image fills container without distortion */
img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center; /* adjust focal point */
}

/* Consistent aspect ratios */
aspect-ratio: 16 / 9;  /* hero/banner */
aspect-ratio: 1 / 1;   /* thumbnails, avatars */
aspect-ratio: 4 / 3;   /* cards */
```

```jsx
// Next.js - automatic optimization
import Image from 'next/image'
<Image src="/photo.jpg" alt="" fill className="object-cover" placeholder="blur" />
```

## Quick Decisions

- **Hero**: Does it NEED a photo? Sometimes bold typography alone is stronger.
- **Gallery**: Masonry > uniform grid. Vary sizes. Add hover effects.
- **Cards**: `object-fit: cover` + `aspect-ratio` = consistent without distortion.
- **Text over image**: Use gradient overlay or glassmorphism. Never raw text on busy photo.
- **Loading**: Lazy load everything. Skeleton pulse for placeholders. Blur-up for heroes.
