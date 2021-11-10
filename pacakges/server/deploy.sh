#!/bin/bash

echo Creating private key file..
echo "$GPG_PRIVATE_KEY" > ./private_key.gpg

echo Importing private key..
gpg --batch --passphrase $PASS --import ./private_key.gpg

echo Decryping..
gpg --yes --pinentry-mode=loopback --passphrase $PASS -d -o ./Rocket.toml /app/pacakges/server/Rocket.toml.gpg
rm /app/pacakges/server/Rocket.toml.gpg

echo Deploying..
