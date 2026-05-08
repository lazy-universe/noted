import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true, // Allow HTML tags
  linkify: true,
  typographer: true
});

export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

export const parseMarkdownFile = (filePath: string, notesDir: string) => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  const relativePath = path.relative(notesDir, filePath);
  const folderPath = path.dirname(relativePath);
  const fileName = path.basename(filePath, '.md');
  
  const title = data.title || fileName;
  const slug = data.slug || slugify(fileName);
  
  const tags = Array.isArray(data.tags) ? data.tags : [];
  
  // Extract links for the DB relations (slugified version)
  const linkRegex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[1].split('|')[0];
    links.push(slugify(rawLink));
  }

  return {
    title,
    slug,
    content,
    frontmatter: data,
    tags,
    links,
    folderPath: folderPath === '.' ? '' : folderPath,
  };
};

export const renderMarkdown = (content: string) => {
  let rendered = md.render(content);
  
  // Transform Wiki-links [[target|alias]] into <a class="wiki-link" data-slug="target">alias</a>
  // This regex handles [[target]] and [[target|alias]]
  rendered = rendered.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
    const slug = slugify(target);
    const text = alias || target;
    return `<a class="wiki-link" data-slug="${slug}" href="javascript:void(0)">${text}</a>`;
  });
  
  return rendered;
};
