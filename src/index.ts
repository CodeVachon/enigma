import DiskA from "./disks/A";
import DiskB from "./disks/B";
import DiskC from "./disks/C";
import DiskD from "./disks/D";
import DiskE from "./disks/E";

/**
 * A Single UTF8 Character used in the Enigma Disks
 */
export type EnigmaChar = string;

/**
 * A Single Enigma Disk Used to Map Enigma Characters
 */
export type EnigmaDisk = { [key: EnigmaChar]: EnigmaChar };

/**
 * Configured Enigma Disk used in cyphers
 */
export type EnigmaAvailableDisks = Record<EnigmaChar, EnigmaDisk>;

/**
 * This value is expected to come from an Environment Variable
 * so this is setup to manage this use case.
 *
 * This should be an CSV string where each value is a combination of
 * a DISK name and an offsetting Index.
 *
 * @example "A12,E43,B27"
 */
export type EnigmaConfigurationString = string;

/**
 * **Enigma String Cypher**
 *
 * > **DO NOT USE THIS FOR PASSWORDs**
 *
 * Used to Encode Strings that can be decoded later with another exactly configured Enigma Instance.
 *
 * This is useful for encoding sensitive information in a database that can be decoded later on by the application.
 *
 * [More About The Enigma Machine](https://en.wikipedia.org/wiki/Enigma_machine)
 */
class Enigma {
    /**
     * Static Disks Setup by the System
     */
    readonly availableDisks: EnigmaAvailableDisks = {
        A: DiskA,
        B: DiskB,
        C: DiskC,
        D: DiskD,
        E: DiskE
    };

    /**
     * Transitional Disks Setup by the System
     *
     * These Disk Handle the letter changing between 2 disks and uses a
     * key of `[Disk1][Disk2][OffsetRotation: int]`
     */
    protected transitionalDisks: EnigmaAvailableDisks = {};

    /**
     * Base Setup of the Enigma Encoder
     */
    protected setup: EnigmaConfigurationString = "A12,E43,B27,FC,cS,yW,kA,iJ";

    /**
     * Current Configured Disks
     */
    private currentDisks: (keyof typeof this["availableDisks"])[] = ["A", "B", "D"];

    /**
     * Current Configured Index for the Disks
     */
    private currentIndex: number[] = [12, 43, 27];

    /**
     * Current Wire Map Configuration
     */
    protected currentWireMap: EnigmaDisk = {};

    /**
     * The Length of the Disk Keys in the System - Used in `this.manageOffset` rollover
     */
    protected diskLength: number = Object.keys(DiskA).length;

    /**
     * Build an Enigma Instance
     * @param diskConfiguration Pass in an initial configuration
     * @returns a configured Enigma Instance
     *
     * @example ` const enigma = new Enigma("A12,E43,B27,FC,cS,yW,kA,iJ");`
     */
    constructor(diskConfiguration: EnigmaConfigurationString = "") {
        if (diskConfiguration.length > 0) {
            this.configure(diskConfiguration);
        }
        this.reset();

        return this;
    }

    /**
     * Builds the Disk Key used for Transitional Disks
     * @param disk1 The Disk the Letter is being passed from
     * @param disk2 The Disk the Letter is being passed to
     * @param offset The Index Offset
     * @returns a Key used for `this.transitionalDisks`
     */
    protected buildDiskKey(disk1: EnigmaChar, disk2: EnigmaChar, offset: number) {
        return `${disk1}${disk2}${this.manageOffset(offset)}`;
    }

    /**
     * Builds a Transitional Disk in the Instance as Required
     * @param disk1 The Disk the Letter is being passed from
     * @param disk2 The Disk the Letter is being passed to
     * @param offset The Index Offset
     * @returns a Key used for `this.transitionalDisks`
     */
    protected buildTransitionalDisk(disk1: EnigmaChar, disk2: EnigmaChar, offset: number) {
        const diskKey = this.buildDiskKey(disk1, disk2, this.manageOffset(offset));
        // Build the Transitional Disk when required
        if (this.transitionalDisks[diskKey] === undefined) {
            const selectedDisk1 = this.availableDisks[disk1];
            const selectedDisk2 = this.availableDisks[disk2];
            const keyList = Object.values(selectedDisk1);

            const valueListBefore = Object.keys(selectedDisk2);
            const offsetList = valueListBefore.splice(0, this.manageOffset(offset));
            const valueList = valueListBefore.concat(offsetList);

            const tempDisk: EnigmaDisk = {};
            const used: EnigmaChar[] = [];

            while (used.length <= Object.values(selectedDisk1).length) {
                const newKey = keyList.filter((v) => !used.some((y) => y === v)).pop();
                const newValue = valueList
                    .filter((v) => !used.some((y) => y === v))
                    .filter((v) => v !== newKey)
                    .pop();

                if (newKey === undefined || newValue === undefined) {
                    break;
                }

                used.push(newKey);
                used.push(newValue);

                tempDisk[newKey] = newValue;
                tempDisk[newValue] = newKey;
            }

            this.transitionalDisks[diskKey] = tempDisk;
        } // if desk does not already exist
    } // close buildTransitionalDisk

