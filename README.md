# Autofeur

Bot that responds with end of words

## Structure

Autofeur is composed of a few components that make up this bot

|Name|Description|
|-|-|
|autofeur_nova|This is the component for handling discord events, it uses the [nova framework](https://github.com/discordnova/nova) under the hood and is developped with TypeScript|
|deep_phonemizer|This is the component that transforms a grapheme into a phoneme using [DeepPhonemizer](https://github.com/as-ideas/DeepPhonemizer)|
|autofeur_db|This is the component used for completing te end of the words, its a DB specialized into completing this specific task|

## Running Autofeur

### Getting trained models

You'll need two files to get running with Autofeur, a trained `DeepPhonemizer` model and a IPA Dictionary file.

You can get the `DeepPhonemizer` model on the project [github page](https://github.com/as-ideas/DeepPhonemizer#pretrained-models) or follow the instructions there to create your own datasets.

You can get the IPA Dictionary on this [github page](https://github.com/open-dict-data/ipa-dict) or use your own, it's simply a CSV file with two columns, one for the word and another for the phonemized word.

### Starting `deep_phonemizer`

To run it inside docker, we recommand
`docker-compose up deep-phonemizer`
If you want to use bare metal, follow the following commands
You'll need to move your trained model into the `deep_phonemizer/assets/model.pt` file.

```sh
# Go into the folder
cd deep_phonemizer
# Create a Virtual environment with dependencies
python3 -m venv ./venv
source ./venv/bin/activate
pip install -r requirements.txt

# Run the flash application
flask run
```

### Starting `autofeur_db`

#### Generating the database
The autofeur DB needs to be pre-computed in order to deliver excellent performance.
First of all, you to have your dictionary file in the `autofeur_db/assets/dictionary.csv` file.
Only then you can start generating the DB.
```sh
cd autofeur_db
cargo run --release --bin generate
```

This will output a `autofeur_db/assets/db.bin` which will be used for the db to complete words.

### Starting the service
To start `autofeur_db` you can simply use the docker-container `docker-compose up autofeur_db`
or use the bare-metal command
```sh
cd autofeur_db
cargo run --release --bin server
```

### Starting the nova components
You'll need nova to use this bot, however setup is quite easy and only requires a configuration file
you can find on the [GitHub's project](https://github.com/discordnova/nova) or use this project example config file located in `autofeur_nova/config/default.example.yml`.
Your config file will need to be named `autofeur_nova/config/defauly.yml`.

To start nova, you can either use the `all-in-one` binary or the full blown docker compose services
to get started using the all in one binary, simply execute `yarn nova` in the `autofeur_nova/` folder. Or you can simply execute `docker-compose up nats redis cache gateway0 rest ratelimiter webhook` to start all nova components.

### Starting `autofeur_nova`
This component requires basically no configuration as it is configured in docker using environment variables and defaults work using localhost, you cant refer to the component readme to get the configuration environment variables available. `yarn start` or `docker-compose up autofeur_nova`
