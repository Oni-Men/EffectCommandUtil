import { Octokit } from "octokit";
import App from "./App.svelte";

export const octokit = new Octokit();
export const GithubInfo = {
	owner: "Oni-Men",
	repo: "EffectCommandUtil",
};

const app = new App({
	target: document.body,
	props: {
		files: [],
	},
});

export default app;
