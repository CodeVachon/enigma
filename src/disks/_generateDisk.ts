import { writeFileSync } from "fs";
import { resolve } from "path";

type Char = string;

const charList: Char[] = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
];

const randomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};

const buildDisk = (fileName: string = "disk") => {
    const disk: { [key: Char]: Char } = {};
    const list = [...charList];
    while (list.length > 0) {
        const aChar = list.splice(randomInt(0, list.length), 1)[0];
        const bChar = list.splice(randomInt(0, list.length), 1)[0];
        disk[aChar] = bChar;
        disk[bChar] = aChar;
    }

    if (Object.keys(disk).length !== charList.length) {
        throw new Error("Generation Failed");
    }

    writeFileSync(
        resolve(__dirname, `./${fileName}.ts`),
        `
const disk = Object.freeze(${JSON.stringify(disk, null, " ".repeat(2))});

export default disk;
        `
    );
};

const main = () => {
    buildDisk("A");
    buildDisk("B");
    buildDisk("C");
    buildDisk("D");
    buildDisk("E");
};

main();
