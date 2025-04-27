declare module 'pdfjs-dist' {
  export function getDocument(source: string | URL | ArrayBuffer | Uint8Array): PDFDocumentLoadingTask;
  
  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageIndex: number): Promise<PDFPageProxy>;
  }
  
  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
  }
  
  export interface TextContent {
    items: TextItem[];
  }
  
  export const version: string;
  
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
}

declare module 'pdfjs-dist/types/src/display/api' {
  export interface TextItem {
    str: string;
    dir: string;
    transform: number[];
    width: number;
    height: number;
    hasEOL: boolean;
  }
} 