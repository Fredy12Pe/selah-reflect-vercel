/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

declare module 'next/image' {
  import { ImageProps as NextImageProps } from 'next/dist/client/image';
  export * from 'next/dist/client/image';
  export default function Image(props: NextImageProps): JSX.Element;
} 