import { TextEncoder, TextDecoder } from 'util';
import { Buffer } from 'buffer';

// Create proper type definitions
declare global {
  var TextEncoder: typeof TextEncoder;
  var TextDecoder: typeof TextDecoder;
  var Buffer: typeof Buffer;
}

// Assign the implementations
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any; // Use type assertion to bypass strict typing
global.Buffer = Buffer;
