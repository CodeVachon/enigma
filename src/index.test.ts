import { Enigma, EnigmaChar, EnigmaConfigurationString } from "./index";
import { LoremIpsum } from "lorem-ipsum";
import DiskA from "./disks/A";

class ExposedEnigma extends Enigma {
    bypassConfig(diskConfiguration: EnigmaConfigurationString) {
        this.setup = diskConfiguration;

        return this;
    }

    exposedBuildDiskKey(disk1: EnigmaChar, disk2: EnigmaChar, offset: number) {
        return super.buildDiskKey(disk1, disk2, offset);
    }

    exposedBuildTransitionalDisk(disk1: EnigmaChar, disk2: EnigmaChar, offset: number) {
        return super.buildTransitionalDisk(disk1, disk2, offset);
    }

    exposedManageOffset(value: number): number {
        return super.manageOffset(value);
    }

    exposedThroughDisk(disk: EnigmaChar, letter: EnigmaChar): EnigmaChar {
        return super.throughDisk(disk, letter);
    }

    exposedBetweenDisks(
        disk1: EnigmaChar,
        disk2: EnigmaChar,
        passedOffset: number,
        letter: EnigmaChar
    ): EnigmaChar {
        return super.betweenDisks(disk1, disk2, passedOffset, letter);
    }

    exposedThroughWireBoard(letter: EnigmaChar): EnigmaChar {
        return super.throughWireBoard(letter);
    }
}

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

const makeArray = (value: string | string[], delimiter = ","): string[] => {
    if (value instanceof Array) {
        return value;
    } else {
        return value.split(delimiter);
    }
};

const selectRandom = <T = string>(list: T[], exclude?: T | T[]): T => {
    const excludeList = makeArray((exclude ? exclude : "") as string);
    const filterList = list.filter((v) => excludeList.indexOf(String(v)) < 0 === true);
    return filterList[randomInt(0, filterList.length)];
};

type KeyOfDisk = keyof typeof DiskA;

