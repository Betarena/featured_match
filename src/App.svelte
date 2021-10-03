<!-- ===================
	COMPONENT JS - BASIC 
    [TypeScript Written]
=================== -->

<script lang="ts">
	import Featured_Match_Widget from './components/_Featured_Match_Widget.svelte'
	import { fixtureVote } from './store/vote_fixture'
	import { init_ApolloClient } from './graphql/init_apollo'
	import { onMount } from 'svelte';

	init_ApolloClient();

	// ... kickstart the .localStorage();
	onMount(async() => {
		// Before we can use set on country we need to call the
		// useLocalStorage doing this at the _layout file makes
		// all routes and components exposed to this so we can
		// import the state and call set anywhere like Btn.svelte
		fixtureVote.useLocalStorage()
		// Log it to make sure it works client side
		// console.log(localStorage.getItem('cart'));
		// solution to JSON Err,
		// localStorage.clear();
	})

	// export let name: string
</script>

<!-- ===================
	COMPONENT STYLE
=================== -->

<style>

</style>

<!-- ===================
	COMPONENT HTML
=================== -->

<Featured_Match_Widget />