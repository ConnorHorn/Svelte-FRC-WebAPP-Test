<script>
    import {climbAttemptLevel, climbSuccessLevel} from "./stores";

    let heightAtt=0;
    let heightSucc=0;

    //runs checkLevels whenever these variables change
    $: {
        checkLevels(heightAtt);
        checkLevels(heightSucc);
    }
    //Updates the stored variables. Makes sure that success cant be higher than attempt
    function checkLevels(){
        if(heightSucc>heightAtt){
            heightAtt=heightSucc;
        }
        climbAttemptLevel.update(n=>heightAtt);
        climbSuccessLevel.update(n=>heightSucc);
    }
    //I hate subscriptions
    const attemptSub = climbAttemptLevel.subscribe(value => {
        heightAtt = value;
    });

    const successSub = climbSuccessLevel.subscribe(value => {
        heightSucc = value;
    });

</script>

<!--The big line things-->
<input type="range" min="0" max="4" bind:value={heightAtt} class="range range-lg range-secondary -rotate-90 w-96 absolute ml-16 mt-60" step="1" />
<input type="range" min="0" max="4" bind:value={heightSucc} class="range range-lg range-accent -rotate-90 w-96 absolute ml-40 mt-60" step="1" />

<div class="leading-[90px] font-bold text-xl ml-[382px] mt-[27px]">
    Traverse<br>
    High<br>
    Mid<br>
    Low<br>
</div>

