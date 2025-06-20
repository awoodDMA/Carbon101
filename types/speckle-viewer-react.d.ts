declare module '@speckle/viewer-react'

declare namespace JSX {
  interface IntrinsicElements {
    'viewer-container': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      streamId?: string
      modelId?: string
      token?: string
    }
  }
}
