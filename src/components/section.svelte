<script>
	export let command;
	export let runDetail;
	export let param;

	let stored = true;

	function handleClick(event) {
		stored = !stored;
	}
</script>

<div class="section">
	<div class="header" on:click={handleClick}>
		<h3 class="command"><span class="marker">{stored ? "▶" : "▼"}</span>{command}</h3>
	</div>
	{#if !stored}
		<p>{runDetail}</p>
		<table class="param">
			<tr>
				<th>名前</th>
				<th>型</th>
				<th>初期値</th>
				<th>説明</th>
			</tr>
			{#each param as p}
				<tr>
					{#each p as cell}
						<td>{cell}</td>
					{/each}
				</tr>
			{/each}
		</table>
	{/if}
</div>

<style>
	.section {
		margin: 0.5em 0;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding: 0 0.2em;
	}

	.marker {
		display: inline-block;
		width: 1em;
		height: 1em;
		-webkit-user-select: none;
		-moz-user-select: none;
	}

	.header {
		cursor: pointer;
	}

	.param {
		border-collapse: collapse;
		margin: 0.5em;
	}

	.param th,
	.param td {
		padding: 0.2em 0.4em;
		border: 1px solid #ddd;
	}

	.param th {
		text-align: center;
		font-weight: bolder;
	}
</style>
