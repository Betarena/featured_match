/**
 * INSTANTIATE APOLLO CLIENT
 * ------------------
 * & methods; 
*/
import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client'
import { setClient } from "svelte-apollo"
import { gql } from "@apollo/client"
import { query } from "svelte-apollo"

/**
 * Description:
 * ~~~~~~~~~~~~~~~~~
 * Create the Appolo Client;
 * 
 * @param authToken 
 * @returns 
*/
function createApolloClient(authToken: string): ApolloClient < NormalizedCacheObject > {
    console.log('initialzied-auth-token-4-de-app!')
    const client = new ApolloClient({
        uri: "https://betarena.hasura.app/v1/graphql",
        headers: {
            'x-hasura-admin-secret': `${authToken}`,
        },
        cache: new InMemoryCache()
    });
    return client;
}

/**
 * Description:
 * ~~~~~~~~~~~~~~~~~ 
 * Initialize the Apollo Client;
 * Using (createApolloClient)
*/
export function init_ApolloClient(): void {
    let authToken: string = 'uLn1kwxATlpWXpQnB2338EZjHgER0C9L9BcytqnCi2Vne9ePCAF7WRrZuOZjP7ie';
    const client = createApolloClient(authToken);
    setClient(client);
}