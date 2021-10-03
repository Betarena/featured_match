<!-- ===============
	COMPONENT JS (w/ TS)
==================== -->

<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from "svelte/transition"
  import { query, getClient, mutation } from 'svelte-apollo'
  import { GET_ALL_FIXTURE_DATA, GET_LANG_SELECTED_FIXTURE } from '../graphql/query'
  import { UPDATE_MATCH_FIXTURE_VOTES } from '../graphql/mutation'
  import { getUserLocation } from '../geoJs/init'
  import ContentLoader from 'svelte-content-loader'
  import { fixtureVote } from '../store/vote_fixture'
  import { getTargetFixtureOdds, getTargetGeoSportBookDetails } from '../firebase/index'
  import ColorThief from "colorthief"

  import type { fixture } from '../store/vote_fixture'
  import type { ContentLoaderProps } from '../models/content-loader-interface'
  import type { FixtureResponse, ValueBet, MatchVotes } from '../models/interface-fixture'
  import type { GeoJsResponse } from '../models/geo-js-interface'
  import type { SelectedFixutre, BestPlayers_Data, Tv_Station } from '../models/response_models'
  
  let randomFixture: FixtureResponse
  let fixtureTime: Date;
  let promise
  let SELECTED_MATCH_FIXTURE
  let FINAL_FIXTURE_DATA
  let FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA: BestPlayers_Data
  let FINAL_FIXTURE_DATA_TV_STATIONS_DATA: Array< Tv_Station >
  let match_fixture_votes: MatchVotes
  let totalVotes: number
  let FINAL_VALUE_BETS_DATA: ValueBet
  let selected_fixture_id: number;
  let userGeoResponse: GeoJsResponse

  getUserLocationNow()

  /**
   * Description: & [REACTIVITY]
   * ~~~~~~~~~~~~~~~~~~~
   * ... get user Geo-Location [WORKING]
   * and continue with the rest of the methods;
  */
  async function getUserLocationNow() {
    userGeoResponse = await getUserLocation()
    // console.log('userGeoPos', userGeoResponse.country_code)
  }
  $: if (userGeoResponse != undefined && userGeoResponse.country_code) {
    // ... get the Users LeagueList;
    getSelectedFixture("en") // ... change to the USERS GEO LATER ON...
  }

  /**
   * Description: & [REACTIVITY]
   * Setup for GRAPHQL
   * ~~~~~~~~~~~~~~~~~~~
   * ... obtain THIS Platforms Language selected pre-selected fixture;
   * @param fixtureId
  */
  async function getSelectedFixture(lang: string) {
    SELECTED_MATCH_FIXTURE = query(GET_LANG_SELECTED_FIXTURE, {variables: { lang: lang }});
  }
  $: if ($SELECTED_MATCH_FIXTURE != undefined) {
    if ($SELECTED_MATCH_FIXTURE.data) {
      // console.log('$SELECTED_MATCH_FIXTURE.data', $SELECTED_MATCH_FIXTURE.data);
      // ... get the rest of the data for the pre-selected fixture;
      selected_fixture_id = $SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection_dev[0].fixture_id
      // ... create a promise, for obtaining the complete fixture odds data;
      promise = get_TargetFixtureOddsAndInfo($SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection_dev[0])
      // ... get the complete fixture data;
      get_CompleteFixtureData(selected_fixture_id);
    }
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... get the complete odds & sportbook information
   * on the odds-site, as one single JSON object;
   * @param selectedFixutreData
   * @returns Promise<any>
  */
  async function get_TargetFixtureOddsAndInfo(selectedFixutreData: SelectedFixutre): Promise<any> {
    // ... get the list of the odds for the
    let fixutreOddsAllInfo = await getTargetFixtureOdds(selectedFixutreData);
    // ... intercept the image of the matchbetting site logo;
    let imageURL: string = fixutreOddsAllInfo.fixture_odds_info.image
    // ... apply the correct background color;
    getImageBgColor(imageURL);
    // ...
    return fixutreOddsAllInfo
  }

  /**
   * Description: & [REACTIVITY]
   * ~~~~~~~~~~~~~~~~~~~
   * ... get all of the complete data for the Match Data
   * @param fixture_id
  */
  async function get_CompleteFixtureData(fixture_id: number) {
    FINAL_FIXTURE_DATA = query(GET_ALL_FIXTURE_DATA, {variables: { id: fixture_id, fixture_id: fixture_id }});
  }
  let intial: boolean = false;
  $: if ($FINAL_FIXTURE_DATA != undefined) {
    if ($FINAL_FIXTURE_DATA.data && !intial) {
      console.log("$FINAL_FIXTURE_DATA.data", $FINAL_FIXTURE_DATA.data)
      // ... gain access to the data of the fixture;
      // ... get fixture time;
      fixtureTime = $FINAL_FIXTURE_DATA.data.week_fixtures_dev_by_pk.time
      fixtureTime = new Date(fixtureTime.toString())
      // ... assing the rest of the variables;
      randomFixture = $FINAL_FIXTURE_DATA.data.week_fixtures_dev_by_pk
      FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA = $FINAL_FIXTURE_DATA.data.widget_featured_match_best_player_dev_by_pk
      match_fixture_votes = $FINAL_FIXTURE_DATA.data.widget_featured_match_votes_dev_by_pk
      totalVotes = match_fixture_votes.vote_draw_x + match_fixture_votes.vote_win_local + match_fixture_votes.vote_win_visitor
      FINAL_FIXTURE_DATA_TV_STATIONS_DATA = $FINAL_FIXTURE_DATA.data.week_fixtures_dev_by_pk.tvstations
      if (randomFixture.valuebets != null) {
        getValueBetsData();
      }
      intial = true;
    }
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... obtain the further critical information of 
   * the value-bets info
  */
  async function getValueBetsData() {
    // ... obtain the value_bets - site - image;
    // ... value-bets data;
    FINAL_VALUE_BETS_DATA = randomFixture.valuebets
    let siteName: string = FINAL_VALUE_BETS_DATA.bookmaker
    let sportbook_details: any = await getTargetGeoSportBookDetails("en", siteName)
    // ... check if the data returned exists;
    // ... append the image & the registration link to the data;
    FINAL_VALUE_BETS_DATA = {
      ...FINAL_VALUE_BETS_DATA, 
      image: sportbook_details.betting_site_info.image,
      link: sportbook_details.betting_site_info.register_link 
    }
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... update the match-votes-data
   * for this target fixture;
  */
  const update_fixture = mutation(UPDATE_MATCH_FIXTURE_VOTES);
  async function handleSubmit(fixtureData: fixture) {
    try {
      await update_fixture({ 
        variables: { 
          match_id: fixtureData.fixture_id,
          _1_vote: fixtureData._1_vote,
          _2_vote: fixtureData._2_vote,
          _X_vote: fixtureData._X_vote,
        },   
        // upon recieveing the data update;
        update: (cache, { data }) => {
          match_fixture_votes = data.update_widget_featured_match_votes_dev_by_pk;
          totalVotes = match_fixture_votes.vote_draw_x + match_fixture_votes.vote_win_local + match_fixture_votes.vote_win_visitor
        }
      });
    } catch (error) {
      console.log('There has been an error!')
    }
  }

  // ~~~~~~~~~~~~~~~~~~~~~
  // USER ACTTIONS METHODS
  // ~~~~~~~~~~~~~~~~~~~~~

  let selected_bet;                      // contains the data for the `selected_bets`;
  let user_Stake_amount: number = 50.00  // user stake amount (input)

  /**
   * Description: & [REACTIVITY]
   * ~~~~~~~~~~~~~~~~~~~
   * ... assigning the default values for 
   * the target fixture info;
  */
  let fixtureDataVote: fixture = {
    fixture_id: undefined,
    fixture_vote: undefined,
    fixture_vote_val: undefined,
    _X_vote: undefined,
    _1_vote: undefined,
    _2_vote: undefined
  }
  $: if ($fixtureVote.fixtureVotes_Array != undefined && selected_fixture_id != undefined) {
    // ... returns the fixture obj. matching the fixture data;
    const result = $fixtureVote.fixtureVotes_Array.find(fixture => {
      return fixture.fixture_id === selected_fixture_id
    })
    // ... if localStorage(); exists, then assign it to the `fixtureDataVote`,
    // and show the match-betting site information;
    if (result != undefined) {
      fixtureDataVote = result
      showBettingSite = true
    }
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... handling the user-voting on a THIS fixture
   * & storing the votes on the DB (PostgresDB)
   * for keeping a record of the votes;
  */
  let showBettingSite: boolean = false;
  let prev_voteCast: string = undefined;
  function castVote(voteType: string, voteVal: number): void {
    // ... check if the user is UNSELECTING the previously selected vote cast;
    if (voteType === fixtureDataVote.fixture_vote) {
      // ... hide the website Bets Frame
      showBettingSite = false
      fixtureDataVote = {
        fixture_id: selected_fixture_id,
        fixture_vote: voteType,
        fixture_vote_val: voteVal,
        _X_vote: 0,
        _1_vote: 0,
        _2_vote: 0
      }
      fixtureDataVote["_"+fixtureDataVote.fixture_vote+"_vote"] = -1
      fixtureVote.removeItem(fixtureDataVote)
      fixtureDataVote.fixture_vote = undefined
      fixtureDataVote.fixture_vote_val = undefined
      prev_voteCast = undefined
      handleSubmit(fixtureDataVote)
      return
    }
    // ... update the showBettingSite Frame
    showBettingSite = true;
    // ... update the VoteMatch on DB
    fixtureDataVote = {
      fixture_id: selected_fixture_id,
      fixture_vote: voteType,
      fixture_vote_val: voteVal,
      _X_vote: 0,
      _1_vote: 0,
      _2_vote: 0
    }
    // ... check if there has been a simple switch of values on the Vote Cast;
    if (prev_voteCast != voteType && prev_voteCast != undefined) {
      fixtureDataVote["_"+prev_voteCast+"_vote"] = -1
    }
    fixtureDataVote["_"+fixtureDataVote.fixture_vote+"_vote"] = 1
    handleSubmit(fixtureDataVote)
    // ... and localStorage()
    fixtureVote.addToVotes(fixtureDataVote)
    // ... set to the previous vote;
    prev_voteCast = fixtureDataVote.fixture_vote
  }

  // ~~~~~~~~~~~~~~~~~~~~~
  // PLACEHOLDER LOADING METHOD
  // ~~~~~~~~~~~~~~~~~~~~~

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... decalring the ContentLoaderProps
   * values through the interface
  */
  let contentLoaderProps: ContentLoaderProps = {
    width: `100%`,
    height: `100%`,
    primaryColor: "#f9f9f9",
  }

  // ~~~~~~~~~~~~~~~~~~~~~
  // VIEWPORT CHANGES
  // ~~~~~~~~~~~~~~~~~~~~~

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * ... onMount() function that verifies that
   * the `viewport` width is of tablet size
   * or greater;
  */
  let viewportDesktop: boolean;
  onMount(async() => {
      var wInit = document.documentElement.clientWidth;
      if (wInit > 767) {
          viewportDesktop = true;
      } else {
          viewportDesktop = false;
      }
      window.addEventListener("resize", function() {
          var w = document.documentElement.clientWidth;
          if (w > 767) {
              viewportDesktop = true;
          } else {
              viewportDesktop = false;
          }
      })
  })

  // ~~~~~~~~~~~~~~~~~~~~~
  // COMPONENT TIMER CLOCK
  // ~~~~~~~~~~~~~~~~~~~~~

  /**
   * Description 
   * ~~~~~~~~~~~~~~~~~~~~
   * ... `countdown-clock` for the fixture;
   * local clock-time & other countdowns / timers,
   * set the timer of the selected card,
  */
  let currentDate: Date = new Date();
  let dateObjDif: number = Date.parse(currentDate.toString()) - Date.parse(new Date().toString());

  /**
   * Description:
	 * ~~~~~~~~~~~~~~~~~~~~
	 * ... set the Timer in Motion;
	 * and Calcualte the difference between target
	 * time and the current time, once the fixture time
   * has been loaded in,
	*/
	$: if (fixtureTime) {
		dateObjDif = Date.parse(fixtureTime.toString()) - Date.parse(new Date().toString());
    // ... calculate the difference in the time;
		setInterval(() => {
      dateObjDif = Date.parse(fixtureTime.toString()) - Date.parse(new Date().toString());
		}, 1000);
	}

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const getOrdinalNum = (number) => {
    let selector;

    if (number <= 0) {
      selector = 4;
    } else if ((number > 3 && number < 21) || number % 10 > 3) {
      selector = 0;
    } else {
      selector = number % 10;
    }

    return number + ['th', 'st', 'nd', 'rd', ''][selector];
  };


  /**
	 * Description: & [REACTIVITY]
	 * ~~~~~~~~~~~~~~~~~~~~
	 * -> Seconds Counter;
	 * -> Minutes Counter;
	 * -> Hours Counter;
	*/
  $: countD_sec = Math.floor((dateObjDif / 1000) % 60).toString();
  $: if (parseInt(countD_sec) < 10) {
    countD_sec = "0" + countD_sec
  }
  $: countD_min = Math.floor((dateObjDif / 1000 / 60) % 60).toString();
  $: if (parseInt(countD_min) < 10) {
    countD_min = "0" + countD_min
  }
  $: countD_h = Math.floor((dateObjDif / (1000 * 60 * 60)) % 24).toString();
  $: if (parseInt(countD_h) < 10) {
    countD_h = "0" + countD_h
  }

  // ~~~~~~~~~~~~~~~~~~~~~
  // COLOR-THIEF INSTANCE;
  // ~~~~~~~~~~~~~~~~~~~~~

  // declaring a new instance of `ColorThief`;
  const colorThief = new ColorThief();

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~~
   * ... a function-method to obtain the main
   * `primary` color of the image
   * and place it on the background
   * container to keep the image the same size
   * @param imgURL
  */
  let imageVar: string = "--featured-match-bookmaker-bg-"
  let hexColor: string;
  function getImageBgColor(imgURL: string) {
    // instantiate the image Type;
    const img = new Image();
    // listen, event to wait for the image to load
    img.addEventListener("load", function () {
      // get the array of RGB values,
      let colorValues = colorThief.getColor(img);
      // convert the RGB values to HEX value,
      hexColor = rgbToHex(colorValues[0], colorValues[1], colorValues[2]);
      // pass this values as a `CSS :root` variable, accessible to all the website,
      const doc = document.documentElement;
      doc.style.setProperty(imageVar, `${hexColor}`);
    });
    // declaring the image paramaters & CORS by-pass
    let imageURL = imgURL;
    let googleProxyURL =
      "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";
    img.crossOrigin = "Anonymous";
    img.src = googleProxyURL + encodeURIComponent(imageURL);
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~~
   * A function-method to convert the
   * [x,a,c] of RBG values to `#HEX` values
   * @param r
   * @param g
   * @param b
   * @returns (# a singel #HEX-Color Value)
  */
  const rgbToHex = (r, g, b) =>
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("");
</script>

<!-- ===============
  COMPONENT STYLE
==================== -->

<style>
  #live-score-container {
    display: grid;
    background: #FFFFFF;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    width: 100%;
    max-width: 343px;
  }

  #fixture-league-title {
    padding: 10px 20px;
    box-shadow: inset 0px -1px 0px #EBEBEB;
  }

  #fixture-visual-box {
    padding: 25px 20px 20px 20px;
    box-shadow: inset 0px -1px 0px #EBEBEB;
  }

  #fixture-data {
    display: grid;
    grid-auto-flow: column;
    justify-items: center;
    align-items: center;
    justify-content: center;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;
  }

  /* ====================
    vote-button-container 
  ==================== */

  #btn-vote-container {
    display: grid;
    grid-auto-flow: column;
    align-items: center;
    justify-items: center;
    justify-content: space-between;
    width: -webkit-fill-available;
  } 
  .odds-vote-box {

  }
  .cast-vote-btn {
    background: #F2F2F2;
    border: 1px solid #CCCCCC;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 14px 16px;
    transition: all ease 0.15s;
    box-shadow: none !important;
    width: 96px;
  } .cast-vote-btn.active {
    background: #FFFFFF;
    border: 1px solid #F5620F;
    box-sizing: border-box;
    border-radius: 8px;
  }
  .probablitiy-text {
    text-align: center;
    color: #8C8C8C;
    width: min-content;
  }

  .active_p {
    color: #F5620F !important;
  }

  #site-bet-box {
    margin-top: 35px;
    background: #F2F2F2;
    border-radius: 8px;
    overflow: hidden;
  }
  #inner-site-container {
    padding: 12px 20px;
    background: #F2F2F2;
    border-radius: 8px;
  }
  .input-value {
    background: #FFFFFF;
    border-radius: 8px;
    padding: 14px 0;
    width: 76px;
  }

  .img-flag {
    width: 24px;
    height: 18px;
    margin-right: 16px;
    filter: drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1));
    border-radius: 2px !important;
    vertical-align: middle !important;
  }

  #stakesSiteImg {
    background-color: var(--featured-match-bookmaker-bg-);
    object-fit: none;
  }

  #live-stream-box {
    padding: 20px;
    box-shadow: inset 0px -1px 0px #EBEBEB;
    overflow: hidden;
    width: inherit;
  }
  #livestream-grid {
    display: grid;
    grid-auto-flow: column;
    gap: 8px;
    overflow-y: scroll;
  }
  /* Hide scrollbar for Chrome, Safari and Opera */
  #livestream-grid::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  #livestream-grid  {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  .live-stream-btn {
    border: 1px solid #CCCCCC;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 7px 12px;
    background-color: transparent;
    box-shadow: none !important;
  }

  /* ====================
    best-players-container 
  ==================== */

  #best-players-box-out {

  } .best-players-box {
      padding: 20px;
      box-shadow: inset 0px -1px 0px #EBEBEB;
  }

  .rating-box {
    margin-right: 25px;
  }

  .player-img {
    border: 1px solid #CCCCCC;
    border-radius: 50%;
    margin-right: 8px;
  }

  /* ====================
    value-bets-container 
  ==================== */

  #value-bets {
    padding: 20px;
  } #value-bets-container {
    background: #F2F2F2;
    border-radius: 2px;
    width: 100%;
  } #value-bets-inner-info {
    padding: 12px;
    display: grid;
    grid-auto-rows: 1fr;
    justify-items: center;
    align-items: center;
    gap: 4px;
  } #value-bets-inner-info img {
    border-radius: 4px;
    width: 56px;
    object-fit: cover;
  }

  @media only screen and (min-width: 767px) {

    #featured-rank {
      display: grid;
      gap: 10px;
      padding: 23px 43px 16px 43px;
      background: #F2F2F2;
      border-radius: 12px;
      justify-items: center;
    }

    #feature-rank-display {
      display: grid;
      gap: 20px;
      grid-auto-flow: column;
      grid-template-columns: repeat(3, 1fr);
      justify-content: space-between;
      padding: 20px 20px 0 20px;
    }

    #featured-list-container {
      width: 100%;
      max-width: 700px;
    }
  }

  @media only screen and (min-width: 1024px) {

    #feature-rank-display {
      display: grid;
      gap: 20px;
      grid-auto-flow: column;
      grid-template-columns: repeat(3, 1fr);
      justify-content: space-between;
      padding: 20px 20px 0 20px;
    }

    #featured-rank {
      display: grid;
      gap: 10px;
      padding: 23px 16px 16px 16px;
      background: #F2F2F2;
      border-radius: 12px;
      justify-items: center;
    }

    #featured-list-container {
      width: 100%;
      max-width: 560px;
    }
  }
