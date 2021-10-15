## This is the code and development of the `Betarena` Featured Match Widget

This widget consist of having a fully responsive and tailored to the design from Figma

LIVE VIEW - `<INPUT LIVE LINK HERE>`

❗ - Some of the country codes are not in-line with the ones on the Firebase DB and will have to be manually adjsuted to fit inline with the country codes
used by the `GeoJS` API - `https://dev.maxmind.com/geoip/legacy/codes`.

## The Widget

### Mobile view

![image](https://user-images.githubusercontent.com/20924663/137518538-3ffb855e-ced6-497a-82f3-8d279ee6af0b.png)

### Tablet/Desktop view

![image](https://user-images.githubusercontent.com/20924663/137518604-3ba164c8-559f-4269-b14b-9b49f294563f.png)

The Widget is fully responsive and higlhy dynamic to adjsut to any screen size and correctly display the data as outlined in the desgin-test. In line with the `GitHub Project` Task board card, this widget displays data for a user on a target featured sites in accordance to the `GeoPosition`, from which the correct `data` of the featured-match is rendered accordingly into the widget using the data from the Hasura (PostgresDB) & FirebaseDB in conjuction with the Platform Language (to be implemented), to correctly obtain the users feartured match data.

## Database (PostgresDB) #1

For the database, `Hasura` DB (PostgresDB) hosted on the Betarena Server, is used to populated periodically the data for the upcoming fixtures.

## Database (Firebase) #2

For the second database, the `FirebaseDB` Firestore was used, for the loading of the data to for the user's contry and `fixture odds`.

The `Firebase Realtime Database` was used, for which the following documentation was used:
https://firebase.google.com/docs/database

### Firebase Structure

All of the connection and initialization of the use of Firebase on the App is stored inside the `src\firebase\init.ts`

... with the FirebaseDB methods being stored inside the `src\firebase\index.ts`

### Firebase Interfaces Used

To correctly interact with the Fireabse Data the following interfaces were used to manage and access the data correctly, stored inside the `src\models\firebase-real-db-interface.ts` file.

## Geolocation

This widget is Geolocation based and upon locading the widget, the component checks the user location by making a simple request to the `GeoJS` API through the `url` - `https://get.geojs.io/v1/ip/geo.json`

The widget handles the response form the `GeoJS` API using the following consturcted interface, located inside the `src\models\geo-js-interface.ts` file:

![code](https://user-images.githubusercontent.com/20924663/128641768-be309c11-b276-40c9-bfeb-8fb0bff3945c.png)

## Svelte Appollo

For the ability to use `GraphQL` for the Widget in Svelte, `svelte-appollo` was used: ![svelte-apollo](https://github.com/timhall/svelte-apollo), paired with the docuemntation from ![`Hasura`](https://hasura.io/learn/graphql/svelte-apollo/queries/2-create-query/) to have the widget working correctly.

Future expansion: https://dev.to/lucis/update-apollo-cache-after-a-mutation-and-get-instant-benefits-on-your-ui-1c3b

## localStorage()

The widget stores the users `one-off` voting using the `.localStorage()` for the ability to give the user a history of past votings.