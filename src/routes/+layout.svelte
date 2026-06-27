<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { initAppState } from '$lib/appState.svelte';

  let { children } = $props();

  onMount(() => {
    void initAppState();
  });
</script>

{@render children()}
