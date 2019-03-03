# Training Stats
This microservice provides statistics on the training.

## How it works
This microservice will interact with the other microservices of the training area (e.g. /training/session) to get the data.

The data will be used to generate the *statistical data* and that stats data will be **stored in a CACHE**.

When something changes in the rest of the training area (for example a new sessions is created, or a session is completed, etc..), this microservice will **receive a notification event** and will **clear the cache and recompute the stats**.

![Diagram](https://github.com/nicolasances/toto-nodems-training-stats/blob/master/readme-1.jpg)
