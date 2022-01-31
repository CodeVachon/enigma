# Enigma

A Cypher Library based on the Enigma Machine.

Learn [More About The Enigma Machine](https://en.wikipedia.org/wiki/Enigma_machine)

## What is Does

Using the `encode` method of this module will `base64` encode the provided string, cycle it through the configured disks effectively encrypting the string.

That same string can then be passed into the `decode` method which will run the string back through the configured disks restoring the original `base64` encoded string which is then restored to the original string.

## Usage

```ts
import { Enigma } from "@codevachon/enigma";

const EnigmaConfig = "A32,E12,C44";
const myString = "Lorem Ipsum";

const encoded = new Enigma(EnigmaConfig).encode(myString);

const decoded = new Enigma(EnigmaConfig).decode(myString);
```
