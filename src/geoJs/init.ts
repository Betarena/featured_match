/**
 * GEOJS FUNCTIONS
 * ------------------
 * & methods; 
*/
import { get } from '../api/utils'

import type { GeoJsResponse } from "../models/geo-js-interface";

/**
 * Description:
 * ~~~~~~~~~~~~~~~~~
 * Checks for the users location
 * and stores it for future use
*/
export async function getUserLocation(): Promise < GeoJsResponse > {
    const response = await get(`https://get.geojs.io/v1/ip/geo.json`)
    // console.info('GoeJS Response', response)
    return response
}