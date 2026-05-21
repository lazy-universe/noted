// This file contains TypeScript type definitions for the frontend folder.

export interface Note {
  id: number;
  title: string;
  slug: string;
  updated_at: string;
  folder_name: string | null;
}

export interface NoteDetail extends Note {
  content: string;
  content_html: string;
  tags: string[];
  links: { title: string; slug: string }[];
}