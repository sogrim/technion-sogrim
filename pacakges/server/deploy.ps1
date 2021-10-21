Write-Output "web: ROCKET_PORT=$PORT ROCKET_ENV=prod ./target/release/server-dep-sort.exe" > Procfile
# Dynamically binds Rocket to the Dyno's $PORT on 0.0.0.0
Write-Output "VERSION=nightly" > RustConfig
# Ensures the buildpack uses Rust nightly
git add . and git commit -m "Add Heroku deploy configuration"
git push heroku master