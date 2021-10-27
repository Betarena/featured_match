/**
 * FIREBASE FUNCTIONS
 * ------------------
 * & methods; 
*/
import { get } from '../api/utils'
import { db, db_real } from './init'

import type { GeoJsResponse } from "../models/geo-js-interface";
import type { FeaturedSite, FinalFeaturedSiteResponseDB } from "../models/firebase-real-db-interface"; 


/**
 * A simple quick & easy function
 * to populate the DB with data,
 * [ONE TIME - DISPOISABLE - DEV ONLY]
*/
export function writeData() {
    // example data writing;

    let countryArr = [
        // 'be', 
        // 'co', 
        // 'en', //
        // 'gb',
        // 'es', 
        // 'pt',/
    ]
    let betSitesArr = [
        'bet365',
        '1xbet',
        '22Bet',
        'Betboro',
        'Betfair',
        'bet365'
    ]
    countryArr.forEach(lang => {
        betSitesArr.forEach(featuredData => {
            let counter = 1
            let data: FeaturedSite = {
                position: counter,
                featured_image: 'https://www.betarena.com/wp-content/uploads/2021/08/bet-365_ad.svg',
                image: 'https://www.betarena.com/wp-content/uploads/2021/08/bet-365_ad.svg',
                name: featuredData,
                rating: 4,
                bonus: '500',
                description: `Open an account with bet365 today and bet on a huge 
                                range of markets with the world’s favourite online sports betting company.`,
                conditions: 'No code required',
                conditions_head: '200% Bonus up to $200',
                cta_link: 'https://qg9t2.app.goo.gl/bet365_general',
            }
            counter++
            // write the data to the `real-db`;
            db_real.ref('featured_betting_sites/' + lang + '/' + featuredData).update(data)
            // console.info('Data for' + `${lang}` + 'Written!')
        })
        db_real.ref('featured_betting_sites/' + lang).update({'title': 'Top Bookmekers from the US'})
        db_real.ref('featured_betting_sites/' + lang).update({'show_more_less': ['Show full list', 'Show less']})
    });
}

/**
 * Description:
 * ~~~~~~~~~~~~~~~~~
 * Obtain the data from the `real_db` firebase DB
 * according to the users current geo-location
 * 
 * @param userGeoLocation
*/
export async function getTargetFixtureOdds(fixture_data: any): Promise<any> {
    // ... convert the datetime to the correct variables;
    // console.log('fixture_data', fixture_data);
    let date = new Date(fixture_data.date)
    let year_ = new Date(fixture_data.date).getFullYear().toString()
    let month_ = new Date(fixture_data.date).getMonth()
    let new_month_ = (month_ + 1).toString()
    new_month_ = ("0" + new_month_).slice(-2)
    let day_ = new Date(fixture_data.date).getDate().toString()
    day_ = ("0" + day_).slice(-2)
    let fixtureId = fixture_data.fixture_id
    let lang = fixture_data.lang

    let sportbook_details = await getTargetGeoSportBookDetails(lang);

    // ... return the odds-site info & the odds values;
    return db_real.ref()
        .child('odds')
        .child(year_)
        .child(new_month_)
        .child(day_)
        .child(fixtureId)
        .get()
        .then((snapshot) => {
        // ... check if the data exists (should exist at all times anyway);
        if (snapshot.exists()) {
            // console.info('data from Real DB', [snapshot.val()])
            
            let fixture_odds = snapshot.val()
            let fixture_odds_keys = Object.keys(snapshot.val())
            // ... get the `sportbook-details` data;

            let map = new Map()

            // ... iterate over the data of the `lang` in sportbook details;
            for (let rankedOdd in sportbook_details) {
                // ... iterate over the data of the fixture avaiable ODDS;
                for (let avaiableOdd in fixture_odds_keys) {
                    // ... check for a match of the odds names;
                    if (fixture_odds_keys[avaiableOdd].toString().toLowerCase() == sportbook_details[rankedOdd]['title'].toString().toLowerCase()) {
                        // console.log('Match Found!')
                        let targetFixture = fixture_odds_keys[avaiableOdd]
                        let fixtureOdd = fixture_odds[targetFixture]
                        map.set('fixture_odds', fixtureOdd)
                        map.set('fixture_odds_info', sportbook_details[rankedOdd])
                    }
                }
            }

            const obj = Object.fromEntries(map);

            // return the response as an Array;
            return obj
        } else {
            throw new Error('Data from DB is incorrect');
        }
    })
}

/**
 * Description:
 * ~~~~~~~~~~~~~~~~~
 * Obtain the data from the `real_db` firebase DB
 * according to the users current geo-location
 * 
 * @param userGeoLocation
*/
export async function getTargetGeoSportBookDetails(lang: string, siteName?: string): Promise< any > {
    // ... return the odds-site info & the odds values;
    if (siteName != undefined) {
        // console.log('siteName', siteName);
        return db_real.ref()
            .child('sportsbook_details')
            .child(lang)
            .get()
            .then((snapshot) => {
            // ... check if the data exists (should exist at all times anyway);
            if (snapshot.exists()) {
                // console.info('data from Real DB', [snapshot.val()])
                
                let map = new Map();
                let sportbook_details_ = snapshot.val()

                for (let rankedOdd in sportbook_details_) {
                    // ... check for a match of the odds names;
                    if (siteName.toLowerCase().toString() == sportbook_details_[rankedOdd]['title'].toLowerCase().toString()) {
                        // console.log('Match Found!')
                        map.set('betting_site_info', sportbook_details_[rankedOdd])
                    }
                }

                const obj = Object.fromEntries(map);
                
                // ... return the response as an Array;
                return obj
            } else {
                throw new Error('Data from DB is incorrect');
            }
        })
    } else {
        return db_real.ref()
            .child('sportsbook_details')
            .child(lang)
            .get()
            .then((snapshot) => {
            // ... check if the data exists (should exist at all times anyway);
            if (snapshot.exists()) {
                // console.info('data from Real DB', [snapshot.val()])
                
                // return the response as an Array;
                return snapshot.val()
            } else {
                throw new Error('Data from DB is incorrect');
            }
        })
    }
}
