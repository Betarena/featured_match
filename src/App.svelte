<!-- ===================
	COMPONENT JS - BASIC 
    [TypeScript Written]
=================== -->

<script lang="ts">
	import Featured_Match_Widget from './components/_Featured_Match_Widget.svelte'

	import { init_ApolloClient } from './functions/init_apollo'

	init_ApolloClient();

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