</style>

<!-- ===============
  COMPONENT HTML 
==================== -->

{#if $FINAL_FIXTURE_DATA != undefined}
  {#if $FINAL_FIXTURE_DATA.loading}
    <!-- 
    ~~~~~~~~~~~~~~~
    promise is pending -->
    <ContentLoader {...contentLoaderProps} />
  {:else if $FINAL_FIXTURE_DATA.error}
    <!-- 
    ~~~~~~~~~~~~~~~
    promise ERROR -->
    <p>There has been an error!</p>
  {:else if $FINAL_FIXTURE_DATA.data}
    <!-- 
    promise was fulfilled!
    -->

    <div id='live-score-container'>

      <!--
      ~~~~~~~~~~~~~~
      league-game-title 
      -->
      <div id='fixture-league-title' 
        class='row-space-start'>
        <img
          class="img-flag"
          src={randomFixture.country_flag}
          alt=""
        />
        <p class='large color-dark m-r-8'>
          {randomFixture.league_name} 
          <span class='color-grey'>
            (Round {randomFixture.round_name})
          </span>
        </p>
      </div>
      
      <div id='fixture-visual-box'>
        <!-- 
        ~~~~~~~~~~~~~~
        fixture-visual-info
        -->
        <div id='fixture-data' class='row-space-out m-b-20'>
          <!-- 
          first-team -->
          <div class="fixture-team">
            <img 
              class="m-b-12"
              src={randomFixture.home_team_logo}
              alt=""
              width="72px" height="72px"
            />
            <p class='medium'>
              {randomFixture.home_team_name}
            </p>
          </div>
          <!-- 
          fixture-timer-clock -->
          <div>
            <p class='x-large'>
              {countD_h}:{countD_min}:{countD_sec}
            </p>
            <p class='small color-grey' style="white-space: nowrap;">
              {getOrdinalNum(fixtureTime.getDate())}
              {monthNames[fixtureTime.getMonth().toString()]} 
              {fixtureTime.getFullYear().toString().substr(-2)},
              {fixtureTime.getHours().toString()}:{("0" + fixtureTime.getMinutes().toString()).slice(-2)}h
            </p>
          </div>
          <!-- 
          second-team -->
          <div class="fixture-team">
            <img 
              class="m-b-12"
              src={randomFixture.away_team_logo}
              alt=""
              width="72px" height="72px"
            />
            <p class='medium'>
              {randomFixture.away_team_name}
            </p>
          </div>
        </div>
        {#if !showBettingSite}
          <p class='large color-primary m-b-12 text-center'>
            Vote to see results
          </p>
        {/if}

        <!-- 
        ~~~~~~~~~~~~~~
        voting-results-btn
        -->
        {#await promise then value}
          <div id='btn-vote-container'
            class='row-space-out'>
            <!-- 
            ODDS #1 
            -->
            <div class='odds-vote-box text-center column'>
              <button class='cast-vote-btn m-b-12' 
                class:active={fixtureDataVote.fixture_vote == '1'} 
                on:click={() => castVote('1', value.fixture_odds.markets["1X2FT"].data[0].value)}>
                <p class='medium row-space-out'>
                  <span class="color-grey">
                    1
                  </span>
                  <span class:active_p={fixtureDataVote.fixture_vote == '1'} >
                    {value.fixture_odds.markets["1X2FT"].data[0].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class='probablitiy-text medium'>
                  Probability
                  <br />
                    {Math.round(parseInt(randomFixture.probabilities.home)).toFixed(2)}%
                </p>
              {:else}
                {#if match_fixture_votes != undefined}
                  <p class='large'>
                    <span class='color-dark'>
                      {(match_fixture_votes.vote_win_local / totalVotes * 100).toFixed(0)}%
                    </span>
                    <span class='color-grey'>
                      ({match_fixture_votes.vote_win_local})
                    </span>
                  </p>
                {/if}
              {/if}
            </div>
            
            <!-- 
            ODDS #X 
            -->
            <div class='odds-vote-box text-center column'>
              <button class='cast-vote-btn m-b-12' 
                class:active={fixtureDataVote.fixture_vote == 'X'} 
                on:click={() => castVote('X', value.fixture_odds.markets["1X2FT"].data[1].value)}>
                <p class='medium row-space-out'>
                  <span class="color-grey">
                    X
                  </span>
                  <span class:active_p={fixtureDataVote.fixture_vote == 'X'} >
                    {value.fixture_odds.markets["1X2FT"].data[1].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class='probablitiy-text medium'>
                  Probability
                  <br />
                    {Math.round(parseInt(randomFixture.probabilities.draw)).toFixed(2)}%
                </p>
              {:else}
                {#if match_fixture_votes != undefined}
                  <p class='large'>
                    <span class='color-dark'>
                      {(match_fixture_votes.vote_draw_x / totalVotes * 100).toFixed(0)}%
                    </span>
                    <span class='color-grey'>
                      ({match_fixture_votes.vote_draw_x})
                    </span>
                  </p>
                {/if}
              {/if}
            </div>

            <!-- 
            ODDS #2 
            -->
            <div class='odds-vote-box column text-center'>
              <button class='cast-vote-btn m-b-12' 
                class:active={fixtureDataVote.fixture_vote == '2'} 
                on:click={() => castVote('2', value.fixture_odds.markets["1X2FT"].data[2].value)}>
                <p class='medium row-space-out'>
                  <span class="color-grey">
                    2
                  </span>
                  <span class:active_p={fixtureDataVote.fixture_vote == '2'} >
                    {value.fixture_odds.markets["1X2FT"].data[2].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class='probablitiy-text medium'>
                  Probability
                  <br />
                    {Math.round(parseInt(randomFixture.probabilities.away)).toFixed(2)}%
                </p>
              {:else}
                {#if match_fixture_votes != undefined}
                  <p class='large'>
                    <span class='color-dark'>
                      {(match_fixture_votes.vote_win_visitor / totalVotes * 100).toFixed(0)}%
                    </span>
                    <span class='color-grey'>
                      ({match_fixture_votes.vote_win_visitor})
                    </span>
                  </p>
                {/if}
              {/if}
            </div>
          </div>
          <!-- 
          ~~~~~~~~~~~~~~
          stakes-site-info-pop-up
          -->
          {#if showBettingSite}
            <div id='site-bet-box' in:fade>
              <img
                id='stakesSiteImg'
                src={value.fixture_odds_info.image} 
                alt=""
                width="100%" height='40px'
              />
              <div id='inner-site-container'>
                <!-- 
                STAKES DATA -->
                <div class='m-b-20 row-space-out'>

                  <!-- 
                  Win Type
                  -->
                  <div class='text-center'>
                    {#if fixtureDataVote.fixture_vote == '1'}
                      <p class='medium m-b-8 color-grey'>Home win</p>
                    {:else if fixtureDataVote.fixture_vote == 'X'}
                      <p class='medium m-b-8 color-grey'>Draw</p>
                    {:else}
                      <p class='medium m-b-8 color-grey'>Away win</p>
                    {/if}
                    <input 
                      class='input-value medium text-center' 
                      type=number
                      bind:value={fixtureDataVote.fixture_vote_val}
                      disabled
                    />
                  </div>

                  <!-- MULTIPLY SIGN -->
                  <img 
                    src="./static/icon/icon-close.svg" 
                    alt=""
                    width="16px" height="16px"
                    style="margin-top: 25px;"
                  />
                  
                  <!-- 
                  Stake 
                  -->
                  <div class='text-center'>
                    <p class='medium m-b-8 color-grey'>Stake</p>
                    <input 
                      class='input-value medium text-center' 
                      type="text"
                      bind:value={user_Stake_amount}
                    />
                  </div>
                  
                  <!-- EQUALS SIGN -->
                  <img 
                    src="./static/icon/icon-equally.svg" 
                    alt=""
                    width="16px" height="16px"
                    style="margin-top: 25px;"
                  />

                  <!-- 
                  Winnings 
                  -->
                  <div class='text-center'>
                    <p class='medium m-b-8 color-grey'>Winnings</p>
                    <input
                      class='input-value medium text-center' 
                      type=number
                      value={(fixtureDataVote.fixture_vote_val * user_Stake_amount).toFixed(2)}
                      disabled
                    />
                  </div>
                </div>

                <!-- 
                PLACE BET BUTTON -->
                <a href={value.fixture_odds_info.register_link} >
                  <button style='width: 100%;' class='btn-primary m-b-12'>
                    <p class='small'>
                      Place Bet
                    </p>
                  </button>
                </a>
                
                <!-- 
                BETTING SITE INFO -->
                <p class='small text-center color-grey'>
                  {value.fixture_odds_info.information} 
                </p>
              </div>
            </div>
          {/if}
        {/await}
      </div>
    
      <!-- 
      ~~~~~~~~~~~~~
      live-streams-frame-box
      -->
      {#if FINAL_FIXTURE_DATA_TV_STATIONS_DATA.length != 0}
        <div id='live-stream-box'>
          <!-- 
          live-streams-title-section -->
          <p class='large m-b-8'>
            Live Streams
          </p>
          <!-- 
          live-streams-grid -->
          <div id='livestream-grid'>
            {#each FINAL_FIXTURE_DATA_TV_STATIONS_DATA as tv_item}
              <a rel=external 
                href={tv_item.link}>
                <button class='live-stream-btn'>
                  <img 
                    src={tv_item.img}
                    alt={tv_item.alt}
                    title={tv_item.Name}
                    width="45px" height="26px"
                  />
                </button>
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 
      ~~~~~~~~~~~~~
      best-players (Both-Teams)
      -->
      <div id='best-players-box-out'>
        <!--
        ~~~~~~~~~~~~~
        TEAM - HOME 
        -->
        <div class='best-players-box'>
          <div class='row-space-start m-b-16'>
            <img
              class='m-r-16'
              src={randomFixture.home_team_logo}
              alt=""
              width="32px" height="32px"
            />
            <p class='large'>{randomFixture.home_team_name} best players</p>
          </div>
          <table style="text-align: left;">
            <tr class='m-b-16'>
              <th>
                <p class='small color-grey'>Rating</p>
              </th>
              <th>
                <p class='small color-grey'>Player</p>
              </th>
            </tr>
            <!-- PLAYER 1 -->
            <tr>
              <td>
                <p class='large rating-box'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1} </p>
              </td>
              <td class='row-space-start'>
                <img 
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class='player-img'
                />
                <p class='small'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1} </p>
              </td>
            </tr>
            <!-- PLAYER 2 -->
            <tr>
              <td>
                <p class='large rating-box'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2} </p>
              </td>
              <td class='row-space-start'>
                <img 
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class='player-img'
                />
                <p class='small'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2} </p>
              </td>
            </tr>
          </table>
        </div>

        <!--
        ~~~~~~~~~~~~~
        TEAM - AWAY 
        -->
        <div class='best-players-box'>
          <div class='row-space-start m-b-16'>
            <img
              class='m-r-16'
              src={randomFixture.away_team_logo}
              alt=""
              width="32px" height="32px"
            />
            <p class='large'>{randomFixture.away_team_name} best players</p>
          </div>
          <!--  -->
          <table style='text-align: left;'>
            <tr class='m-b-16'>
              <th>
                <p class='small color-grey'>Rating</p>
              </th>
              <th>
                <p class='small color-grey'>Player</p>
              </th>
            </tr>
            <!-- PLAYER 1 -->
            <tr>
              <td>
                <p class='large rating-box'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1} </p>
              </td>
              <td class='row-space-start'>
                <img 
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class='player-img'
                />
                <p class='small'>{FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1}</p>
              </td>
            </tr>
            <!-- PLAYER 2 -->
            <tr>
              <td>
                <p class='large rating-box'> {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2} </p>
              </td>
              <td class='row-space-start'>
                <img 
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class='player-img'
                />
                <p class='small'>{FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2}</p>
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- 
      ~~~~~~~~~~~~~
      value-bets section
      -->
      {#if FINAL_VALUE_BETS_DATA != null}
        <div id='value-bets'>
          <p class='large m-b-16'>
            Value Bet
          </p>
          <div id='value-bets-container'>
            <div id='value-bets-inner-info'>
              <!-- 
              VALUE-BET INFO -->
              <div class='row-space-out'>
                <p class='medium color-grey'>
                  Bookmaker
                </p>
                <img 
                  src={FINAL_VALUE_BETS_DATA.image} 
                  alt={FINAL_VALUE_BETS_DATA.bookmaker}
                  height="30px"
                />
              </div>

              <div class='row-space-out'>
                <p class='medium color-grey'>
                  Type
                </p>
                <p class='medium color-dark'>
                  1X2
                </p>
              </div>

              <div class='row-space-out'>
                <p class='medium color-grey'>
                  Market
                </p>
                <p class='medium color-dark'>
                  Goals
                </p>
              </div>

              <div class='row-space-out'>
                <p class='medium color-grey'>
                  Odds
                </p>
                <p class='medium color-dark'
                  style="background: #FFFFFF;
                  border-radius: 4px;
                  padding: 4px 6px;">
                  {FINAL_VALUE_BETS_DATA.odd}
                </p>
              </div>

              <div class='row-space-out'>
                <p class='medium color-grey'>
                  Fair odds
                </p>
                <p class='medium color-dark' 
                  style="background: #FFFFFF;
                  border-radius: 4px;
                  padding: 4px 6px;">
                  {FINAL_VALUE_BETS_DATA.fair_odd}
                </p>
              </div>

            </div>
            
            <!-- 
            VALUE-BET BUTTON -->
            <a rel=external
              href={FINAL_VALUE_BETS_DATA.link}>
              <button 
                style='width: 100%; padding: 6px 0; border-radius: 4px;' 
                class='btn-primary'
                >
                <p class='medium'>
                  Bet
                </p>
              </button>
            </a>

          </div>
        </div>
      {/if}

    </div>
  {/if}
{/if}