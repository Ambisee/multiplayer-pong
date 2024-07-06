import { arrayToShort, shortToArray } from "../../src/scripts/helper_scripts/messaging_helpers"


describe("Message Helper tests", () => {
    it("should correctly convert a signed short to a byte array", () => {
        expect(shortToArray(-5)).toEqual([0xfb, 0xff])
    })
    
    it("should correctly convert the contents of a byte array to a short", () => {
        const payload = new Uint8Array([0x04, 0x00, 0x00, 0xfb, 0xff])
        
        expect(arrayToShort(payload, 3)).toEqual(-5)
    })
})