# sw-server

The backend server of Scale Workshop for storing and retrieving scales

## Project setup

### Dot env setup

Copy the template:

```bash
cp .env.template .env
```

Create the directories listed in the configuration:

```bash
mkdir /tmp/sw
mkdir /tmp/sw/scale
mkdir /tmp/sw/envelope
```

### Install and run using bun

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```

This project was created using `bun init` in bun v1.1.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
