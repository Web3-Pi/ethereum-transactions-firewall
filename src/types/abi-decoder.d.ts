declare module 'abi-decoder' {
  const abiDecoder: {
    addABI: (abi: any[]) => void;
    removeABI: (abi: any[]) => void;
    decodeMethod: (data: string) => {
      name: string;
      params: Array<{
        name: string;
        value: string;
        type: string;
      }>;
    } | null;
  };
  export default abiDecoder;
}