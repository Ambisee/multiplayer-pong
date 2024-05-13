import struct


def array_to_bytes(arr):
    return b''.join(struct.pack("<h", value) for value in arr)
