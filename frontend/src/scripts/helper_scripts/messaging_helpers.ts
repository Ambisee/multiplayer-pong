/**
 * Get the (signed) short value represented by the bits arranged in little-endian 
 * order in a Uint8Array 
 * 
 * @param array the Uint8Array containing the little-endian representation of the short
 * @param i the starting index of the short
 * @returns 
 */
function arrayToShort(array: Uint8Array, i: number): number {
    if (i >= array.length || i + 1 >= array.length) {
        throw Error("Index out of bound.")
    }

    // Get the two's complement representation
    let value = array[i] | (array[i + 1] << 8)
    
    if (value & 0x8000) {
        // If it's a negative number, invert the bits, get the first 2 bytes from the right
        // and add one to the value
        value = -((~value + 1) & 0x0000ffff)
    }
    
    return value
}


/**
 * Get the bytes array of the (signed) short representation of the given number.
 * 
 * @param value the number of which to extract the bytes array from
 * @returns 
 */
function shortToArray(value: number) {
    // Check if the number is within the range of a signed short
    const MIN = -((~0x8000 + 1) & 0x0000ffff)
    const MAX = 0x7fff

    if (value < MIN || value > MAX) {
        throw Error("Value is out of bound. Please enter a value between -32768 and 32767.")
    }

    return [value & 0xFF, (value >> 8) & 0xFF]
}

export { arrayToShort, shortToArray }