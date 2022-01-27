import DiskA from "./disks/A";
import DiskB from "./disks/B";
import DiskC from "./disks/C";
import DiskD from "./disks/D";
import DiskE from "./disks/E";

type Char = string;
type IDisk = { [key: Char]: Char };
type IAvailableDisks = Record<Char, IDisk>;

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
    readonly availableDisks: IAvailableDisks = {
        A: DiskA,
        B: DiskB,
        C: DiskC,
        D: DiskD,
        E: DiskE
    };

    /**
     * Transitional Disks Setup by the System
     */
    private transitionalDisks: IAvailableDisks = {};

    /**
     * Base Setup of the Enigma Encoder
     */
    private setup: EnigmaConfigurationString = "A12,E43,B27";
    /**
     * Current Configured Disks
     */
    private currentDisks: (keyof typeof this["availableDisks"])[] = ["A", "B", "D"];
    /**
     * Current Configured Index for the Disks
     */
    private currentIndex: number[] = [12, 43, 27];
    /**
     * The Length of the Disk Keys in the System - Used in `this.manageOffset` rollover
     */
    private diskLength: number = Object.keys(DiskA).length;

    /**
     * Build an Enigma Instance
     * @param diskConfiguration Pass in an initial configuration
     * @returns a configured Enigma Instance
     */
    constructor(diskConfiguration: EnigmaConfigurationString = "") {
        if (diskConfiguration.length > 0) {
            this.configure(diskConfiguration);
        }
        this.reset();

        return this;
    }

    /**
     * Manually Reconfigure this instance of Enigma
     * @param value
     * @returns this
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
        values.forEach((v) => {
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
        });

        this.setup = String(value).toUpperCase();
        this.transitionalDisks = {};

        return this;
    }

    /**
     * Reset this instance of Enigma to its configuration
     * @returns this
     */
    reset() {
        const recordSet = this.setup.split(",");

        const newDiskSetup: (keyof typeof this["availableDisks"])[] = [];
        const newIndexSetup: number[] = [];

        for (let i = 0; i < recordSet.length; i++) {
            const disk = recordSet[i].replace(new RegExp("[0-9]{1,}", "g"), "");
            const offset = Number(recordSet[i].replace(new RegExp("[a-z]{1,}", "gi"), ""));

            if (!this.availableDisks[disk]) {
                throw new Error(`Disk ${disk} was no found`);
            }
            if (offset >= Object.keys(this.availableDisks.A).length) {
                throw new Error(`Invalid Offset ${offset} was passed`);
            }

            newDiskSetup.push(disk);
            newIndexSetup.push(offset);
        }

        if (newDiskSetup.length < 3) {
            throw new Error(`A minimum of 3 disks are required, found ${newDiskSetup.length}`);
        }

        this.currentDisks = newDiskSetup;
        this.currentIndex = newIndexSetup;

        return this;
    }

    /**
     * Ensure that the provided index gets wrapped to 0 + offset when over allowed length
     * @param value
     * @returns a wrapped index
     */
    manageOffset(value: number): number {
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
     * Passes a Letter through a configured Enigma Drum
     * @param disk The Disk the Letter is being passed through
     * @param letter The Character Being Changed
     * @returns the encrypted Character
     */
    throughDisk(disk: Char, letter: Char): Char {
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
     */
    betweenDisks(disk1: Char, disk2: Char, passedOffset: number, letter: Char): Char {
        const offset = this.manageOffset(passedOffset);
        const diskKey = `${disk1}${disk2}${offset}`;

        // Build the Transitional Disk when required
        if (this.transitionalDisks[diskKey] === undefined) {
            const selectedDisk1 = this.availableDisks[disk1];
            const selectedDisk2 = this.availableDisks[disk2];
            const keyList = Object.values(selectedDisk1);

            const valueListBefore = Object.keys(selectedDisk2);
            const offsetList = valueListBefore.splice(0, this.manageOffset(offset));
            const valueList = valueListBefore.concat(offsetList);

            const tempDisk: IDisk = {};
            const used: Char[] = [];

            while (used.length <= Object.values(selectedDisk1).length) {
                const newKey = keyList.filter((v) => !used.some((y) => y === v)).pop();
                const newValue = valueList
                    .filter((v) => !used.some((y) => y === v))
                    .filter((v) => v !== newKey)
                    .pop();

                if (newKey === undefined) {
                    break;
                }
                if (newValue === undefined) {
                    break;
                }

                used.push(newKey);
                used.push(newValue);

                tempDisk[newKey] = newValue;
                tempDisk[newValue] = newKey;
            }

            this.transitionalDisks[diskKey] = tempDisk;
        }

        const transitionalDisk = this.transitionalDisks[diskKey];
        const found = transitionalDisk[letter];

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
         * A -> AB -> B -> BC -> C -> CC -> C -> BC -> B -> AB -> A
         */

        for (let i = 0; i < value.length; i++) {
            let input: Char = String(value[i]);

            if (new RegExp("[a-zA-Z0-9]").test(input)) {
                for (let j = 0; j < diskList.length; j++) {
                    const disk = diskList[j];

                    // Handle A, B, C
                    input = this.throughDisk(disk as Char, input);

                    // Handle AB, BC
                    if (disk !== lastDisk) {
                        input = this.betweenDisks(
                            disk as Char,
                            diskList[j + 1] as Char,
                            indexes[j] + i,
                            input
                        );
                    }
                }

                // Handle CC
                input = this.betweenDisks(lastDisk as Char, lastDisk as Char, halfIndex + i, input);

                for (let j = 0; j < diskListReversed.length; j++) {
                    const disk = diskListReversed[j];

                    // Handle C, B, A
                    input = this.throughDisk(disk as Char, input);

                    // Handle BC, BA
                    if (disk !== lastDiskReversed) {
                        input = this.betweenDisks(
                            diskListReversed[j + 1] as Char,
                            disk as Char,
                            indexesReversed[j + 1] + i,
                            input
                        );
                    }
                }
            }

            translated.push(input);
        }

        return translated.join("");
    }

    /**
     * Encode an ASCII string
     * @param value The value to be encoded
     * @returns the encoded UTF8 value
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
     */
    decode(value: string): string {
        this.reset();
        const decoded = this.translate(value);

        return Buffer.from(decoded, "base64").toString("ascii");
    }
}

export default Enigma;
export { Enigma };