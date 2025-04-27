declare module 'firebase/storage' {
  export interface Storage {
    app: any;
  }
 
  export function getStorage(app?: any): Storage;
  export function ref(storage: Storage, path?: string): any;
  export function uploadBytes(ref: any, data: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
} 