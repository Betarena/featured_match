<!-- ===============
	COMPONENT JS (w/ TS)
==================== -->
<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { query, getClient, mutation } from "svelte-apollo";
  import {
    GET_ALL_FIXTURE_DATA,
    GET_LANG_SELECTED_FIXTURE,
  } from "../graphql/query";
  import { UPDATE_MATCH_FIXTURE_VOTES } from "../graphql/mutation";
  import { getUserLocation } from "../geoJs/init";
  import ContentLoader from "svelte-content-loader";
  import { fixtureVote } from "../store/vote_fixture";
  import {
    getTargetFixtureOdds,
    getTargetGeoSportBookDetails,
  } from "../firebase/index";
  import ColorThief from "colorthief";

  import type { fixture } from "../store/vote_fixture";
  import type { ContentLoaderProps } from "../models/content-loader-interface";
  import type {
    FixtureResponse,
    ValueBet,
    MatchVotes,
  } from "../models/interface-fixture";
  import type { GeoJsResponse } from "../models/geo-js-interface";
  import type {
    SelectedFixutre,
    BestPlayers_Data,
    Tv_Station,
    TranslationsResponse,
  } from "../models/response_models";

  let randomFixture: FixtureResponse;
  let fixtureTime: Date;
  let promise;
  let SELECTED_MATCH_FIXTURE;
  let FINAL_FIXTURE_DATA;
  let FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA: BestPlayers_Data;
  let FINAL_FIXTURE_DATA_TV_STATIONS_DATA: Array<Tv_Station>;
  let match_fixture_votes: MatchVotes;
  let totalVotes: number;
  let translation: TranslationsResponse;
  let FINAL_VALUE_BETS_DATA: ValueBet;
  let selected_fixture_id: number;
  let userGeoResponse: GeoJsResponse;

  getUserLocationNow();

  /**
   * Description: & [REACTIVITY]
   * ~~~~~~~~~~~~~~~~~~~
   * ... get user Geo-Location [WORKING]
   * and continue with the rest of the methods;
   */
  async function getUserLocationNow() {
    userGeoResponse = await getUserLocation();
    // console.log('userGeoPos', userGeoResponse.country_code)
  }
  let userGeo;
  $: if (userGeoResponse != undefined && userGeoResponse.country_code) {
    // ... get the Users LeagueList;
    // console.log('userGeoResponse', userGeoResponse);
    userGeo = userGeoResponse.country_code.toLowerCase();
    getSelectedFixture(userGeoResponse.country_code.toLowerCase()); // ... change to the USERS GEO LATER ON...
  }

  /**
   * Description: & [REACTIVITY]
   * Setup for GRAPHQL
   * ~~~~~~~~~~~~~~~~~~~
   * ... obtain THIS Platforms Language selected pre-selected fixture;
   * @param fixtureId
   */
  async function getSelectedFixture(lang: string) {
    SELECTED_MATCH_FIXTURE = query(GET_LANG_SELECTED_FIXTURE, {
      variables: { lang: lang },
    });
  }
  $: if ($SELECTED_MATCH_FIXTURE != undefined) {
    if ($SELECTED_MATCH_FIXTURE.data) {
      let dataAvailable = true;
      // console.log("$SELECTED_MATCH_FIXTURE.data", $SELECTED_MATCH_FIXTURE.data);
      // ... get the rest of the data for the pre-selected fixture;
      if (
        $SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection.length == 0
      ) {
        getSelectedFixture("en"); // ... DEFAULT EN VALUE
        dataAvailable = false; // ... SIGNAL THAT DATA IS NO LINGER AVAILBLE
      }
      if (dataAvailable) {
        if (
          $SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection.length !=
          0
        ) {
          selected_fixture_id =
            $SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection[0]
              .fixture_id;
          // ... get the translations;
          translation =
            $SELECTED_MATCH_FIXTURE.data
              .widget_featured_match_translations_by_pk;
          // ... create a promise, for obtaining the complete fixture odds data;
          promise = get_TargetFixtureOddsAndInfo(
            $SELECTED_MATCH_FIXTURE.data.widget_featured_match_selection[0]
          );
          // ... get the complete fixture data;
          get_CompleteFixtureData(selected_fixture_id);
        }
      }
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
  async function get_TargetFixtureOddsAndInfo(
    selectedFixutreData: SelectedFixutre
  ): Promise<any> {
    // ... get the list of the odds for the
    let fixutreOddsAllInfo = await getTargetFixtureOdds(selectedFixutreData);
    // ... intercept the image of the matchbetting site logo;
    let imageURL: string = fixutreOddsAllInfo.fixture_odds_info.image;
    // ... apply the correct background color;
    getImageBgColor(imageURL);
    // ...
    return fixutreOddsAllInfo;
  }

  /**
   * Description: & [REACTIVITY]
   * ~~~~~~~~~~~~~~~~~~~
   * ... get all of the complete data for the Match Data
   * @param fixture_id
   */
  async function get_CompleteFixtureData(fixture_id: number) {
    FINAL_FIXTURE_DATA = query(GET_ALL_FIXTURE_DATA, {
      variables: { id: fixture_id, fixture_id: fixture_id },
    });
  }
  let intial: boolean = false;
  $: if ($FINAL_FIXTURE_DATA != undefined) {
    if ($FINAL_FIXTURE_DATA.data && !intial) {
      // console.log("$FINAL_FIXTURE_DATA.data", $FINAL_FIXTURE_DATA.data)
      // ... gain access to the data of the fixture;
      // ... get fixture time;
      fixtureTime = $FINAL_FIXTURE_DATA.data.week_fixtures_by_pk.time;
      fixtureTime = new Date(fixtureTime.toString());
      // ... assing the rest of the variables;
      randomFixture = $FINAL_FIXTURE_DATA.data.week_fixtures_by_pk;
      FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA =
        $FINAL_FIXTURE_DATA.data.widget_featured_match_best_player_by_pk;
      // console.log('FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA', FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA);
      match_fixture_votes =
        $FINAL_FIXTURE_DATA.data.widget_featured_match_votes_by_pk;
      totalVotes =
        match_fixture_votes.vote_draw_x +
        match_fixture_votes.vote_win_local +
        match_fixture_votes.vote_win_visitor;
      FINAL_FIXTURE_DATA_TV_STATIONS_DATA =
        $FINAL_FIXTURE_DATA.data.week_fixtures_by_pk.tvstations;
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
    FINAL_VALUE_BETS_DATA = randomFixture.valuebets;
    let siteName: string = FINAL_VALUE_BETS_DATA.bookmaker;
    let sportbook_details: any = await getTargetGeoSportBookDetails(
      userGeo,
      siteName
    );
    // ... check if the data returned exists;
    if (Object.keys(sportbook_details).length === 0) {
      FINAL_VALUE_BETS_DATA = null;
      return;
    }
    // ... append the image & the registration link to the data;
    FINAL_VALUE_BETS_DATA = {
      ...FINAL_VALUE_BETS_DATA,
      image: sportbook_details.betting_site_info.image,
      link: sportbook_details.betting_site_info.register_link,
    };
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
          match_fixture_votes = data.update_widget_featured_match_votes_by_pk;
          totalVotes =
            match_fixture_votes.vote_draw_x +
            match_fixture_votes.vote_win_local +
            match_fixture_votes.vote_win_visitor;
        },
      });
    } catch (error) {
      // console.log('There has been an error!')
    }
  }

  // ~~~~~~~~~~~~~~~~~~~~~
  // USER ACTTIONS METHODS
  // ~~~~~~~~~~~~~~~~~~~~~

  let selected_bet; // contains the data for the `selected_bets`;
  let user_Stake_amount: number = 50.0; // user stake amount (input)

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
    _2_vote: undefined,
  };
  $: if (
    $fixtureVote.fixtureVotes_Array != undefined &&
    selected_fixture_id != undefined
  ) {
    // ... returns the fixture obj. matching the fixture data;
    const result = $fixtureVote.fixtureVotes_Array.find((fixture) => {
      return fixture.fixture_id === selected_fixture_id;
    });
    // ... if localStorage(); exists, then assign it to the `fixtureDataVote`,
    // and show the match-betting site information;
    if (result != undefined) {
      fixtureDataVote = result;
      showBettingSite = true;
      voteCasted = true;
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
  let voteCasted: boolean = false;
  function castVote(voteType: string, voteVal: number): void {
    // ... check if a vote has already been casted ?;
    if (!voteCasted) {
      // ... update the showBettingSite Frame;
      showBettingSite = true;
      // ... update the VoteMatch on DB;
      fixtureDataVote = {
        fixture_id: selected_fixture_id,
        fixture_vote: voteType,
        fixture_vote_val: voteVal,
        _X_vote: 0,
        _1_vote: 0,
        _2_vote: 0,
      };
      fixtureDataVote["_" + fixtureDataVote.fixture_vote + "_vote"] = 1;
      handleSubmit(fixtureDataVote);
      // ... and .localStorage();
      fixtureVote.addToVotes(fixtureDataVote);
      // ... set the BOOLEAN to voteCasted to TRUE;
      voteCasted = true;
    }
    // ... else, do nothing;
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
    uniqueKey: "gtr678",
  };

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
  onMount(async () => {
    var wInit = document.documentElement.clientWidth;
    if (wInit > 700) {
      viewportDesktop = true;
    } else {
      viewportDesktop = false;
    }
    window.addEventListener("resize", function () {
      var w = document.documentElement.clientWidth;
      if (w > 700) {
        viewportDesktop = true;
      } else {
        viewportDesktop = false;
      }
    });
  });

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
  let dateObjDif: number =
    Date.parse(currentDate.toString()) - Date.parse(new Date().toString());

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~~
   * ... set the Timer in Motion;
   * and Calcualte the difference between target
   * time and the current time, once the fixture time
   * has been loaded in,
   */
  $: if (fixtureTime) {
    dateObjDif =
      Date.parse(fixtureTime.toString()) - Date.parse(new Date().toString());
    // ... calculate the difference in the time;
    setInterval(() => {
      dateObjDif =
        Date.parse(fixtureTime.toString()) - Date.parse(new Date().toString());
    }, 1000);
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getOrdinalNum = (number) => {
    let selector;

    if (number <= 0) {
      selector = 4;
    } else if ((number > 3 && number < 21) || number % 10 > 3) {
      selector = 0;
    } else {
      selector = number % 10;
    }

    return number + ["th", "st", "nd", "rd", ""][selector];
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
    countD_sec = "0" + countD_sec;
  }
  $: countD_min = Math.floor((dateObjDif / 1000 / 60) % 60).toString();
  $: if (parseInt(countD_min) < 10) {
    countD_min = "0" + countD_min;
  }
  $: countD_h = Math.floor((dateObjDif / (1000 * 60 * 60)) % 24).toString();
  $: if (parseInt(countD_h) < 10) {
    countD_h = "0" + countD_h;
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
  let imageVar: string = "--featured-match-bookmaker-bg-";
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
  COMPONENT HTML 
==================== -->

{#if $FINAL_FIXTURE_DATA != undefined}
  {#if $FINAL_FIXTURE_DATA.loading}
    <!-- 
    ~~~~~~~~~~~~~~~
    promise is pending -->
    <div id="live-score-container">
      <ContentLoader {...contentLoaderProps} />
    </div>
  {:else if $FINAL_FIXTURE_DATA.error}
    <!-- 
    ~~~~~~~~~~~~~~~
    promise ERROR -->
    <p>There has been an error!</p>
  {:else if $FINAL_FIXTURE_DATA.data}
    <!-- 
    promise was fulfilled!
    -->

    <div id="live-score-container">
      <!--
      ~~~~~~~~~~~~~~
      league-game-title 
      -->
      <div id="fixture-league-title" class="row-space-start">
        <img class="img-flag" src={randomFixture.country_flag} alt="" />
        <p class="large color-dark m-r-8">
          {randomFixture.league_name}
          <span class="color-grey">
            (Round {randomFixture.round_name})
          </span>
        </p>
      </div>

      <div id="fixture-visual-box">
        <!-- 
        ~~~~~~~~~~~~~~
        fixture-visual-info
        -->
        <div id="fixture-data" class="row-space-out m-b-20">
          <!-- 
          first-team -->
          <div class="fixture-team">
            <img
              class="m-b-12"
              src={randomFixture.home_team_logo}
              alt=""
              width="72px"
              height="72px"
            />
            <p class="medium desktop-medium">
              {randomFixture.home_team_name}
            </p>
          </div>
          <!-- 
          fixture-timer-clock -->
          <div style="align-self: center;">
            <p class="x-large desktop-x-large">
              {countD_h}:{countD_min}:{countD_sec}
            </p>
            <p
              class="small color-grey desktop-medium"
              style="white-space: nowrap;"
            >
              {getOrdinalNum(fixtureTime.getDate())}
              {monthNames[fixtureTime.getMonth().toString()]}
              {fixtureTime.getFullYear().toString().substr(-2)},
              {fixtureTime.getHours().toString()}:{(
                "0" + fixtureTime.getMinutes().toString()
              ).slice(-2)}h
            </p>
          </div>
          <!-- 
          second-team -->
          <div class="fixture-team">
            <img
              class="m-b-12"
              src={randomFixture.away_team_logo}
              alt=""
              width="72px"
              height="72px"
            />
            <p class="medium desktop-medium">
              {randomFixture.away_team_name}
            </p>
          </div>
        </div>
        {#if !voteCasted}
          <p class="large color-primary m-b-12 text-center">
            {translation.vote}
          </p>
        {/if}

        <!-- 
        ~~~~~~~~~~~~~~
        voting-results-btn
        -->
        {#await promise then value}
          <div id="btn-vote-container" class="row-space-out">
            <!-- 
            ODDS #1 
            -->
            <div class="odds-vote-box text-center column">
              <button
                class="row-space-out cast-vote-btn m-b-12"
                class:active={fixtureDataVote.fixture_vote == "1"}
                disabled={voteCasted}
                on:click={() =>
                  castVote(
                    "1",
                    value.fixture_odds.markets["1X2FT"].data[0].value
                  )}
              >
                <p class="medium row-space-out">
                  {#if !viewportDesktop}
                    <span class="color-grey"> 1 </span>
                  {:else}
                    <img
                      src={randomFixture.home_team_logo}
                      alt=""
                      width="28px"
                      height="28px"
                    />
                  {/if}
                  <span class:active_p={fixtureDataVote.fixture_vote == "1"}>
                    {value.fixture_odds.markets["1X2FT"].data[0].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class="probablitiy-text medium">
                  Probability
                  {#if !viewportDesktop}
                    <br />
                  {/if}
                  {Math.round(
                    parseInt(randomFixture.probabilities.home)
                  ).toFixed(2)}%
                </p>
              {:else if match_fixture_votes != undefined}
                <p class="large">
                  <span class="color-dark">
                    {(
                      (match_fixture_votes.vote_win_local / totalVotes) *
                      100
                    ).toFixed(0)}%
                  </span>
                  <span class="color-grey">
                    ({match_fixture_votes.vote_win_local})
                  </span>
                </p>
              {/if}
            </div>

            <!-- 
            ODDS #X 
            -->
            <div class="odds-vote-box text-center column">
              <button
                class="row-space-out cast-vote-btn m-b-12"
                class:active={fixtureDataVote.fixture_vote == "X"}
                disabled={voteCasted}
                on:click={() =>
                  castVote(
                    "X",
                    value.fixture_odds.markets["1X2FT"].data[1].value
                  )}
              >
                <p class="medium row-space-out">
                  {#if !viewportDesktop}
                    <span class="color-grey"> X </span>
                  {:else}
                    <img
                      src="./static/icon/icon-close.svg"
                      alt=""
                      width="28px"
                      height="28px"
                    />
                  {/if}
                  <span class:active_p={fixtureDataVote.fixture_vote == "X"}>
                    {value.fixture_odds.markets["1X2FT"].data[1].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class="probablitiy-text medium">
                  Probability
                  {#if !viewportDesktop}
                    <br />
                  {/if}
                  {Math.round(
                    parseInt(randomFixture.probabilities.draw)
                  ).toFixed(2)}%
                </p>
              {:else if match_fixture_votes != undefined}
                <p class="large">
                  <span class="color-dark">
                    {(
                      (match_fixture_votes.vote_draw_x / totalVotes) *
                      100
                    ).toFixed(0)}%
                  </span>
                  <span class="color-grey">
                    ({match_fixture_votes.vote_draw_x})
                  </span>
                </p>
              {/if}
            </div>

            <!-- 
            ODDS #2 
            -->
            <div class="odds-vote-box column text-center">
              <button
                class="row-space-out cast-vote-btn m-b-12"
                class:active={fixtureDataVote.fixture_vote == "2"}
                disabled={voteCasted}
                on:click={() =>
                  castVote(
                    "2",
                    value.fixture_odds.markets["1X2FT"].data[2].value
                  )}
              >
                <p class="medium row-space-out">
                  {#if !viewportDesktop}
                    <span class="color-grey"> 2 </span>
                  {:else}
                    <img
                      src={randomFixture.away_team_logo}
                      alt=""
                      width="28px"
                      height="28px"
                    />
                  {/if}
                  <span class:active_p={fixtureDataVote.fixture_vote == "2"}>
                    {value.fixture_odds.markets["1X2FT"].data[2].value}
                  </span>
                </p>
              </button>
              <!-- fixture-probability -->
              {#if !showBettingSite}
                <p class="probablitiy-text medium">
                  Probability
                  {#if !viewportDesktop}
                    <br />
                  {/if}
                  {Math.round(
                    parseInt(randomFixture.probabilities.away)
                  ).toFixed(2)}%
                </p>
              {:else if match_fixture_votes != undefined}
                <p class="large">
                  <span class="color-dark">
                    {(
                      (match_fixture_votes.vote_win_visitor / totalVotes) *
                      100
                    ).toFixed(0)}%
                  </span>
                  <span class="color-grey">
                    ({match_fixture_votes.vote_win_visitor})
                  </span>
                </p>
              {/if}
            </div>
          </div>
          <!-- 
          ~~~~~~~~~~~~~~
          stakes-site-info-pop-up
          -->
          {#if showBettingSite}
            <div id="site-bet-box" in:fade>
              <!-- 
              close-btn -->
              <img
                src="./static/icon/white-close.svg"
                alt=""
                width="16px"
                height="16px"
                style="position: absolute; top: 12px; right: 20px;"
                on:click={() => (showBettingSite = false)}
              />
              <a href={value.fixture_odds_info.register_link}>
                <img
                  id="stakesSiteImg"
                  src={value.fixture_odds_info.image}
                  alt=""
                  width="100%"
                  height="40px"
                />
              </a>
              <div id="inner-site-container">
                <!-- 
                STAKES DATA -->
                <div class="m-b-20 row-space-out">
                  <!-- 
                  Win Type
                  -->
                  <div class="text-center">
                    {#if fixtureDataVote.fixture_vote == "1"}
                      <p class="medium m-b-8 color-grey">Home win</p>
                    {:else if fixtureDataVote.fixture_vote == "X"}
                      <p class="medium m-b-8 color-grey">Draw</p>
                    {:else}
                      <p class="medium m-b-8 color-grey">Away win</p>
                    {/if}
                    <div class="input-value row-space-out medium text-center">
                      {#if viewportDesktop}
                        {#if fixtureDataVote.fixture_vote == "1"}
                          <img
                            src={randomFixture.home_team_logo}
                            alt=""
                            width="28px"
                            height="28px"
                          />
                        {:else if fixtureDataVote.fixture_vote == "X"}
                          <p class="medium row-space-out">
                            <span class="color-grey"> X </span>
                          </p>
                        {:else}
                          <img
                            src={randomFixture.away_team_logo}
                            alt=""
                            width="28px"
                            height="28px"
                          />
                        {/if}
                      {/if}
                      <input
                        class="medium text-center desktop-view-winnings"
                        type="number"
                        style="background: #FFFFFF;"
                        bind:value={fixtureDataVote.fixture_vote_val}
                        disabled
                      />
                    </div>
                  </div>

                  <!-- MULTIPLY SIGN -->
                  <img
                    src="./static/icon/icon-close.svg"
                    alt=""
                    width="16px"
                    height="16px"
                    style="margin-top: 25px;"
                  />

                  <!-- 
                  Stake 
                  -->
                  <div class="text-center">
                    <p class="medium m-b-8 color-grey">{translation.stake}</p>
                    <input
                      class="input-value medium text-center"
                      type="text"
                      bind:value={user_Stake_amount}
                    />
                  </div>

                  <!-- EQUALS SIGN -->
                  <img
                    src="./static/icon/icon-equally.svg"
                    alt=""
                    width="16px"
                    height="16px"
                    style="margin-top: 25px;"
                  />

                  <!-- 
                  Winnings 
                  -->
                  <div class="text-center">
                    <p class="medium m-b-8 color-grey">
                      {translation.winnings}
                    </p>
                    <input
                      class="input-value medium text-center"
                      type="number"
                      value={(
                        fixtureDataVote.fixture_vote_val * user_Stake_amount
                      ).toFixed(2)}
                      disabled
                    />
                  </div>
                </div>

                <!-- 
                PLACE BET BUTTON -->
                <a href={value.fixture_odds_info.register_link}>
                  <button style="width: 100%;" class="btn-primary m-b-12">
                    <p class="small">
                      {translation.place_bet}
                    </p>
                  </button>
                </a>

                <!-- 
                BETTING SITE INFO -->
                <p class="small text-center color-grey">
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
        <div id="live-stream-box">
          <!-- 
          live-streams-title-section -->
          <p class="large m-b-8" style="padding-left: 20px;">
            {translation.streams}
          </p>
          <!-- 
          live-streams-grid -->
          <div id="livestream-grid">
            {#each FINAL_FIXTURE_DATA_TV_STATIONS_DATA as tv_item}
              <a rel="external" href={tv_item.link}>
                <div class="tooltip">
                  <button class="live-stream-btn">
                    <img
                      src={tv_item.img}
                      alt={tv_item.alt}
                      title={tv_item.Name}
                      width="45px"
                      height="26px"
                    />
                  </button>
                  <p class="s_small tooltiptext">{tv_item.Name}</p>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 
      ~~~~~~~~~~~~~
      best-players (Both-Teams)
      -->
      <div id="best-players-box-out">
        <!--
        ~~~~~~~~~~~~~
        TEAM - HOME 
        -->
        <div class="best-players-box">
          <div class="row-space-start m-b-16">
            <img
              class="m-r-16"
              src={randomFixture.home_team_logo}
              alt=""
              width="32px"
              height="32px"
            />
            <p class="large">
              {randomFixture.home_team_name}
              {translation.players}
            </p>
          </div>
          <table class="table-best-player">
            <tr class="row-head m-b-16">
              <th class="rating-head">
                <p class="small color-grey">
                  {translation.rating}
                </p>
              </th>
              <th class="player-col">
                <p class="small color-grey">
                  {translation.player}
                </p>
              </th>
              {#if viewportDesktop}
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.matches}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.assists}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.goals}
                  </p>
                </th>
              {/if}
            </tr>
            <!-- PLAYER 1 -->
            <tr>
              <td>
                <div
                  class="rating-box"
                  class:bronze={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1 >=
                    0 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1 <
                      7}
                  class:silver={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1 >=
                    7 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1 <
                      9}
                  class:golden={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1 >=
                    9}
                >
                  <p class="medium">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_1}
                  </p>
                </div>
              </td>
              <td class="row-space-start">
                <img
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class="player-img"
                />
                <p class="small desktop-small">
                  {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1}
                </p>
              </td>
              {#if viewportDesktop}
                <td>
                  <p class="medium boxed-rating-matches">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1_appearances}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-assits">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1_assists}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-goals">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_1_goals}
                  </p>
                </td>
              {/if}
            </tr>
            <!-- PLAYER 2 -->
            <tr>
              <td>
                <div
                  class="rating-box"
                  class:bronze={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2 >=
                    0 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2 <
                      7}
                  class:silver={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2 >=
                    7 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2 <
                      9}
                  class:golden={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2 >=
                    9}
                >
                  <p class="medium">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_rating_player_2}
                  </p>
                </div>
              </td>
              <td class="row-space-start">
                <img
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class="player-img"
                />
                <p class="small desktop-small">
                  {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2}
                </p>
              </td>
              {#if viewportDesktop}
                <td>
                  <p class="medium boxed-rating-matches">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2_appearances}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-assits">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2_assists}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-goals">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.local_team_player_2_goals}
                  </p>
                </td>
              {/if}
            </tr>
          </table>
        </div>

        <!--
        ~~~~~~~~~~~~~
        TEAM - AWAY 
        -->
        <div class="best-players-box">
          <div class="row-space-start m-b-16">
            <img
              class="m-r-16"
              src={randomFixture.away_team_logo}
              alt=""
              width="32px"
              height="32px"
            />
            <p class="large">
              {randomFixture.away_team_name}
              {translation.players}
            </p>
          </div>
          <!--  -->
          <table class="table-best-player">
            <tr class="row-head m-b-16">
              <th class="rating-head">
                <p class="small color-grey">
                  {translation.rating}
                </p>
              </th>
              <th class="player-col">
                <p class="small color-grey">
                  {translation.player}
                </p>
              </th>
              {#if viewportDesktop}
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.matches}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.assists}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.goals}
                  </p>
                </th>
              {/if}
            </tr>
            <!-- PLAYER 1 -->
            <tr>
              <td>
                <div
                  class="rating-box"
                  class:bronze={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1 >=
                    0 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1 <
                      7}
                  class:silver={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1 >=
                    7 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1 <
                      9}
                  class:golden={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1 >=
                    9}
                >
                  <p class="medium">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_1}
                  </p>
                </div>
              </td>
              <td class="row-space-start">
                <img
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class="player-img"
                />
                <p class="small desktop-small">
                  {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1}
                </p>
              </td>
              {#if viewportDesktop}
                <td>
                  <p class="medium boxed-rating-matches">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1_appearances}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-assits">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1_assists}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-goals">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_1_goals}
                  </p>
                </td>
              {/if}
            </tr>
            <!-- PLAYER 2 -->
            <tr>
              <td>
                <div
                  class="rating-box"
                  class:bronze={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2 >=
                    0 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2 <
                      7}
                  class:silver={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2 >=
                    7 &&
                    FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2 <
                      9}
                  class:golden={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2 >=
                    9}
                >
                  <p class="medium">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_rating_player_2}
                  </p>
                </div>
              </td>
              <td class="row-space-start">
                <img
                  src={FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2_image_path}
                  alt=""
                  width="32px"
                  height="32px"
                  class="player-img"
                />
                <p class="small desktop-small">
                  {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2}
                </p>
              </td>
              {#if viewportDesktop}
                <td>
                  <p class="medium boxed-rating-matches">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2_appearances}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-assits">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2_assists}
                  </p>
                </td>
                <td>
                  <p class="medium boxed-rating-goals">
                    {FINAL_FIXTURE_DATA_BEST_PLAYERS_DATA.visitor_team_player_2_goals}
                  </p>
                </td>
              {/if}
            </tr>
          </table>
        </div>
      </div>

      <!-- 
      ~~~~~~~~~~~~~
      value-bets section
      -->
      {#if FINAL_VALUE_BETS_DATA != null}
        <div id="value-bets">
          <p class="large m-b-16">
            {translation.value_bet}
          </p>
          {#if !viewportDesktop}
            <div id="value-bets-container">
              <div id="value-bets-inner-info">
                <!-- 
                VALUE-BET INFO -->
                <div class="row-space-out">
                  <p class="medium color-grey">
                    {translation.bookmaker}
                  </p>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <img
                      src={FINAL_VALUE_BETS_DATA.image}
                      alt={FINAL_VALUE_BETS_DATA.bookmaker}
                      height="30px"
                      width="56px"
                    />
                  </a>
                </div>

                <div class="row-space-out">
                  <p class="medium color-grey">
                    {translation.type}
                  </p>
                  <p class="medium color-dark">
                    {translation.market_name}
                  </p>
                </div>

                <div class="row-space-out">
                  <p class="medium color-grey">
                    {translation.market}
                  </p>
                  <p class="medium color-dark">
                    {translation.market_type}
                  </p>
                </div>

                <div class="row-space-out">
                  <p class="medium color-grey">
                    {translation.odds}
                  </p>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <p
                      class="medium color-dark"
                      style="background: #FFFFFF;
                      border-radius: 4px;
                      padding: 4px 6px;"
                    >
                      {Math.round(
                        parseInt(FINAL_VALUE_BETS_DATA.odd.toString())
                      ).toFixed(2)}
                    </p>
                  </a>
                </div>

                <div class="row-space-out">
                  <p class="medium color-grey">
                    {translation.fair_odds}
                  </p>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <p
                      class="medium color-dark"
                      style="background: #FFFFFF;
                      border-radius: 4px;
                      padding: 4px 6px;"
                    >
                      {Math.round(
                        parseInt(FINAL_VALUE_BETS_DATA.fair_odd.toString())
                      ).toFixed(2)}
                    </p>
                  </a>
                </div>
              </div>
              <!-- 
              VALUE-BET BUTTON -->
              <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                <button
                  style="width: 100%; padding: 6px 0; border-radius: 4px;"
                  class="btn-primary"
                >
                  <p class="medium">
                    {translation.bet}
                  </p>
                </button>
              </a>
            </div>
          {:else}
            <table class="value_bets">
              <tr class="row-head m-b-16">
                <th class="text-center" style="text-align: start;">
                  <p class="small color-grey">
                    {translation.bookmaker}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.type}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.market}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.odds}
                  </p>
                </th>
                <th class="text-center">
                  <p class="small color-grey">
                    {translation.fair_odds}
                  </p>
                </th>
                <th class="text-center" />
              </tr>
              <!-- 
              VALUE-BET - ROW SINGLE -->
              <tr>
                <td class="text-center" style="text-align: start;">
                  <a
                    rel="external"
                    href={FINAL_VALUE_BETS_DATA.link}
                    style="height: 30px;"
                  >
                    <img
                      src={FINAL_VALUE_BETS_DATA.image}
                      alt={FINAL_VALUE_BETS_DATA.bookmaker}
                      height="30px"
                      width="56px"
                      style="object-fit: cover; border-radius: 4px;"
                    />
                  </a>
                </td>
                <td>
                  <p class="medium text-center">
                    {translation.market_name}
                  </p>
                </td>
                <td>
                  <p class="medium text-center">
                    {translation.market_type}
                  </p>
                </td>
                <td>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <p
                      class="medium max-height: 30px; boxed-rating-value-bets active_p_btn"
                    >
                      {Math.round(
                        parseInt(FINAL_VALUE_BETS_DATA.odd.toString())
                      ).toFixed(2)}
                    </p>
                  </a>
                </td>
                <td>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <p
                      class="medium max-height: 30px; boxed-rating-value-bets active_p_btn"
                    >
                      {Math.round(
                        parseInt(FINAL_VALUE_BETS_DATA.fair_odd)
                      ).toFixed(2)}
                    </p>
                  </a>
                </td>
                <td>
                  <a rel="external" href={FINAL_VALUE_BETS_DATA.link}>
                    <button
                      style="width: 100%; padding: 6px 0; max-height: 30px; border-radius: 4px;"
                      class="btn-primary"
                    >
                      <p class="medium">
                        {translation.bet}
                      </p>
                    </button>
                  </a>
                </td>
              </tr>
            </table>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<!-- ===============
  COMPONENT STYLE
==================== -->
<style>
  #live-score-container {
    display: grid;
    background: #ffffff;
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    width: 100%;
    max-width: 343px;
  }

  #fixture-league-title {
    padding: 10px 20px;
    box-shadow: inset 0px -1px 0px #ebebeb;
  }

  #fixture-visual-box {
    padding: 25px 20px 20px 20px;
    box-shadow: inset 0px -1px 0px #ebebeb;
  }

  #fixture-data {
    display: grid;
    grid-auto-flow: column;
    justify-items: center;
    align-items: stretch;
    justify-content: center;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;
  }

  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type="number"] {
    -moz-appearance: textfield;
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
    background: #f2f2f2;
    border: 1px solid #cccccc;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 14px 16px;
    transition: all ease 0.15s;
    box-shadow: none !important;
    width: 96px;
    height: 48px;
  }
  .cast-vote-btn.active {
    background: #ffffff;
    border: 1px solid #f5620f;
    box-sizing: border-box;
    border-radius: 8px;
    opacity: 1 !important;
  }
  .cast-vote-btn:disabled {
    opacity: 0.5;
  }
  .probablitiy-text {
    text-align: center;
    color: #8c8c8c;
    width: min-content;
  }

  .active_p {
    color: #f5620f !important;
  }

  .active_p_btn:hover {
    color: #f5620f !important;
  }

  #site-bet-box {
    margin-top: 35px;
    background: #f2f2f2;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
  }
  #inner-site-container {
    padding: 20px 12px;
    background: #f2f2f2;
    border-radius: 8px;
  }
  #inner-site-container button {
    height: 46px;
  }
  .input-value {
    -moz-appearance: textfield;
    background: #ffffff;
    border-radius: 8px;
    padding: 14px;
    height: 48px;
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
    padding: 20px 0;
    box-shadow: inset 0px -1px 0px #ebebeb;
    overflow: hidden;
    width: inherit;
  }
  #livestream-grid {
    display: grid;
    grid-auto-flow: column;
    gap: 8px;
    overflow-y: scroll;
    padding: 0 20px;
  }
  /* Hide scrollbar for Chrome, Safari and Opera */
  #livestream-grid::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  #livestream-grid {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
  .live-stream-btn {
    border: 1px solid #cccccc;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 7px 12px;
    /* padding: 0 !important; */
    background-color: transparent;
    box-shadow: none !important;
    width: 68px;
    height: 40px;
  }
  .live-stream-btn img {
    object-fit: contain;
    width: 100%;
  }

  /* ====================
    best-players-container 
  ==================== */

  #best-players-box-out {
  }
  .best-players-box {
    padding: 20px;
    box-shadow: inset 0px -1px 0px #ebebeb;
  }

  table.table-best-player,
  table.value_bets {
    text-align: left;
    border-collapse: collapse;
    width: 100%;
  }
  table.table-best-player .row-head,
  table.value_bets .row-head {
    background: #f2f2f2;
    border-radius: 2px;
  }
  table td,
  table th {
    padding: 7px 12px;
    /* padding: 7px 0; */
    vertical-align: middle;
  }
  table.table-best-player tr td:first-child {
    padding-left: 0;
  }

  table tr td:last-child {
    padding-right: 0;
  }

  table tr td {
    padding-top: 16px !important;
    padding-bottom: 0px;
  }

  .rating-head {
    width: 59px;
  }
  .rating-box {
    width: fit-content;
    border-radius: 30px;
    padding: 1.5px 8px;
    color: white;
  }
  .rating-box p {
    color: white;
  }
  .golden {
    background: #ffb904;
  }
  .silver {
    background: #a1a1a1;
  }
  .bronze {
    background: #dbb884;
  }

  .tooltip .tooltiptext {
    display: none;
  }

  .player-img {
    border: 1px solid #cccccc;
    border-radius: 50%;
    margin-right: 8px;
  }

  /* ====================
    value-bets-container 
  ==================== */

  #value-bets {
    padding: 20px;
  }
  #value-bets-container {
    background: #f2f2f2;
    border-radius: 2px;
    width: 100%;
  }
  #value-bets-inner-info {
    padding: 12px;
    display: grid;
    grid-auto-rows: 1fr;
    justify-items: center;
    align-items: center;
    gap: 4px;
  }
  #value-bets-inner-info img {
    border-radius: 4px;
    width: 56px;
    object-fit: cover;
  }

  /* ====================
    responsivness
  ==================== */

  /* MOBILE RESPONSIVNESS */
  @media only screen and (min-width: 700px) {
    #inner-site-container button {
      height: 44px;
    }

    .boxed-rating-matches {
      background: #ffffff;
      border: 1px solid #e6e6e6;
      box-sizing: border-box;
      border-radius: 4px;
      text-align: center;
      padding: 5px 0;
      max-height: 30px;
      width: 64px;
    }
    .boxed-rating-assits,
    .boxed-rating-value-bets {
      background: #f2f2f2;
      border-radius: 4px;
      text-align: center;
      padding: 5px 0;
      max-height: 30px;
      width: 64px;
    }
    .boxed-rating-goals {
      background: #e6e6e6;
      border-radius: 4px;
      text-align: center;
      padding: 5px 0;
      max-height: 30px;
      width: 64px;
    }

    table.table-best-player tr th:first-child p {
      left: 10%;
      position: relative;
    }
    table.table-best-player tr th:last-child p {
      left: 10%;
      position: relative;
    }

    table tr td:first-child {
      padding-left: 10px;
    }
    table td,
    table th {
      padding: 7px 10px;
    }

    #live-score-container {
      width: 100%;
      max-width: 700px;
    }
    #livestream-grid {
      grid-auto-flow: unset;
      overflow-y: visible;
      grid-template-columns: repeat(auto-fill, 71px);
    }
    .input-value {
      width: 100%;
      max-width: 164px;
    }
    .cast-vote-btn {
      min-width: 206px;
      width: 100%;
      height: 48px;
    }
    .desktop-view-winnings {
      padding: 0;
      text-align: end;
    }
    .desktop-small {
      font-size: 14px !important;
    }
    .desktop-medium {
      font-size: 16px !important;
    }
    .desktop-x-large {
      font-size: 20px !important;
    }
    .live-stream-btn {
      padding: 0 5px;
    }
    .player-col {
      width: 357px;
    }
    .rating-head {
      width: 44px;
    }
    table.value_bets tr th:nth-child(-n + 3),
    table.value_bets tr td:nth-child(-n + 3) {
      max-width: 72px !important;
      padding-right: 24px;
    }
    table.value_bets tr th:nth-child(3),
    table.value_bets tr td:nth-child(3) {
      padding-right: 190px !important;
    }
    table.value_bets tr th:nth-last-child(-n + 3),
    table.value_bets tr td:nth-last-child(-n + 3),
    table.value_bets tr td button {
      width: 64px !important;
    }
    .player-img {
      margin-right: 16px;
    }
    table tr:nth-child(2) td {
      padding-top: 20px !important;
    }
  }

  /* DESKTOP RESPONSIVNESS */
  @media only screen and (min-width: 1024px) {
    #live-score-container {
      width: 100%;
      max-width: 560px;
    }
    .input-value {
      width: 100%;
      max-width: 133px;
    }

    .tooltip .tooltiptext {
      display: unset !important;
    }

    .tooltip {
      position: relative;
      display: inline-block;
    }
    .tooltip .tooltiptext {
      visibility: hidden;
      width: 120px;
      color: #fff;
      text-align: center;
      padding: 10px;
      position: absolute;
      z-index: 1;
      top: -100%;
      left: 50%;
      margin-left: -60px;
      background: #4b4b4b;
      box-shadow: inset 0px -1px 0px #3c3c3c;
      border-radius: 4px;
      transition: all 0.15s ease-in;
    }
    .tooltip:hover .tooltiptext {
      visibility: visible !important;
    }
    .cast-vote-btn {
      min-width: 160px;
      width: 100%;
      height: 48px;
    }

    table.value_bets tr th:nth-child(-n + 3),
    table.value_bets tr td:nth-child(-n + 3) {
      max-width: 72px !important;
      padding-right: 24px;
    }
    table.value_bets tr th:nth-last-child(-n + 3),
    table.value_bets tr td:nth-last-child(-n + 3),
    table.value_bets tr td button {
      width: 64px !important;
    }

    table.value_bets tr th:nth-child(3),
    table.value_bets tr td:nth-child(3) {
      padding-right: 24px !important;
    }

    table.table-best-player th:first-child {
      width: 44px !important;
    }
    table.table-best-player tr th:first-child,
    table.table-best-player tr td:first-child {
      /* padding-right: 0px; */
    }
    table.table-best-player th.player-col {
      /* min-width: 226px !important;
      max-width: 226px !important; */
      width: 100%;
    }
    .player-img {
      margin-right: 16px;
    }
  }
</style>
