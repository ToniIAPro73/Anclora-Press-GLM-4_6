/**
 * Content Paginator
 * Splits HTML content into pages based on device dimensions
 */

import { PaginationConfig } from './device-configs';

export interface ContentPage {
  type: 'content';
  html: string;
  chapterTitle?: string;
  pageNumber: number;
}

/**
 * Paginate HTML content into discrete pages
 *
 * This is a simplified implementation that splits content by paragraphs.
 * For production, you'd want to use actual DOM measurement or a library like Paged.js
 */
export function paginateContent(
  htmlContent: string,
  config: PaginationConfig
): ContentPage[] {
  if (!htmlContent || !htmlContent.trim()) {
    return [{
      type: 'content',
      html: '<p class="text-muted-foreground italic">No hay contenido disponible</p>',
      pageNumber: 1,
    }];
  }

  // Calculate available height for content
  const availableHeight = config.pageHeight - config.marginTop - config.marginBottom;
  const lineHeight = config.fontSize * config.lineHeight;
  const approxLinesPerPage = Math.floor(availableHeight / lineHeight);

  // Parse HTML into DOM nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const nodes = Array.from(doc.body.childNodes);

  const pages: ContentPage[] = [];
  let currentPageNodes: Node[] = [];
  let currentLines = 0;
  let currentChapter = '';

  for (const node of nodes) {
    // Detect chapter headings (H1, H2)
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.tagName === 'H1' || element.tagName === 'H2') {
        currentChapter = element.textContent || '';
      }
    }

    // Estimate lines for this node
    const nodeLines = estimateNodeLines(node, config);

    // Check if adding this node would exceed page capacity
    if (currentLines + nodeLines > approxLinesPerPage && currentPageNodes.length > 0) {
      // Create a new page with current nodes
      const pageDiv = document.createElement('div');
      pageDiv.className = 'preview-page-content';
      currentPageNodes.forEach(n => pageDiv.appendChild(n.cloneNode(true)));

      pages.push({
        type: 'content',
        html: pageDiv.innerHTML,
        chapterTitle: currentChapter,
        pageNumber: pages.length + 1,
      });

      // Start new page
      currentPageNodes = [node.cloneNode(true)];
      currentLines = nodeLines;
    } else {
      currentPageNodes.push(node.cloneNode(true));
      currentLines += nodeLines;
    }
  }

  // Add remaining nodes as final page
  if (currentPageNodes.length > 0) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'preview-page-content';
    currentPageNodes.forEach(n => pageDiv.appendChild(n.cloneNode(true)));

    pages.push({
      type: 'content',
      html: pageDiv.innerHTML,
      chapterTitle: currentChapter,
      pageNumber: pages.length + 1,
    });
  }

  return pages.length > 0 ? pages : [{
    type: 'content',
    html: htmlContent,
    pageNumber: 1,
  }];
}

/**
 * Estimate number of lines a DOM node will take
 * This is a rough approximation - for accuracy, you'd need actual DOM measurement
 */
function estimateNodeLines(node: Node, config: PaginationConfig): number {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    const contentWidth = config.pageWidth - config.marginLeft - config.marginRight;
    const charsPerLine = Math.floor(contentWidth / (config.fontSize * 0.6)); // Approximate char width
    const textLines = Math.ceil(text.length / charsPerLine);
    return Math.max(1, textLines);
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName;

    // Headings take more space
    if (/^H[1-6]$/.test(tagName)) {
      const level = parseInt(tagName[1]);
      const fontSize = config.fontSize * (2.5 - level * 0.3); // Larger for H1, smaller for H6
      return Math.ceil(fontSize / (config.fontSize * config.lineHeight)) + 1; // Extra line for spacing
    }

    // Images
    if (tagName === 'IMG') {
      return 10; // Assume images take ~10 lines
    }

    // Lists
    if (tagName === 'UL' || tagName === 'OL') {
      const items = element.querySelectorAll('li');
      return items.length * 2; // ~2 lines per list item
    }

    // Paragraphs
    if (tagName === 'P') {
      const text = element.textContent || '';
      const contentWidth = config.pageWidth - config.marginLeft - config.marginRight;
      const charsPerLine = Math.floor(contentWidth / (config.fontSize * 0.6));
      const textLines = Math.ceil(text.length / charsPerLine);
      return Math.max(1, textLines) + 0.5; // Extra half line for paragraph spacing
    }

    // Blockquotes
    if (tagName === 'BLOCKQUOTE') {
      const text = element.textContent || '';
      const contentWidth = config.pageWidth - config.marginLeft - config.marginRight - 40; // Indent
      const charsPerLine = Math.floor(contentWidth / (config.fontSize * 0.6));
      const textLines = Math.ceil(text.length / charsPerLine);
      return Math.max(2, textLines) + 1;
    }

    // Default: count child nodes
    let totalLines = 0;
    element.childNodes.forEach(child => {
      totalLines += estimateNodeLines(child, config);
    });
    return totalLines || 1;
  }

  return 1; // Default
}

/**
 * Client-side pagination using actual DOM measurement
 * This requires a mounted component and is more accurate
 */
export function paginateContentWithMeasurement(
  htmlContent: string,
  config: PaginationConfig,
  containerRef: HTMLElement
): ContentPage[] {
  // Create a temporary container for measurement
  const measureContainer = document.createElement('div');
  measureContainer.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${config.pageWidth - config.marginLeft - config.marginRight}px;
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight};
    font-family: inherit;
  `;
  document.body.appendChild(measureContainer);

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const nodes = Array.from(doc.body.childNodes);

  const pages: ContentPage[] = [];
  let currentPageContent: Node[] = [];
  let currentHeight = 0;
  const availableHeight = config.pageHeight - config.marginTop - config.marginBottom;
  let currentChapter = '';

  for (const node of nodes) {
    // Detect chapter headings
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.tagName === 'H1' || element.tagName === 'H2') {
        currentChapter = element.textContent || '';
      }
    }

    // Measure actual height
    measureContainer.innerHTML = '';
    measureContainer.appendChild(node.cloneNode(true));
    const nodeHeight = measureContainer.offsetHeight;

    // Check if we need a new page
    if (currentHeight + nodeHeight > availableHeight && currentPageContent.length > 0) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'preview-page-content';
      currentPageContent.forEach(n => pageDiv.appendChild(n.cloneNode(true)));

      pages.push({
        type: 'content',
        html: pageDiv.innerHTML,
        chapterTitle: currentChapter,
        pageNumber: pages.length + 1,
      });

      currentPageContent = [node.cloneNode(true)];
      currentHeight = nodeHeight;
    } else {
      currentPageContent.push(node.cloneNode(true));
      currentHeight += nodeHeight;
    }
  }

  // Last page
  if (currentPageContent.length > 0) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'preview-page-content';
    currentPageContent.forEach(n => pageDiv.appendChild(n.cloneNode(true)));

    pages.push({
      type: 'content',
      html: pageDiv.innerHTML,
      chapterTitle: currentChapter,
      pageNumber: pages.length + 1,
    });
  }

  // Clean up
  document.body.removeChild(measureContainer);

  return pages.length > 0 ? pages : [{
    type: 'content',
    html: htmlContent,
    pageNumber: 1,
  }];
}
