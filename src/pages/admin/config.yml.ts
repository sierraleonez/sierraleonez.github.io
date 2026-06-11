import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const config = `backend:
  name: proxy
  proxy_url: http://localhost:8081/api/v1
  branch: main

media_folder: public/uploads
public_folder: /uploads

collections:
  - name: blog
    label: Blog
    folder: src/content/blog
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Publish Date", name: "date", widget: "datetime" }
      - { label: "Description", name: "description", widget: "string", required: false }
      - { label: "Category", name: "category", widget: "string" }
      - { label: "Tags", name: "tags", widget: "list" }
      - { label: "Featured Image", name: "image", widget: "image", required: false }
      - { label: "Draft", name: "draft", widget: "boolean", default: false }
      - { label: "Body", name: "body", widget: "markdown" }
`;
  return new Response(config, {
    headers: { 'Content-Type': 'text/yaml; charset=utf-8' }
  });
};