    /**
     * Ensure that the provided index gets wrapped to 0 + offset when over allowed length
     * @param value
     * @returns a wrapped index
     *
     * @example `const offset = new Enigma().manageOffset(149);`
     */
    protected manageOffset(value: number): number {
        const len = this.diskLength;
        if (value >= len) {
            let result = value;

            while (result >= len) {
                result = result - len;
            }

            return result;
        } else {
            return value;
        }
    }

    /**
     * Manually Reconfigure this instance of Enigma
     * @param value
     * @returns this
     *
     * @example `new Enigma().configure("A12,E43,B27,FC,cS,yW,kA,iJ");`
     */
    configure(value: EnigmaConfigurationString) {
        if (String(value || "").length === 0) {
            throw new Error("Invalid value length passed to configuration");
        }
        const values = value.split(",");
        if (values.length < 3) {
            throw new Error(`invalid number of disks. Got ${values.length}, Expected 3 or more`);
        }
        const allowedDiskKeys = Object.keys(this.availableDisks);

        const newSetup: string[] = [];
        values.forEach((v) => {
            if (new RegExp("[a-z][0-9]{1,3}", "i").test(v)) {
                const [disk, ...balance] = v.split("");
                const index = balance.join("");

                if (!allowedDiskKeys.some((x) => disk === x)) {
                    throw new Error(
                        `invalid Disk Identifier Passed as ${v}. Got ${disk}, Expected on of [${allowedDiskKeys
                            .map((x) => `"${x}"`)
                            .join(", ")}]`
                    );
                }
                if (Number(index) > this.diskLength) {
                    throw new Error(
                        `invalid Disk Identifier Passed as ${v}. Got ${index}, Expected 0 through ${this.diskLength}`
                    );
                }

                newSetup.push(v.toUpperCase());
            } else if (new RegExp("[a-z]{2}", "i").test(v)) {
                newSetup.push(v);
            } else {
                throw new Error(`unexpected configuration value: "${v}"`);
            }
        });

        this.setup = newSetup.join(",");
        this.transitionalDisks = {};

        return this;
    }

    /**
     * Reset this instance of Enigma to its configuration
     * @returns this
     *
     * @example `new Enigma().reset();`
     */
    reset() {
        const recordSet = this.setup.split(",");

        const newDiskSetup: (keyof typeof this["availableDisks"])[] = [];
        const newIndexSetup: number[] = [];
        const newWireMap: EnigmaDisk = {};

        for (let i = 0; i < recordSet.length; i++) {
            if (new RegExp("^[a-z][0-9]{1,3}$", "i").test(recordSet[i])) {
                const disk = recordSet[i].replace(new RegExp("[0-9]{1,}", "g"), "");
                const offset = Number(recordSet[i].replace(new RegExp("[a-z]{1,}", "gi"), ""));

                if (!this.availableDisks[disk]) {
                    throw new Error(`Disk ${disk} was not found`);
                }
                if (offset >= Object.keys(this.availableDisks.A).length) {
                    throw new Error(`Invalid Offset ${offset} was passed`);
                }

                newDiskSetup.push(disk);
                newIndexSetup.push(offset);
            } else if (new RegExp("[A-Z]{2}", "i").test(recordSet[i])) {
                const [a, b] = recordSet[i].split("");

                if (newWireMap[a] !== undefined) {
                    throw new Error(
                        `"${a}" cannot be connected to "${b}" because "${a}" is already connected to "${newWireMap[a]}"`
                    );
                }
                if (newWireMap[b] !== undefined) {
                    throw new Error(
                        `"${b}" cannot be connected to "${a}" because "${b}" is already connected to "${newWireMap[b]}"`
                    );
                }

                newWireMap[a] = b;
                newWireMap[b] = a;
            } else {
                throw new Error(`Unexpected Setup Value: ${recordSet[i]}`);
            }
        }

        if (newDiskSetup.length < 3) {
            throw new Error(`A minimum of 3 disks are required, found ${newDiskSetup.length}`);
        }

        this.currentDisks = newDiskSetup;
        this.currentIndex = newIndexSetup;
        this.currentWireMap = newWireMap;

        return this;
    }

    /**
     * Passes a Letter through a configured Enigma Drum
     * @param disk The Disk the Letter is being passed through
     * @param letter The Character Being Changed
     * @returns the encrypted Character
     *
     * @example `const translated = new Enigma().throughDisk("A", "X");`
     */
    protected throughDisk(disk: EnigmaChar, letter: EnigmaChar): EnigmaChar {
        const found = this.availableDisks[disk][letter];

        if (found !== undefined) {
            return found;
        } else {
            return letter;
        }
    }

