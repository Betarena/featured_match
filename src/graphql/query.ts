// ... import necessary libraries;
import { gql } from "@apollo/client"

/**
 * Description:
 * ~~~~~~~~~~~~~
 * Gettng the week fixtures GraphQL
 * query - outline;
*/
export const GET_WEEK_FIXTURES = gql`
    query GetDataQuery {
        week_fixtures {
            away_team_logo
            away_team_name
            country_flag
            fixture_day
            home_team_logo
            home_team_name
            id
            inserted_at
            league_name
            probabilities
            status
            time
            tvstations
            valuebets
        }
    }
`;