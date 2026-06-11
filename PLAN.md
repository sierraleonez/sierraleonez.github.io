# wblog — Astro Static Blog with Decap CMS

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Astro (static site generation) |
| CMS | Decap CMS (git-based, markdown files) |
| CSS | Tailwind CSS |
| Content | Markdown + frontmatter |
| Dark Mode | Yes (Tailwind `dark:` variant + toggle) |

## Directory Structure

```
wblog/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── BlogCard.astro
│   │   ├── ThemeToggle.astro
│   │   ├── TagList.astro
│   │   └── CategoryList.astro
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── BlogLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── tags/[tag].astro
│   │   ├── categories/[category].astro
│   │   └── rss.xml.js
│   ├── content/blog/          # Markdown posts
│   └── styles/global.css
├── public/
│   └── admin/
│       ├── index.html
│       └── config.yml
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — featured / latest posts |
| `/blog` | Blog archive (paginated) |
| `/blog/[slug]` | Single post |
| `/tags/[tag]` | Posts by tag |
| `/categories/[category]` | Posts by category |
| `/about` | About me page |
| `/rss.xml` | RSS feed |
| `/admin/` | Decap CMS login |

## Post Frontmatter

```yaml
---
title: "Post Title"
date: 2026-06-11
tags: [tag1, tag2]
category: tutorial
description: "SEO description"
image: /uploads/featured.jpg
draft: false
---
```

## Workflow

1. Developer configures CMS collections in `admin/config.yml`
2. Editor visits `/admin/` → writes/edits posts via Decap CMS UI
3. On save, Decap CMS commits Markdown + images to Git
4. On build, Astro reads `src/content/blog/*.md` and generates static pages
5. Deploy to any static host (Netlify, Vercel, GitHub Pages, etc.)

## Implementation Order

1. Scaffold Astro project + install Tailwind + Decap CMS config
2. Create layouts (`BaseLayout`, `BlogLayout`)
3. Build components (`Header`, `Footer`, `BlogCard`, `ThemeToggle`)
4. Build pages (Home, Blog listing, single post, About)
5. Add tag/category pages
6. Add RSS feed
7. Add Decap CMS admin UI and config
8. Add sample posts for testing
9. Verify build
