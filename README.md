# AI Model Library

A comprehensive Next.js application for browsing AI models across providers. Built with server-side rendering (SSR) for optimal SEO performance.

## Features

- **Comprehensive Model Coverage**: Explore 2300+ AI models across multiple providers
- **Multiple Modes Supported**:
  - Chat/Conversation
  - Image Generation
  - Audio Transcription
  - Video Generation
  - OCR (Optical Character Recognition)
  - Embeddings
  - Reranking
- **Individual Model Pages**: Each model has its own dedicated page for better SEO
- **Programmatic Content**: Automatically generated content for each model page
- **SEO Optimized**: 
  - Meta tags
  - Structured data (JSON-LD)
  - Sitemap generation
  - Robots.txt
- **Modern Design**: Clean, minimalist design with provider logos and model filters

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Server-Side Rendering** for SEO

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page with model listing
│   ├── model/
│   │   └── [slug]/
│   │       └── page.tsx    # Individual model calculator pages
│   ├── sitemap.ts          # Dynamic sitemap generation
│   ├── robots.ts           # Robots.txt configuration
│   └── globals.css         # Global styles
├── components/
│   ├── ModelsTable.tsx     # Model listing table
│   └── ProvidersList.tsx   # Provider list with logos
├── lib/
│   ├── api.ts              # API utilities for fetching models
│   └── calculator.ts       # Cost calculation logic
└── types/
    └── model.ts            # TypeScript type definitions
```

## Data Source

The application fetches model data from the [Bifrost Datasheet API](https://getbifrost.ai/datasheet), which provides comprehensive pricing information for AI models across multiple providers.

## SEO Features

- **Static Generation**: All model pages are pre-rendered at build time
- **Dynamic Metadata**: Each page has unique, optimized meta tags
- **Structured Data**: JSON-LD schema markup for better search engine understanding
- **Sitemap**: Automatically generated sitemap with all model pages
- **Programmatic Content**: Unique, SEO-friendly content for each model page

## Model Modes

The library supports browsing and filtering models by mode:

- **Chat**: Conversation and response models
- **Image Generation**: Text-to-image models
- **Audio Transcription**: Speech-to-text models
- **Video Generation**: Text-to-video models
- **OCR**: Document extraction models
- **Embedding**: Vector and embedding models
- **Rerank**: Re-ranking models

## Environment Variables

Optional environment variable:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

Used for sitemap and structured data URLs.

## License

MIT
