<!-- ===============
	COMPONENT JS (w/ TS)
==================== -->

<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from "svelte/transition";
  import { query } from "svelte-apollo"
  import { GET_WEEK_FIXTURES } from '../graphql/query'

  import ContentLoader from "svelte-content-loader"

  import type { ContentLoaderProps } from "../models/content-loader-interface"

  const weekFixturesData = query(GET_WEEK_FIXTURES)

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * Decalring the ContentLoaderProps
   * values through the interface
  */
  let contentLoaderProps: ContentLoaderProps = {
    width: `100%`,
    height: `100%`,
    primaryColor: "#f9f9f9",
  }

  /**
   * Description:
   * ~~~~~~~~~~~~~~~~~~~
   * onMount() function that verifies that
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

  #btn-vote-container {

  }

  #live-stream-box {
    padding: 20px;
    box-shadow: inset 0px -1px 0px #EBEBEB;
  }

  #best-players-box-out {

  } .best-players-box {
      padding: 20px;
      box-shadow: inset 0px -1px 0px #EBEBEB;
  }

  #value-bets {
    padding: 20px;
  } #value-bets table.value-bet-site {
    padding: 12px;
    background: #F2F2F2;
    border-radius: 2px;
    width: 100%;
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

{#if $weekFixturesData.loading}
  <!-- 
  ~~~~~~~~~~~~~~~
  promise is pending -->
  <ContentLoader {...contentLoaderProps} />
{:else if $weekFixturesData.error}
  <!-- 
  ~~~~~~~~~~~~~~~
  promise ERROR -->
  <p>There has been an error!</p>
{:else if $weekFixturesData.data}
  <!-- 
  ~~~~~~~~~~~~~~~
  promise was fulfilled 
  -->
  <div id='live-score-container'>
    <!--
    ~~~~~~~~~~~~~~
    league-game-title 
    -->
    <div id='fixture-league-title' 
      class='row-space-start'>
      <img
        src="" 
        alt=""
        width="24px"
        height="18px"
      />
      <p>
        Champions League (Round 2)
      </p>
    </div>
   
    <div id='fixture-visual-box'>
      <!-- 
      ~~~~~~~~~~~~~~
      fixture-visual-info
      -->
      <div class='row-space-out'>
        <!-- 
        first-team -->
        <div class="fixture-team">
          <img 
            src="" 
            alt=""
            width="72px" height="72px"
          />
          <p>Chelsea</p>
        </div>
        <!-- 
        fixture-timer-clock -->
        <div>
          <p>12:07:32</p>
          <p>3rd Jul 21, 10:05h</p>
        </div>
        <!-- 
        second-team -->
        <div class="fixture-team">
          <img 
            src="" 
            alt=""
            width="72px" height="72px"
          />
          <p>Chelsea</p>
        </div>
      </div>
      <p>Vote to see results</p>
      <!-- 
      ~~~~~~~~~~~~~~
      voting-results-btn
      -->
      <div id='btn-vote-container'
        class='row-space-out'>
        <div>
          <button>
            1 1.3
          </button>
        </div>

        <div>
          <button>
            X 3.66
          </button>
        </div>

        <div>
          <button>
            2 1.34
          </button>
        </div>
      </div>
    </div>
  
    <!-- 
    ~~~~~~~~~~~~~
    live-streams
    -->
    <div id='live-stream-box'>
      <p>Live Streams</p>
      <div>
        <button class='live-stream-icon'>
        </button>
      </div>
    </div>

    <!-- 
    ~~~~~~~~~~~~~
    best-players (Both-Teams)
    -->
    <div id='best-players-box-out'>
      <!--
      ~~~~~~~~~~~~~
      TEAM - HOME -->
      <div class='best-players-box'>
        <div class='row-space-start'>
          <img 
            src="" 
            alt=""
            width="32px"
            height="32px"
          />
          <p>Chelsea best players</p>
        </div>
        <table>
          <tr>
            <th>
              <p>Rating</p>
            </th>
            <th>
              <p>Player</p>
            </th>
          </tr>
          <tr>
            <td>
              1
            </td>
            <td class='row-space-start'>
              <img 
                src="" 
                alt=""
                width="32px"
                height="32px"
              />
              <p>Romelu Lukaku</p>
            </td>
          </tr>
        </table>
      </div>
      <!--
      ~~~~~~~~~~~~~
      TEAM - AWAY -->
      <div class='best-players-box'>
        <div class='row-space-start'>
          <img 
            src="" 
            alt=""
            width="32px"
            height="32px"
          />
          <p>Chelsea best players</p>
        </div>
        <table>
          <tr>
            <th>
              <p>Rating</p>
            </th>
            <th>
              <p>Player</p>
            </th>
          </tr>
          <tr>
            <td>
              1
            </td>
            <td class='row-space-start'>
              <img 
                src="" 
                alt=""
                width="32px"
                height="32px"
              />
              <p>Romelu Lukaku</p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- 
    ~~~~~~~~~~~~~
    value-bets
    -->
    <div id='value-bets'>
      <p>Value Bet</p>
      <!-- TODO: Iterative Value Bets Data; -->
      <table class='value-bet-site'>
        <tr>
          <td>
            <p>
              Bookmaker
            </p>
          </td>
          <td>
            <img 
              src="" 
              alt=""
            />
          </td>
        </tr>
        <tr>
          <td>
            <p>
              Type
            </p>
          </td>
          <td>
            <img 
              src="" 
              alt=""
            />
          </td>
        </tr>
        <tr>
          <td>
            <p>
              Market
            </p>
          </td>
          <td>
            <img 
              src="" 
              alt=""
            />
          </td>
        </tr>
        <tr>
          <td>
            <p>
              Odds
            </p>
          </td>
          <td>
            <img 
              src="" 
              alt=""
            />
          </td>
        </tr>
        <tr>
          <td>
            <p>
              Fair odds
            </p>
          </td>
          <td>
            <img 
              src="" 
              alt=""
            />
          </td>
        </tr>
      </table>
      <button>
        <p>
          Place Bet
        </p>
      </button>
    </div>

  </div>
{/if}