describe("Enigma", () => {
    const testIterations: number = 50;
    const diskNames = Object.keys(new Enigma().availableDisks);
    const diskKeys: KeyOfDisk[] = Object.keys(DiskA) as KeyOfDisk[];

    describe("Private/Protected Methods", () => {
        describe("throughDisk", () => {
            for (let i = 1; i <= testIterations; i++) {
                describe(`run ${i}`, () => {
                    test(`Changes the Character`, () => {
                        const value: KeyOfDisk = selectRandom<KeyOfDisk>(diskKeys);
                        const result = new ExposedEnigma().exposedThroughDisk("A", value);

                        expect(result).toBeString();
                        expect(result).toHaveLength(1);
                        expect(result).toEqual(DiskA[value]);

                        const backResult = new ExposedEnigma().exposedThroughDisk("A", result);

                        expect(backResult).toBeString();
                        expect(backResult).toHaveLength(1);
                        expect(backResult).toEqual(value);
                    });
                });
            }

            describe("Edge Cases", () => {
                test("non a-z0-9 character passes through", () => {
                    const enigma = new ExposedEnigma();
                    const value = selectRandom(["=", "+", "^"]);
                    const disk1 = selectRandom(diskNames);

                    const result = enigma.exposedThroughDisk(disk1, value);

                    expect(result).toEqual(value);
                });
            });
        });

        describe("betweenDisks", () => {
            for (let i = 1; i <= testIterations; i++) {
                describe(`run ${i}`, () => {
                    test(`Changes a Character`, () => {
                        const enigma = new ExposedEnigma();
                        const value = selectRandom(diskKeys);
                        const disk1 = selectRandom(diskNames);
                        const disk2 = selectRandom(diskNames, disk1);
                        const offset = randomInt(3, 10);

                        const result1 = enigma.exposedBetweenDisks(disk1, disk2, offset, value);

                        expect(result1).toBeString();
                        expect(result1).toHaveLength(1);
                        expect(result1).not.toEqual(value);

                        const result2 = enigma.exposedBetweenDisks(disk1, disk2, offset, result1);

                        expect(result2).toBeString();
                        expect(result2).toHaveLength(1);
                        expect(result2).toEqual(value);
                    });

                    test(`does not return expected character when offset is changed`, () => {
                        const enigma = new ExposedEnigma();
                        const value = selectRandom(diskKeys);
                        const disk1 = selectRandom(diskNames);
                        const disk2 = selectRandom(diskNames, disk1);
                        const offset = randomInt(3, 10);

                        const result1 = enigma.exposedBetweenDisks(disk1, disk2, offset, value);

                        expect(result1).toBeString();
                        expect(result1).toHaveLength(1);

                        const result2 = enigma.exposedBetweenDisks(
                            disk1,
                            disk2,
                            offset + 1,
                            result1
                        );

                        expect(result2).toBeString();
                        expect(result2).toHaveLength(1);
                        expect(result2).not.toEqual(result1);

                        const result3 = enigma.exposedBetweenDisks(disk1, disk2, offset, result1);

                        expect(result3).toBeString();
                        expect(result3).toHaveLength(1);
                        expect(result3).toEqual(value);
                    });
                });
            }

            describe("Edge Cases", () => {
                test("non a-z0-9 character passes through", () => {
                    const enigma = new ExposedEnigma();
                    const value = selectRandom(["=", "+", "^"]);
                    const disk1 = selectRandom(diskNames);
                    const disk2 = selectRandom(diskNames, disk1);
                    const offset = randomInt(3, 10);

                    const result = enigma.exposedBetweenDisks(disk1, disk2, offset, value);

                    expect(result).toEqual(value);
                });
            });
        });

        describe("manageOffset", () => {
            const MAX_LENGTH = Object.keys(DiskA).length;
            test("returns 0 at max length", () => {
                const value = new ExposedEnigma().exposedManageOffset(MAX_LENGTH);
                expect(value).toBeInteger();
                expect(value).toEqual(0);
            });
            test("does not return integer below 0", () => {
                const value = new ExposedEnigma().exposedManageOffset(2);
                expect(value).toBeInteger();
                expect(value).toBeGreaterThanOrEqual(0);
            });
            test("does not return integer grater than max length", () => {
                const value = new ExposedEnigma().exposedManageOffset(MAX_LENGTH + 5);
                expect(value).toBeInteger();
                expect(value).toBeLessThan(MAX_LENGTH);
                expect(value).toEqual(5);
            });
        });

        describe("throughWireBoard", () => {
            for (let i = 1; i <= testIterations; i++) {
                describe(`run ${i}`, () => {
                    test("changes a character when expected", () => {
                        const value = selectRandom(
                            diskKeys.filter((v) => new RegExp("[a-zA-Z]").test(v))
                        );
                        const result = selectRandom(
                            diskKeys.filter((v) => new RegExp("[a-zA-Z]").test(v)),
                            value
                        );

                        const instance = new ExposedEnigma(
                            ["A32", "B17", "C43", `${value}${result}`].join()
                        );

                        expect(instance.exposedThroughWireBoard(value)).toEqual(result);
                    });

                    test("does not change a character when expected", () => {
                        const unmapped = selectRandom(
                            diskKeys.filter((v) => new RegExp("[a-zA-Z]").test(v))
                        );
                        const v1 = selectRandom(
                            diskKeys.filter((v) => new RegExp("[a-zA-Z]").test(v)),
                            unmapped
                        );
                        const v2 = selectRandom(
                            diskKeys.filter((v) => new RegExp("[a-zA-Z]").test(v)),
                            [v1, unmapped]
                        );

                        const instance = new ExposedEnigma(
                            ["A32", "B17", "C43", `${v1}${v2}`].join()
                        );

                        expect(instance.exposedThroughWireBoard(unmapped)).toEqual(unmapped);
                    });
                });
            }
        });
    });

    describe("Public Methods", () => {
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
            test("throws an error if invalid entity is used", () => {
                expect(() => {
                    new Enigma().configure("A1,B2,C4,4$");
                }).toThrowError(new RegExp(`unexpected configuration value`, "i"));
            });
        });

        describe("reset", () => {
            test("throws an error if invalid disk was set", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,B2,Z4").reset();
                }).toThrowError(new RegExp(`Disk Z was not found`, "i"));
            });

            test("throws an error if invalid index was set", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,B2,C444").reset();
                }).toThrowError(new RegExp(`Invalid Offset`, "i"));
            });

            test("throws an error if wire map key is already used", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,B2,C4,ac,ca").reset();
                }).toThrowError(new RegExp(`cannot be connected to`, "i"));
            });

            test("throws an error if wire map value is already used", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,B2,C4,ca,ka").reset();
                }).toThrowError(new RegExp(`cannot be connected to`, "i"));
            });

            test("throws an error if invalid config value is passed", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,A=,C4").reset();
                }).toThrowError(new RegExp(`Unexpected Setup Value`, "i"));
            });

            test("throws an error if not enough disks are passed", () => {
                expect(() => {
                    new ExposedEnigma().bypassConfig("A1,B2").reset();
                }).toThrowError(new RegExp(`A minimum of 3 disks are required`, "i"));
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

            test("returns a different string when setup is different", () => {
                const value = "Hello World";

                const result1 = new Enigma(
                    ["A12", "E43", "B27", "FC", "cS", "yW", "kA", "iJ"].join()
                ).encode(value);

                expect(result1).toBeString();
                expect(result1.length).toBeGreaterThan(0);
                expect(result1).not.toBe(value);

                const result2 = new Enigma(
                    ["D15", "E43", "B17", "FD", "zS", "yW", "hA", "iJ"].join()
                ).encode(value);

                expect(result2).toBeString();
                expect(result2.length).toBeGreaterThan(0);
                expect(result2).not.toBe(value);

                expect(result2).not.toBe(result1);
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

            test("fails to properly decode string when setup is different", () => {
                const result = new Enigma(
                    ["C15", "E43", "B17", "FD", "zS", "yW", "hA", "iJ"].join()
                ).decode(encodedTestString);

                expect(result).toBeString();
                expect(result.length).toBeGreaterThan(0);
                expect(result).not.toBe(encodedTestString);
                expect(result).not.toBe(testInput);
            });
        });
    });

    describe("Use Case", () => {
        describe("Read Me Test", () => {
            test("encodes and decodes", () => {
                const EnigmaConfig = "A32,E12,C44,fD,rs,Rv";
                const myString = "Lorem Ipsum";

                const encoded = new Enigma(EnigmaConfig).encode(myString);
                expect(encoded).not.toEqual(myString);

                const decoded = new Enigma(EnigmaConfig).decode(encoded);
                expect(decoded).toEqual(myString);
            });
        });

        for (let i = 1; i <= 3; i++) {
            describe(`Large Text Block run ${i}`, () => {
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

            describe(`Differently Configured Enigma Instances run ${i}`, () => {
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
        }
    });
});
