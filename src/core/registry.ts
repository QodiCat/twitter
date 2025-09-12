import { PlatformExtractor } from './types.js';

class PlatformRegistry {
  private extractors: PlatformExtractor[] = [];
  register(extractor: PlatformExtractor) {
    this.extractors.push(extractor);
  }
  findForElement(el: HTMLElement): PlatformExtractor | undefined {
    return this.extractors.find(e => e.matchElement(el));
  }
  getAll() { return this.extractors; }
}

export const platformRegistry = new PlatformRegistry();
