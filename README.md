# Enigma

A Cypher Library based on the Enigma Machine.

Learn [More About The Enigma Machine](https://en.wikipedia.org/wiki/Enigma_machine)

## What is Does

Using the `encode` method of this module will `base64` encode the provided string and cycles it through the configured disks and wire maps effectively encrypting the provided string.

That same string can then be passed into the `decode` method which will run the string back through the configured disks restoring the original `base64` encoded string which is then decoded and returned to the original provided string.

Each character passed into `translate` is transformed through a set of functions which change configuration on every character passed in.

```
Letter -> [WireMap] -> [A] -> [AB[i]] -> [B] -> [BC[i]] -> [C]
                                                            |
                                                        [CC[0.5]]
                                                            |
Result <- [WireMap] <- [A] <- [AB[i]] <- [B] <- [BC[i]] <- [C]
```

Every time a character is cycled through the disks increased the value of `i` by 1. A Generated disk mapping is created by meshing the disks on either side where one of the disks characters is rotated by the index which creates a new path between each disk on every character.

Because each character passed into `translate` is changed 11 to 13 times depending on if the resulting character matches a value in the wire map, and each character goes through a different map, the resulting string becomes difficult to decipher without knowing all of the potential path ways.

This also means the the string `Hello` could potentially become `uEk4k`.

> **IMPORTANT**
>
> an Encoded String can **ONLY** be decoded by the exact same configuration. Therefor it is recommended that configuration for the instance be provided.

## Usage

```ts
import { Enigma } from "@codevachon/enigma";

const EnigmaConfig = "A32,E12,C44,fD,rs,Rv";
const myString = "Lorem Ipsum";

const encoded = new Enigma(EnigmaConfig).encode(myString);
// -> k5lPsgjA8sIpyKp=

const decoded = new Enigma(EnigmaConfig).decode(encoded);
// -> Lorem Ipsum
```

## Configuration

The configuration string is designed to be passed in directly from an environment file. It is a comma separated value list where each value represents a "Disk" configuration or a "Wire Mapping".

### Disk Configuration

> **Example**: `A34`

This value represents a Disk inserted into the Enigma Machine and its starting index from `0`.

Disks are labelled `A` through `E` and contain wire mappings for characters `A` through `Z`, `a` through `z` and `0` through `9`.

### Wire Mapping

> **Example**: `hT`

This value represents a wire being connected from the first letter to the second letter. As such, each letter can only be used once when configuring the enigma machine. Using values `hT` and `lY` as an example: passing the string "hello" through the wire map would produce `TeYYo` and passing "TeYYo" back through would produce "hello".

Wire Mappings are only done between characters `A` through `Z` and `a` through `z`

### Unmatched Characters

Characters that are unmatched through the system are simply passed through the system unchanged.
