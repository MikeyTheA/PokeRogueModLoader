/// <reference types="node" />

import { PathOrFileDescriptor } from 'fs';

declare function compress(input: string | null): string;

declare function _compress(uncompressed: null, bitsPerChar: number, getCharFromInt: (a: number) => string): "";

declare function _compress(uncompressed: string, bitsPerChar: number, getCharFromInt: (a: number) => string): string;

declare function compressToBase64(input: string | null): string;

declare function compressToCustom(uncompressed: string | null, dict: string): string;

declare function compressToEncodedURIComponent(input: string | null): string;

declare function compressToUint8Array(uncompressed: string | null): Uint8Array;

declare function compressToUTF16(input: string | null): string;

/**
 * Converts a Uint8Array to a string, needed for loading on NodeJS, but might
 * also be useful for data transfer.
 *
 * This is binary safe rather than utf8 like TextEncoder.
 */
declare function convertFromUint8Array(data: Uint8Array): string;

/**
 * Converts a string to a Uint8Array, needed for saving on NodeJS, but might
 * also be useful for data transfer.
 *
 * This is binary safe rather than utf8 like TextDecoder.
 */
declare function convertToUint8Array(data: string | null, forceEven?: boolean): Uint8Array | null;

declare function decompress(compressed: string | null): string | null | undefined;

declare function _decompress(length: number, resetValue: number, getNextValue: (a: number) => number): string | null | undefined;

declare function decompressFromBase64(input: string | null): string | null | undefined;

declare function decompressFromCustom(compressed: string | null, dict: string): string | null;

declare function decompressFromEncodedURIComponent(input: string | null): string | null | undefined;

declare function decompressFromUint8Array(compressed: Uint8Array | null): string | null;

declare function decompressFromUTF16(compressed: string | null): string | null | undefined;

declare const _default: {
    _compress: typeof _compress;
    _decompress: typeof _decompress;
    compress: typeof compress;
    compressToBase64: typeof compressToBase64;
    compressToCustom: typeof compressToCustom;
    compressToEncodedURIComponent: typeof compressToEncodedURIComponent;
    compressToUint8Array: typeof compressToUint8Array;
    compressToUTF16: typeof compressToUTF16;
    convertFromUint8Array: typeof convertFromUint8Array;
    convertToUint8Array: typeof convertToUint8Array;
    decompress: typeof decompress;
    decompressFromBase64: typeof decompressFromBase64;
    decompressFromCustom: typeof decompressFromCustom;
    decompressFromEncodedURIComponent: typeof decompressFromEncodedURIComponent;
    decompressFromUint8Array: typeof decompressFromUint8Array;
    decompressFromUTF16: typeof decompressFromUTF16;
    loadBinaryFile: typeof loadBinaryFile;
    saveBinaryFile: typeof saveBinaryFile;
};
export default _default;

/**
 * Binary safe file loading for NodeJS.
 */
declare function loadBinaryFile(fileName: PathOrFileDescriptor): string;

/**
 * Binary safe file saving for NodeJS.
 */
declare function saveBinaryFile(fileName: PathOrFileDescriptor, data: string | Uint8Array): void;

export { }
