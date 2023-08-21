# Otenki Girl

## Install Dependencies

```bash
npm i --production # For production environment
npm i # For development environment
```

## Edit Configurations

Create and edit file `config.js` at the root of the project.

Configuration is same as `config.default.js`, and it will cover the default configuration.

## Build

```bash
npm run build # Build for production environment
npm run build:dev # Build for development environment
```

## Run

Before starting the app, you should init the database.

```bash
npm run init
```

Then you can start the app.

```bash
npm start # Run for production environment
npm run dev # Run for development environment
```

## Change Language

type at front-end console:

```javascript
setLanguage('ja') // set language for example
resetLanguage() // reset language
```
