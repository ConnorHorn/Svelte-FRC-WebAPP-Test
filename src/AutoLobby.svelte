<script>
    import {attentionAlert} from "./stores";
    import {startPosX} from "./stores";
    import {startPosY} from "./stores";
    import {autoStage} from "./stores";
    import {pageLoadNoClick} from "./stores";
    let attentionAlertValue;
    import { fade, fly } from 'svelte/transition';
    const attentionAlertSubscription = attentionAlert.subscribe(value => {
        attentionAlertValue = value;
    });
    let storeStartX;
    let storeStartY;
    let autoStageValue;
    let selectX;
    let selectY;
    let tarmacLoad = false;
    let pageLoadNoClickValue;

    //delays the tarmac load animation cuz it looks cool
    setTimeout(function() {
        tarmacLoad = true;
    }, 200);


    //all these subscriptions are stupid because I was stupid, just use $variableName to access the variables in stores.js
    const startXSub = startPosX.subscribe(value => {
        selectX = value;
    });

    const pageLoadNoClickSub = pageLoadNoClick.subscribe(value => {
        pageLoadNoClickValue = value;
    });
    const startYSub = startPosY.subscribe(value => {
        selectY = value;
    });
    const autoStageSub = autoStage.subscribe(value => {
         autoStageValue = value;
    });

    pageLoadNoClick.update(n=>true);


    //detects click on the tarmac png and reports the client side x,y coords of the click
    function tarmacClick(event){
        startPosX.update(n=>event.clientX);
        startPosY.update(n=>event.clientY);
        pageLoadNoClick.update(n=>false);
    }

    //delayed start of the main auto section
    function startAuto(){
        setTimeout(function() {
            autoStageValue+=1;
            autoStage.update(n=>n+1);
        }, 200);


    }
</script>

<!--big green start auto button, loads in chevron svgs -->
<button class="btn btn-outline btn-success gap-2 mt-36 ml-36 w-72 h-48 text-2xl absolute" on:click={startAuto}>
    Begin Auto
    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
</button>


<!--the icon for when you click the tarmac png. Does differenet animations depending on state of test of application. Bad implementation, dont do it this way-->
<svg class="overflow-visible absolute z-30" >
    {#if !pageLoadNoClickValue}
        <svg in:fade out:fade x={selectX-110} y={selectY-165} xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 z-30 overflow-visible" fill="none" viewBox="0 0 50 50" stroke="#2563eb"><path  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {:else}
        <svg in:fade="{{duration: 3000 }}" out:fade x={selectX-110} y={selectY-165} xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 z-30 overflow-visible" fill="none" viewBox="0 0 50 50" stroke="#2563eb"><path  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

    {/if}


</svg>



<!--loads tarmac png and handles the fly in animation-->
{#if tarmacLoad}
    <div class=" float-right w-3/7 mr-24 relative z-10">
    <p in:fly="{{ y: 400, duration: 2000 }}" out:fade>

        <img on:click={tarmacClick} src="static/images/tarmac.png" alt="Pic Name"  class="w-full"/>
    </p>
    </div>

{/if}





