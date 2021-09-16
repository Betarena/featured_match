/**
 * FIREBASE FUNCTIONS
 * ------------------
 * & methods; 
*/
import { get } from '../api/utils'
import { db, db_real } from '../firebase/index'

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
            console.info('Data for' + `${lang}` + 'Written!')
        })
        db_real.ref('featured_betting_sites/' + lang).update({'title': 'Top Bookmekers from the US'})
        db_real.ref('featured_betting_sites/' + lang).update({'show_more_less': ['Show full list', 'Show less']})
    });
}