    /**
     * Passes a Letter Between two configured Enigma Drums
     * @param disk1 The Disk the Letter is being passed from
     * @param disk2 The Disk the Letter is being passed to
     * @param passedOffset The Index Offset
     * @param letter  The Character Being Changed
     * @returns the encrypted Character
     *
     * @example `const translated = new Enigma().betweenDisks("A", "B", 4, "X");`
     */
    protected betweenDisks(
        disk1: EnigmaChar,
        disk2: EnigmaChar,
        passedOffset: number,
        letter: EnigmaChar
    ): EnigmaChar {
        const diskKey = this.buildDiskKey(disk1, disk2, passedOffset);

        this.buildTransitionalDisk(disk1, disk2, passedOffset);

        const transitionalDisk = this.transitionalDisks[diskKey];
        const found = transitionalDisk[letter];

        if (found !== undefined) {
            return found;
        } else {
            return letter;
        }
    }

    /**
     * Passes a Letter through the manually configured Wire Map
     * @param letter The letter to translate
     * @returns The translated letter
     *
     * @example `const translated = new Enigma().throughWireBoard("A");`
     */
    protected throughWireBoard(letter: EnigmaChar): EnigmaChar {
        const found = this.currentWireMap[letter];

        if (found !== undefined) {
            return found;
        } else {
            return letter;
        }
    }

    /**
     * Translates a String by passing it through the configured set of Enigma Drums
     * @param value The String be passed converted
     * @returns the result of the string after its passed through the drums
     *
     * @example `const translated = new Enigma().translate("Hello World");`
     */
    translate(value: string): string {
        let translated: string[] = [];
        const diskList = [...this.currentDisks];
        const diskListReversed = [...diskList].reverse();
        const lastDisk = diskList[diskList.length - 1];
        const lastDiskReversed = diskListReversed[diskList.length - 1];
        const halfIndex = this.diskLength / 2;

        const indexes = [...this.currentIndex];
        const indexesReversed = [...indexes].reverse();

        /**
         * Assume the following config for disks: `A B C`
         * input needs to go through this structure
         *
         * WireBoard -> A -> AB -> B -> BC -> C -> CC -> C -> BC -> B -> AB -> A -> WireBoard
         */

        for (let i = 0; i < value.length; i++) {
            let input: EnigmaChar = String(value[i]);

            if (new RegExp("[a-zA-Z0-9]").test(input)) {
                // Through the Wire Board
                input = this.throughWireBoard(input);

                // Right to Left through Disks
                for (let j = 0; j < diskList.length; j++) {
                    const disk = diskList[j];

                    // Handle A, B, C
                    input = this.throughDisk(disk as EnigmaChar, input);

                    // Handle AB, BC
                    if (disk !== lastDisk) {
                        input = this.betweenDisks(
                            disk as EnigmaChar,
                            diskList[j + 1] as EnigmaChar,
                            indexes[j] + i,
                            input
                        );
                    }
                } // for diskList

                // Handle CC - Loop Back through Disks
                input = this.betweenDisks(
                    lastDisk as EnigmaChar,
                    lastDisk as EnigmaChar,
                    halfIndex + i,
                    input
                );

                // Left to Right through Disks
                for (let j = 0; j < diskListReversed.length; j++) {
                    const disk = diskListReversed[j];

                    // Handle C, B, A
                    input = this.throughDisk(disk as EnigmaChar, input);

                    // Handle BC, BA
                    if (disk !== lastDiskReversed) {
                        input = this.betweenDisks(
                            diskListReversed[j + 1] as EnigmaChar,
                            disk as EnigmaChar,
                            indexesReversed[j + 1] + i,
                            input
                        );
                    }
                } // for diskListReversed

                // Back Through the Wire Board
                input = this.throughWireBoard(input);
            } // if character is a-z09

            translated.push(input);
        } // for each Character

        return translated.join("");
    } // close translate

    /**
     * Encode an ASCII string
     * @param value The value to be encoded
     * @returns the encoded UTF8 value
     *
     * @example `const translated = new Enigma().encode("Hello World");`
     */
    encode(value: string): string {
        this.reset();
        const encoded = Buffer.from(value).toString("base64");

        return this.translate(encoded);
    }

    /**
     * Decode a UTF8 value
     * @param value the value to be decoded
     * @returns the decoded ASCII string
     *
     * @example `const translated = new Enigma().decode("Hello World");`
     */
    decode(value: string): string {
        this.reset();
        const decoded = this.translate(value);

        return Buffer.from(decoded, "base64").toString("ascii");
    }
}

export default Enigma;
export { Enigma };
