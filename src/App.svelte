<svelte:options accessors />

<script>
	import { onMount } from "svelte";
	import { octokit, GithubInfo } from "./main";
	import Section from "./components/section.svelte";

	import Select from "svelte-select";
	export let files;

	let data = [];

	onMount(() => {
		updateFiles();
	});

	function handleSelect(event) {
		fetch(event.detail.download_url)
			.then((res) => res.json())
			.then((d) => {
				data = d;
			});
	}

	function handleClear(event) {
		data = [];
	}

	function updateFiles() {
		octokit
			.request("GET /repos/{owner}/{repo}/contents/{path}", {
				...GithubInfo,
				path: "data",
			})
			.then((res) => {
				res.data.forEach((d) => {
					files.push({
						value: d.path,
						label: d.name,
						download_url: d.download_url,
					});
				});
				files = files;
			});
	}
</script>

<main>
	<Select items={files} on:select={handleSelect} on:clear={handleClear} />
	{#if data !== null}
		{#each data as d}
			<Section {...d} />
		{/each}
	{/if}
</main>

<style>
	main {
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
