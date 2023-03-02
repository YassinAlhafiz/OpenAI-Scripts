# Open AI Scripts

This project contains a group of scripts that can be run ato automate openai chat and text completions. Follow the steps to set up and run the project.

## Create `.env` file
#
- Create a `.env` file in the root of your project
- Add the `OPEN_AI_API` parameter with you openai api key

Your `.env` file should look something like this
```.env
OPEN_AI_API="<openai-api-key>"
```

## Scripts
#
- `completion.js`: Root tool to invoke chat and text completions, defaulted to `chat` completions
- `summerization.js`: Can summerize text and urls into a list of key points