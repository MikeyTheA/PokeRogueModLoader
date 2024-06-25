<picture><img src="./public/images/logo.png" width="300" alt="PokéRogue"></picture> <picture><img src="./public/images/moderogue-no-text4x.png" width="60" alt="PokéRogue"></picture>

![](https://img.shields.io/github/stars/MikeyTheA/PokeRogueModLoader) ![](https://img.shields.io/github/issues/MikeyTheA/PokeRogueModLoader) ![Discord](https://img.shields.io/discord/1251472855191916618)


PokéRogue is a browser based Pokémon fangame heavily inspired by the roguelite genre. Battle endlessly while gathering stacking items, exploring many different biomes, fighting trainers, bosses, and more!

And PokeRogueModLoader is a mod loader for PokéRogue

You can find a running instance of PokeRogueModLoader at [mokerogue.net](https://mokerogue.net/)

Join our [Discord](https://discord.com/invite/M8suCFtF7c) for updates and help

# Contributing

## Mod Development
You can find the wiki [here](https://github.com/MikeyTheA/PokeRogueModLoader/wiki)

Use [PRModLoaderExternalEditor](https://github.com/MikeyTheA/PRModLoaderExternalEditor) for making mods, look in its readme to see how to publish a mod to the mod browser.

## 🛠️ Mod Loader Development
If you have the motivation and experience with Typescript/Javascript (or are willing to learn) please feel free to fork the repository and make pull requests with contributions. If you don't know what to work on but want to help, reference the below **To-Do** section or the **#feature-vote** channel in the discord. 

### 💻 Environment Setup
#### Prerequisites
- node: 20.13.1
- npm: [how to install](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

#### Running Locally
1. Clone the repo and in the root directory run `npm install`
    - *if you run into any errors, reach out in the **#loader-development** channel in discord*
2. Run `node generateImports.js`
3. Run `npm run start:dev` to locally run the project in `localhost:8000`

#### Linting
We're using ESLint as our common linter and formatter. It will run automatically during the pre-commit hook but if you would like to manually run it, use the `npm run eslint` script. 

### ❔ FAQ 

## 🪧 To Do
Check out [Github Issues](https://github.com/pagefaultgames/pokerogue/issues) to see how you can help us!

## Credits
Check the [original PokeRogue repository](https://github.com/pagefaultgames/pokerogue/) to see PokeRogue credits, PokeRogueModLoader is mainly made by MikeyTheA 