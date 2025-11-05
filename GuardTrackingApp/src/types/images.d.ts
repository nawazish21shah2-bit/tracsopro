declare module '*.png' {
  const value: number; // React Native resolves to a number for static resources
  export default value;
}

declare module '*.jpg' {
  const value: number;
  export default value;
}

declare module '*.jpeg' {
  const value: number;
  export default value;
}
