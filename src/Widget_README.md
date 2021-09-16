## This is the code and development of the `Betarena` Featured Matchbetting Sites Widget

This widget consist of having a fully responsive and tailored to the design from Figma

LIVE VIEW - `<INPUT LIVE LINK HERE>`

❗ - Some of the country codes are not in-line with the ones on the Firebase DB and will have to be manually adjsuted to fit inline with the country codes
used by the `GeoJS` API - `https://dev.maxmind.com/geoip/legacy/codes`.

## The Widget

### Mobile view

![image](https://user-images.githubusercontent.com/20924663/131053594-c81db8bb-66f0-4b57-9413-61dd3aefe394.png)

### Tablet/Desktop view

![image](https://user-images.githubusercontent.com/20924663/131053689-87461c9c-a85f-48a3-b0e6-47ec776213c8.png)

The Widget is fully responsive and higlhy dynamic to adjsut to any screen size and correctly display the data as outlined in the desgin-test. In line with the `Asana` Task board card, 
this widget displays data for a user on a target match-betting site in accordance to the `GeoPosition`, from which the correct `data` of the featured-betting sites is rendered accordingly into the widget.

The widget has been split into to components, for easier managment of the code and cumbersome `svg` manipulation:
- `src\components\_BronzeCup.svelte` , `src\components\_GoldCup.svelte` & `src\components\_SilverCup.svelte` -> contain `.svelte` svg components for the better svg manipulation and **clutter-free** main html file,
- `src\components\_FeaturedBettingSitesWidget.svelte` -> contains the main widget code, both for `mobile` & `tablet/desktop` versions.
- `src\components\_FeaturedSiteRow.svelte` -> contains the main `row` for the widget of the featured-widget sites list.

## Database

For the database, `Firebase` was used to store the necessary data of the local user location and language.

The `Firebase Realtime Database` was used, for which the following documentation was used:
https://firebase.google.com/docs/database

### Firebase Structure

All of the connection and initialization of the use of Firebase on the App is stored inside the `src\firebase\index.ts`

![image](https://user-images.githubusercontent.com/20924663/131053948-aa446ded-4fbd-4a57-801b-a13c20cbd0b4.png)

### Firebase Interfaces Used

To correctly interact with the Fireabse Data the following interfaces were used to manage and access the data correctly, stored inside the `src\models\firebase-real-db-interface.ts` file.

![code](https://user-images.githubusercontent.com/20924663/131054121-048ca252-6de2-45d8-9620-27586062e9be.png)

## Geolocation

This widget is Geolocation based and upon locading the widget, the component checks the user location by making a simple request to the `GeoJS` API through the `url` - `https://get.geojs.io/v1/ip/geo.json`

The widget handles the response form the `GeoJS` API using the following consturcted interface, located inside the `src\models\geo-js-interface.ts` file:

![code](https://user-images.githubusercontent.com/20924663/128641768-be309c11-b276-40c9-bfeb-8fb0bff3945c.png)