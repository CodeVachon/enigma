import { Enigma } from "./index";
import { LoremIpsum } from "lorem-ipsum";
import DiskA from "./disks/A";

const lorem = new LoremIpsum({
    sentencesPerParagraph: {
        max: 8,
        min: 3
    },
    wordsPerSentence: {
        min: 7,
        max: 20
    }
});

const randomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};

const selectRandom = <T = string>(list: T[], exclude?: T): T => {
    const filterList = list.filter((v) => v !== (exclude || ""));
    return filterList[randomInt(0, filterList.length)];
};

type KeyOfDisk = keyof typeof DiskA;

describe("Enigma", () => {
    const testIterations: number = 1;
    const diskNames = Object.keys(new Enigma().availableDisks);
    const diskKeys: KeyOfDisk[] = Object.keys(DiskA) as KeyOfDisk[];

    describe("configure", () => {
        test("changes the setup of the instance", () => {
            const value = "A1,B2,C3";

            new Enigma().configure(value);
        });

        test("throws an error if value not passed", () => {
            expect(() => {
                new Enigma().configure("");
            }).toThrowError(new RegExp("length"));
        });

        test("throws an error if not enough disks are passed", () => {
            expect(() => {
                new Enigma().configure("A1,B2");
            }).toThrowError(new RegExp("number of disks"));
        });

        test("throws an error if invalid disk is used", () => {
            expect(() => {
                new Enigma().configure("A1,B2,Z4");
            }).toThrowError(new RegExp(`got Z`, "i"));
        });
        test("throws an error if invalid index is used", () => {
            expect(() => {
                new Enigma().configure("A1,B2,C4000");
            }).toThrowError(new RegExp(`got 4000`, "i"));
        });
    });

    describe("throughDisk", () => {
        for (let i = 1; i <= testIterations; i++) {
            describe(`run ${i}`, () => {
                test(`Changes the Character`, () => {
                    const value: KeyOfDisk = selectRandom<KeyOfDisk>(diskKeys);
                    const result = new Enigma().throughDisk("A", value);

                    expect(result).toBeString();
                    expect(result).toHaveLength(1);
                    expect(result).toEqual(DiskA[value]);

                    const backResult = new Enigma().throughDisk("A", result);

                    expect(backResult).toBeString();
                    expect(backResult).toHaveLength(1);
                    expect(backResult).toEqual(value);
                });
            });
        }
    });

    describe("betweenDisks", () => {
        for (let i = 1; i <= testIterations; i++) {
            describe(`run ${i}`, () => {
                test(`Changes a Character`, () => {
                    const enigma = new Enigma();
                    const value = selectRandom(diskKeys);
                    const disk1 = selectRandom(diskNames);
                    const disk2 = selectRandom(diskNames, disk1);
                    const offset = randomInt(3, 10);

                    const result1 = enigma.betweenDisks(disk1, disk2, offset, value);

                    expect(result1).toBeString();
                    expect(result1).toHaveLength(1);
                    expect(result1).not.toEqual(value);

                    const result2 = enigma.betweenDisks(disk1, disk2, offset, result1);

                    expect(result2).toBeString();
                    expect(result2).toHaveLength(1);
                    expect(result2).toEqual(value);
                });

                test(`does not return expected character when offset is changed`, () => {
                    const enigma = new Enigma();
                    const value = selectRandom(diskKeys);
                    const disk1 = selectRandom(diskNames);
                    const disk2 = selectRandom(diskNames, disk1);
                    const offset = randomInt(3, 10);

                    const result1 = enigma.betweenDisks(disk1, disk2, offset, value);

                    expect(result1).toBeString();
                    expect(result1).toHaveLength(1);

                    const result2 = enigma.betweenDisks(disk1, disk2, offset + 1, result1);

                    expect(result2).toBeString();
                    expect(result2).toHaveLength(1);
                    expect(result2).not.toEqual(result1);

                    const result3 = enigma.betweenDisks(disk1, disk2, offset, result1);

                    expect(result3).toBeString();
                    expect(result3).toHaveLength(1);
                    expect(result3).toEqual(value);
                });
            });
        }
    });

    describe("manageOffset", () => {
        const MAX_LENGTH = Object.keys(DiskA).length;
        test("returns 0 at max length", () => {
            const value = new Enigma().manageOffset(MAX_LENGTH);
            expect(value).toBeInteger();
            expect(value).toEqual(0);
        });
        test("does not return integer below 0", () => {
            const value = new Enigma().manageOffset(2);
            expect(value).toBeInteger();
            expect(value).toBeGreaterThanOrEqual(0);
        });
        test("does not return integer grater than max length", () => {
            const value = new Enigma().manageOffset(MAX_LENGTH + 5);
            expect(value).toBeInteger();
            expect(value).toBeLessThan(MAX_LENGTH);
            expect(value).toEqual(5);
        });
    });

    describe("translate", () => {
        test("scrambles a string", () => {
            const value = "I Am Groot!";

            const result1 = new Enigma().translate(value);

            expect(result1).toBeString();
            expect(result1.length).toBeGreaterThan(0);
            expect(result1).not.toEqual(value);

            const result2 = new Enigma().translate(result1);
            expect(result2).toBeString();
            expect(result2.length).toBeGreaterThan(0);
            expect(result2).toEqual(value);
        });
    });

    describe("encode", () => {
        test("returns a coded a string", () => {
            const value = "Hello World";

            const result = new Enigma().encode(value);

            expect(result).toBeString();
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toBe(value);
        });

        test("repeatedly returns a coded a string", () => {
            const value = "Hello World";

            const result1 = new Enigma().encode(value);

            expect(result1).toBeString();
            expect(result1.length).toBeGreaterThan(0);
            expect(result1).not.toBe(value);

            const result2 = new Enigma().encode(value);

            expect(result2).toBeString();
            expect(result2.length).toBeGreaterThan(0);
            expect(result2).not.toBe(value);

            expect(result2).toBe(result1);
        });
    });

    describe("decode", () => {
        const testInput = "Hello World!";
        let encodedTestString = "";

        beforeEach(() => {
            encodedTestString = new Enigma().encode(testInput);
        });

        test("returns a decoded string", () => {
            const result = new Enigma().decode(encodedTestString);

            expect(result).toBeString();
            expect(result.length).toBeGreaterThan(0);
            expect(result).toEqual(testInput);
        });
    });

    describe("Use Case: Large Text Block", () => {
        const testInput = lorem.generateParagraphs(randomInt(5, 10));
        let encodedTestString = "";

        beforeEach(() => {
            encodedTestString = new Enigma().encode(testInput);
        });

        test("encoded string is not readable", () => {
            expect(encodedTestString).toBeString();
            expect(encodedTestString.length).toBeGreaterThan(0);
            expect(encodedTestString).not.toEqual(testInput);
        });

        test("encoded string base64 encoded is not readable", () => {
            const decoded = Buffer.from(encodedTestString, "base64").toString("ascii");

            expect(decoded).toBeString();
            expect(decoded.length).toBeGreaterThan(0);
            expect(decoded).not.toEqual(testInput);
        });

        test("returns a decoded string", () => {
            const result = new Enigma().decode(encodedTestString);

            expect(result).toBeString();
            expect(result.length).toBeGreaterThan(0);
            expect(result).toEqual(testInput);
        });
    });

    describe("Use Case: Differently Configured Enigma Instances", () => {
        const testInput = lorem.generateParagraphs(randomInt(1, 3));
        let encodedTestString = "";

        beforeEach(() => {
            encodedTestString = new Enigma()
                .configure(`C${randomInt(1, 7)},D${randomInt(1, 7)},E${randomInt(1, 7)}`)
                .encode(testInput);
        });

        test("decoded string does not match expected string", () => {
            const result = new Enigma()
                .configure(`A${randomInt(1, 7)},B${randomInt(1, 7)},C${randomInt(1, 7)}`)
                .decode(encodedTestString);

            expect(result).toBeString();
            expect(result.length).toBeGreaterThan(0);
            expect(result).not.toEqual(testInput);
        });
    });
});
