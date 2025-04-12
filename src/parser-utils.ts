export function parseVarint(view: DataView, offset: number): [number, number] {
  let value = 0;
  let byte: number;
  let length = 0;

  do {
    byte = view.getUint8(offset + length);
    value = (value << 7) + (byte & 0x7f);
    length++;
  } while (byte & 0x80);

  return [value, length];
}
